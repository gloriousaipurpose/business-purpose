import logging
import json
from typing import Type, TypeVar, Optional, Tuple
from pydantic import BaseModel
from app.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

# Cost per 1k tokens estimate
INPUT_TOKEN_COST_PER_1K = 0.00059
OUTPUT_TOKEN_COST_PER_1K = 0.00079

class LLMClient:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL or "openai/gpt-oss-120b"
        self._client: Optional[object] = None

    def _get_client(self):
        api_key = settings.GROQ_API_KEY or self.api_key
        if not api_key:
            raise ValueError("GROQ_API_KEY is not set in environment settings.")
        if self._client is None:
            try:
                from groq import AsyncGroq
                self._client = AsyncGroq(api_key=api_key)
            except ImportError:
                raise RuntimeError("The 'groq' package is not installed. Please run: pip install groq")
        return self._client

    async def generate_json(
        self,
        prompt: str,
        response_schema: Type[T],
        system_prompt: str = "You are a JSON-only response engine. Return strictly valid JSON.",
        max_retries: int = 2
    ) -> Tuple[T, int, float]:
        """
        Sends prompt to Groq API with JSON mode enabled.
        Validates against Pydantic schema `response_schema`.
        Returns tuple: (validated_pydantic_object, tokens_used, estimated_cost)
        """
        client = self._get_client()
        attempts = 0
        last_error = None

        total_tokens = 0
        total_cost = 0.0
        model_name = settings.GROQ_MODEL or self.model

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]

        while attempts <= max_retries:
            attempts += 1
            try:
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
                logger.info(f"Groq call successful using {model_name} (Attempt {attempts}): {tokens} tokens, ${cost:.6f}")
                return validated_obj, total_tokens, total_cost

            except Exception as e:
                logger.warning(f"Groq generation attempt {attempts} using {model_name} failed: {e}")
                last_error = e
                messages.append({"role": "user", "content": f"Your previous output failed validation: {str(e)}. Please correct and return strictly valid JSON matching the schema."})

        raise RuntimeError(f"Failed to generate valid JSON from Groq ({model_name}) after {max_retries + 1} attempts. Last error: {last_error}")

llm_client = LLMClient()
