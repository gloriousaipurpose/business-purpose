import logging
import json
import asyncio
from typing import Type, TypeVar, Optional, Tuple, List
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
        max_retries: int = 4
    ) -> Tuple[T, int, float]:
        """
        Sends prompt to Groq API with JSON mode enabled.
        Paces requests and automatically rotates API keys & fallback models on 429 Rate Limits.
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

        total_attempts_allowed = max_retries * max(1, len(self._keys)) * len(AVAILABLE_GROQ_MODELS)

        while attempts < total_attempts_allowed:
            attempts += 1
            client, current_key, key_idx = self._get_current_client()
            model_name = self.get_active_model()

            try:
                # Small 1-second pacer delay
                await asyncio.sleep(1.0)

                response = await client.chat.completions.create(
                    model=model_name,
                    messages=messages,
                    response_format={"type": "json_object"},
                    temperature=0.2,
                    max_tokens=4000
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

                if "429" in err_str or "Rate limit" in err_str or "limit" in err_str.lower():
                    self._rotate_key_or_model()
                    await asyncio.sleep(0.5)

                messages.append({"role": "user", "content": f"Your previous output failed validation: {err_str}. Please correct and return strictly valid JSON matching the schema."})

        raise RuntimeError(f"Failed to generate valid JSON from Groq after {attempts} attempts. Last error: {last_error}")

llm_client = LLMClient()
