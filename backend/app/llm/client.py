import logging
import json
import asyncio
import re
import httpx
from typing import Type, TypeVar, Optional, Tuple, List, Dict, Any
from pydantic import BaseModel
from app.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

# Cost per 1k tokens estimate
INPUT_TOKEN_COST_PER_1K = 0.00059
OUTPUT_TOKEN_COST_PER_1K = 0.00079

AVAILABLE_GROQ_MODELS = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b"
]


def attempt_repair_truncated_json(raw: str) -> Optional[dict]:
    """
    Attempts to salvage valid dictionary data from a truncated JSON string,
    such as when the LLM generation stops prematurely due to max_tokens limit.
    """
    if not raw or not isinstance(raw, str):
        return None

    # First test if it is already parseable
    try:
        data = json.loads(raw)
        if isinstance(data, dict):
            return data
    except Exception:
        pass

    # Walk backwards looking for structural delimiters (object end or element comma)
    for i in range(len(raw) - 1, 0, -1):
        ch = raw[i]
        if ch in ('}', ','):
            prefix = raw[:i+1] if ch == '}' else raw[:i]
            prefix = prefix.rstrip()
            for closing in [']}', '}', '}}', ']}}', ']}']:
                candidate = prefix + closing
                try:
                    data = json.loads(candidate)
                    if isinstance(data, dict):
                        return data
                except Exception:
                    continue
    return None


def extract_failed_generation_from_error(e: Exception) -> Optional[str]:
    """Extracts failed_generation string from Groq API error object if present."""
    # Method 1: e.body dictionary
    body = getattr(e, 'body', None)
    if isinstance(body, dict):
        err = body.get('error', {})
        if isinstance(err, dict) and 'failed_generation' in err:
            return err['failed_generation']

    # Method 2: e.response.json()
    resp = getattr(e, 'response', None)
    if resp and hasattr(resp, 'json'):
        try:
            rjson = resp.json()
            if isinstance(rjson, dict):
                err = rjson.get('error', {})
                if isinstance(err, dict) and 'failed_generation' in err:
                    return err['failed_generation']
        except Exception:
            pass

    # Method 3: Regex match on str(e)
    err_str = str(e)
    if "'failed_generation':" in err_str or '"failed_generation":' in err_str:
        match = re.search(r"['\"]failed_generation['\"]\s*:\s*(['\"])(.*?)(?:\1\s*,\s*['\"]|\1\s*\})", err_str, re.DOTALL)
        if match:
            raw = match.group(2)
            try:
                return raw.encode('utf-8').decode('unicode_escape')
            except Exception:
                return raw
    return None


