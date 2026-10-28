import asyncio
import re
import unicodedata
from typing import Optional, Callable
import httpx

from app.core.config import settings

class AiFormatterService:
    def __init__(self, user_settings: Optional[dict] = None):
        self.user_settings = user_settings or {}
        self.openrouter_api_key = (
            self.user_settings.get("custom_openrouter_api_key") or
            self.user_settings.get("openrouter_api_key") or
            ""
        )
        self.forbidden_keywords = self.user_settings.get("forbidden_keywords", [])
        self.template = self.user_settings.get("message_template", "")
        self.prompt_template = self.user_settings.get("gemini_prompt", "")
        self.model_1 = self.user_settings.get("openrouter_model_1", "google/gemma-2-9b-it:free")
        self.model_2 = self.user_settings.get("openrouter_model_2", "meta-llama/llama-3-8b-instruct:free")
        self.ai_enabled = self.user_settings.get("ai_enabled", True)
        self.footer_text = self.user_settings.get("footer_text", "")


    def remove_forbidden_lines(self, text: str) -> str:
        """Removes lines containing forbidden keywords from the text."""
        if not self.forbidden_keywords or not text:
            return text

        def normalize_for_comparison(val: str) -> str:
            norm = unicodedata.normalize("NFKC", val).casefold()
            return re.sub(r"\s+", " ", norm).strip()

        normalized_keywords = [
            normalize_for_comparison(kw) for kw in self.forbidden_keywords if kw.strip()
        ]
        lines = text.split("\n")
        cleaned_lines = []

        for line in lines:
            norm_line = normalize_for_comparison(line)
            if not any(kw in norm_line for kw in normalized_keywords):
                cleaned_lines.append(line)

        return "\n".join(cleaned_lines)

    def append_footer(self, text: str, custom_footer: Optional[str] = None) -> str:
        """Appends the standard or custom footer text if not already present."""
        footer = (custom_footer or self.footer_text).strip()
        if not footer or footer in text:
            return text
        return f"{text.strip()}\n\n{footer}"

    async def format_text(
        self,
        text: str,
        template_override: Optional[str] = None,
        prompt_override: Optional[str] = None,
        log_func: Callable[[str], None] = print
    ) -> str:
        """Formats promo or coupon text using OpenRouter AI with dual-model fallback."""
        cleaned_input = self.remove_forbidden_lines(text)

        if not self.ai_enabled:
            log_func("ℹ️ Formatação por IA desativada nas configurações.")
            return cleaned_input

        if not self.openrouter_api_key:
            log_func("⚠️ OPENROUTER_API_KEY ausente. Usando texto sem IA.")
            return cleaned_input

        chosen_template = template_override or self.template
        chosen_prompt = prompt_override or self.prompt_template

        if not chosen_prompt:
            chosen_prompt = (
                "Você é um assistente que reformata textos de promoções para grupos de descontos.\n"
                "Extraia as informações do texto e preencha o modelo:\n"
                "{template}\n"
                "Regras: NUNCA invente nada. Remova linhas de campos ausentes."
            )

        full_prompt = chosen_prompt.replace("{template}", chosen_template)
        full_prompt = f"{full_prompt}\n\nTexto original:\n\"\"\"{cleaned_input}\"\"\""

        headers = {
            "Authorization": f"Bearer {self.openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://pardalpromos.com.br",
            "X-Title": "Pardal PromoHub",
        }

        async with httpx.AsyncClient() as client:
            # Attempt 1: Model 1
            for attempt in range(1, 3):
                try:
                    payload = {
                        "model": self.model_1,
                        "messages": [{"role": "user", "content": full_prompt}]
                    }
                    resp = await client.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        headers=headers,
                        json=payload,
                        timeout=40.0
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    formatted = data["choices"][0]["message"]["content"].strip()
                    log_func(f"🤖 Texto formatado com sucesso via {self.model_1}")
                    return self.remove_forbidden_lines(formatted)
                except httpx.HTTPStatusError as e:
                    if e.response.status_code in [429, 503, 504]:
                        log_func(f"⚠️ OpenRouter {self.model_1} ocupado (tentativa {attempt}/2). Aguardando...")
                        await asyncio.sleep(2)
                    else:
                        log_func(f"❌ Erro OpenRouter {self.model_1}: {e}")
                        break
                except Exception as e:
                    log_func(f"❌ Falha no modelo 1: {e}")
                    break

            # Attempt 2: Fallback to Model 2
            log_func(f"🔁 Tentando fallback com {self.model_2}...")
            for attempt in range(1, 3):
                try:
                    payload = {
                        "model": self.model_2,
                        "messages": [{"role": "user", "content": full_prompt}]
                    }
                    resp = await client.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        headers=headers,
                        json=payload,
                        timeout=40.0
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    formatted = data["choices"][0]["message"]["content"].strip()
                    log_func(f"🤖 Texto formatado com sucesso via fallback {self.model_2}")
                    return self.remove_forbidden_lines(formatted)
                except Exception as e:
                    log_func(f"⚠️ Falha no fallback {self.model_2}: {e}")
                    break

        log_func("⚠️ Falha em ambos os modelos OpenRouter. Mantendo texto original.")
        return cleaned_input