class LLMClient:
    def __init__(self):
        self.model = settings.GROQ_MODEL or "openai/gpt-oss-120b"
        self._keys: List[str] = []
        self._clients: List[object] = []
        self._current_key_idx: int = 0
        self._current_model_idx: int = 0
        self._init_keys()

    def _init_keys(self):
        """Initializes pool of Groq API keys from GROQ_API_KEYS or GROQ_API_KEY."""
        raw_keys = settings.GROQ_API_KEYS or settings.GROQ_API_KEY or ""
        keys = [k.strip() for k in raw_keys.split(",") if k.strip()]
        self._keys = keys

    def _get_current_client(self):
        self._init_keys()
        if not self._keys:
            raise ValueError("No Groq API keys configured in environment settings (GROQ_API_KEY or GROQ_API_KEYS).")
        
        while len(self._clients) < len(self._keys):
            self._clients.append(None)

        idx = self._current_key_idx % len(self._keys)
        if self._clients[idx] is None:
            try:
                from groq import AsyncGroq
                key = self._keys[idx]
                self._clients[idx] = AsyncGroq(api_key=key)
            except ImportError:
                raise RuntimeError("The 'groq' package is not installed. Please run: pip install groq")
        
        return self._clients[idx], self._keys[idx], idx

    def _rotate_key_or_model(self):
        """Rotates to the next Groq API key or model in the pool on 429 rate limit."""
        if len(self._keys) > 1:
            prev_idx = self._current_key_idx % len(self._keys)
            self._current_key_idx = (self._current_key_idx + 1) % len(self._keys)
            new_idx = self._current_key_idx % len(self._keys)
            
            # If we completed a full lap around all keys, switch model fallback!
            if new_idx == 0:
                self._current_model_idx = (self._current_model_idx + 1) % len(AVAILABLE_GROQ_MODELS)
                new_model = AVAILABLE_GROQ_MODELS[self._current_model_idx]
                logger.info(f"Cycled all Groq API keys. Switched Model Fallback ➔ {new_model}")
            else:
                logger.info(f"Rotated Groq API Key on 429 Rate Limit: Switched key #{prev_idx + 1} ➔ #{new_idx + 1} of {len(self._keys)}")
        else:
            self._current_model_idx = (self._current_model_idx + 1) % len(AVAILABLE_GROQ_MODELS)
            new_model = AVAILABLE_GROQ_MODELS[self._current_model_idx]
            logger.info(f"Groq API Key rate limited. Switched Model Fallback ➔ {new_model}")

    def get_active_model(self) -> str:
        if settings.GROQ_MODEL and self._current_model_idx == 0 and settings.GROQ_MODEL in AVAILABLE_GROQ_MODELS:
            return settings.GROQ_MODEL
        return AVAILABLE_GROQ_MODELS[self._current_model_idx % len(AVAILABLE_GROQ_MODELS)]

    async def generate_json(
        self,
        prompt: str,
        response_schema: Type[T],
        system_prompt: str = "You are a JSON-only response engine. Return strictly valid JSON.",
        max_retries: int = 4,
        max_tokens: int = 6000
    ) -> Tuple[T, int, float]:
        """
        Sends prompt to Groq API with JSON mode enabled.
        Paces requests and automatically rotates API keys & fallback models on 429/413 Rate Limits.
        Validates against Pydantic schema `response_schema`.
        Returns tuple: (validated_pydantic_object, tokens_used, estimated_cost)
        """
        attempts = 0
        last_error = None

        total_tokens = 0
        total_cost = 0.0

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]

        total_attempts_allowed = min(5, max(2, len(AVAILABLE_GROQ_MODELS)))

        while attempts < total_attempts_allowed:
            attempts += 1
            client, current_key, key_idx = self._get_current_client()
            model_name = self.get_active_model()

            try:
                # 0.5s pace delay
                await asyncio.sleep(0.5)

                response = await client.chat.completions.create(
                    model=model_name,
                    messages=messages,
                    response_format={"type": "json_object"},
                    temperature=0.2,
                    max_tokens=max_tokens
                )

                usage = response.usage
                prompt_tokens = usage.prompt_tokens if usage else 0
                completion_tokens = usage.completion_tokens if usage else 0
                tokens = prompt_tokens + completion_tokens

                cost = (prompt_tokens / 1000.0 * INPUT_TOKEN_COST_PER_1K) + (completion_tokens / 1000.0 * OUTPUT_TOKEN_COST_PER_1K)
                total_tokens += tokens
                total_cost += cost

                raw_content = response.choices[0].message.content or "{}"
                
                # Parse JSON
                parsed_data = json.loads(raw_content)
                
                # Validate with Pydantic
                validated_obj = response_schema.model_validate(parsed_data)
                logger.info(f"Groq call successful using {model_name} (Key #{key_idx + 1}): {tokens} tokens, ${cost:.6f}")
                return validated_obj, total_tokens, total_cost

            except Exception as e:
                err_str = str(e)
                logger.warning(f"Groq attempt {attempts} (Model: {model_name}, Key #{key_idx + 1}) failed: {err_str}")
                last_error = e

                # Check if Groq returned failed_generation due to json_validate_failed (token truncation)
                failed_gen = extract_failed_generation_from_error(e)
                if failed_gen:
                    salvaged = attempt_repair_truncated_json(failed_gen)
                    if salvaged:
                        try:
                            validated_obj = response_schema.model_validate(salvaged)
                            logger.info(f"Successfully salvaged and validated partial JSON from Groq failed_generation on attempt {attempts}")
                            return validated_obj, total_tokens or 3000, total_cost or 0.0025
                        except Exception as val_err:
                            logger.warning(f"Salvaged JSON did not pass schema validation: {val_err}")

                # If token limit was hit or JSON failed validation, bump max_tokens for next attempt
                if "json_validate_failed" in err_str or "length" in err_str.lower() or "token" in err_str.lower():
                    max_tokens = min(8192, int(max_tokens * 1.3))

                # Immediately rotate model on 404 (model not found) or rate limits
                if "404" in err_str or "model_not_found" in err_str or "429" in err_str or "413" in err_str or "limit" in err_str.lower():
                    self._rotate_key_or_model()
                    await asyncio.sleep(1.0)
                else:
                    await asyncio.sleep(1.0)

        # Final salvage fallback check before raising RuntimeError
        if last_error:
            failed_gen = extract_failed_generation_from_error(last_error)
            if failed_gen:
                salvaged = attempt_repair_truncated_json(failed_gen)
                if salvaged:
                    try:
                        validated_obj = response_schema.model_validate(salvaged)
                        logger.info("Successfully salvaged JSON from Groq failed_generation as final fallback before error.")
                        return validated_obj, total_tokens or 3000, total_cost or 0.0025
                    except Exception as final_val_err:
                        logger.warning(f"Final salvage attempt did not validate: {final_val_err}")

        # ── GEMINI BACKUP ENGINE ──
        # If all Groq attempts are exhausted, seamlessly failover to Google Gemini!
        gemini_key = getattr(settings, "GEMINI_API_KEY", "") or ""
        if gemini_key.strip():
            logger.info("All Groq attempts failed. Invoking Google Gemini backup engine...")
            try:
                gemini_res, g_tokens, g_cost = await self._call_gemini_fallback(
                    prompt=prompt,
                    response_schema=response_schema,
                    system_prompt=system_prompt,
                    max_tokens=max_tokens
                )
                return gemini_res, g_tokens, g_cost
            except Exception as gemini_err:
                logger.error(f"Gemini backup engine also failed: {gemini_err}")
                last_error = gemini_err

        raise RuntimeError(f"Failed to generate valid JSON from Groq & Gemini after {attempts} attempts. Last error: {last_error}")

    async def _call_gemini_fallback(
        self,
        prompt: str,
        response_schema: Type[T],
        system_prompt: str,
        max_tokens: int = 6000
    ) -> Tuple[T, int, float]:
        """
        Executes Google Gemini REST API call as backup with JSON Mode enabled.
        """
        api_key = getattr(settings, "GEMINI_API_KEY", "")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not configured.")

        # Candidate Gemini models in preference order
        configured_model = getattr(settings, "GEMINI_MODEL", "") or "gemini-flash-latest"
        model_candidates = [
            configured_model,
            "gemini-flash-latest",
            "gemini-2.5-flash",
            "gemini-pro-latest"
        ]
        models_to_try = list(dict.fromkeys([m for m in model_candidates if m]))

        payload = {
            "contents": [
                {
                    "parts": [{"text": f"SYSTEM INSTRUCTION:\n{system_prompt}\n\nUSER REQUEST:\n{prompt}"}]
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.2,
                "maxOutputTokens": min(8192, max_tokens)
            }
        }

        last_gemini_err = None

        async with httpx.AsyncClient(timeout=60.0) as http_client:
            for model_name in models_to_try:
                clean_model = model_name.replace("models/", "")
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{clean_model}:generateContent?key={api_key}"
                try:
                    resp = await http_client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if not candidates:
                            raise ValueError(f"Gemini returned no candidates: {data}")
                        parts = candidates[0].get("content", {}).get("parts", [])
                        raw_text = parts[0].get("text", "") if parts else "{}"

                        # Parse JSON
                        try:
                            parsed = json.loads(raw_text)
                        except Exception:
                            # Attempt repair if truncated
                            parsed = attempt_repair_truncated_json(raw_text)
                            if not parsed:
                                raise

                        validated = response_schema.model_validate(parsed)
                        logger.info(f"Gemini backup succeeded using model: {clean_model}")
                        return validated, 2500, 0.0 # Free tier!
                    else:
                        err_content = resp.text
                        logger.warning(f"Gemini candidate model {clean_model} returned HTTP {resp.status_code}: {err_content[:200]}")
                        last_gemini_err = RuntimeError(f"Gemini HTTP {resp.status_code}: {err_content[:200]}")
                except Exception as ex:
                    logger.warning(f"Gemini model {clean_model} attempt failed: {ex}")
                    last_gemini_err = ex

        raise RuntimeError(f"All Gemini backup attempts failed. Last error: {last_gemini_err}")


llm_client = LLMClient()
