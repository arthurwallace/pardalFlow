from pydantic import BaseModel
from typing import List, Optional, Union

DEFAULT_MESSAGE_TEMPLATE = """Template 1 - para promoção:

🔥 *{chamada}* 🔥  ← REMOVER COMPLETAMENTE se não existir e se existir manter em negrito e com o emoji

{titulo}

❌ De: ~{preco_antigo}~  ← REMOVER COMPLETAMENTE se não existir
✅ Por: *{preco_atual}*

🎟️ Cupom: *{cupom}*  ← REMOVER COMPLETAMENTE se não existir

🛒 Compre Aqui: {link} 

🚚 {frete}  ← REMOVER COMPLETAMENTE se não existir

{rodape}


Template 2 - Para cupom:

🚨 *CUPOM {nomePlataformaEmCaixaAlta}*

{O restante como veio na mensagem original}

{rodape}
"""

DEFAULT_GEMINI_PROMPT = """Você é um assistente que reformata textos de promoções para canais e grupos de descontos.

Identifique se a mensagem é uma promoção (Template 1) ou um cupom (Template 2).
Extraia apenas informações existentes e aplique o template correspondente.
Qualquer campo ausente deve desaparecer completamente do resultado final.
Não adicione nada que não esteja explicitamente no texto original.

{template}

Regras Absolutas:
SE TIVER MAIS DE 1 LINK NO ANUNCIO MANTENHA TODOS COMO ESTA NA MENSAGEM ORIGINAL
1. Não invente informações em hipótese alguma.
2. Qualquer campo ausente deve ser completamente removido. Não use "N/A" ou placeholders.
3. Chamada principal (Template 1) deve ficar em CAIXA ALTA e negrito, com emojis.
4. Preserve todos os emojis e Markdown do template.
5. Preencha apenas os campos existentes: Preço antigo, Preço atual, Cupom, Frete, Link de compra.
"""

DEFAULT_REGEX_SHOPEE = r"(?:https?://)?(?:www\.)?(?:shopee\.com|shopee\.com\.br|shope\.ee|shp\.ee|br\.shp\.ee|s\.shopee\.com\.br)/[^\s]+"
DEFAULT_REGEX_MERCADO_LIVRE = r"(?:https?://)?(?:www\.)?(?:mercadolivre\.com(?:\.br)?|mercado-livre\.com(?:\.br)?|meli\.la)/[^\s]+"
DEFAULT_REGEX_AMAZON = r"(?:https?://)?(?:www\.)?(?:amazon\.[a-z.]+|amzn\.to|amzlink\.to|link\.amazon)/[^\s]+"
DEFAULT_REGEX_MAGALU = r"(?:https?://)?(?:(?:www\.)?divulgador\.magalu\.com|magazineluiza\.onelink\.me|(?:(?:www|m)\.)?magazineluiza\.com\.br|(?:www\.)?magazinevoce\.com\.br)/[^\s]+"

class SettingsBase(BaseModel):
    ai_enabled: bool = True
    magalu_enabled: bool = False
    whatsapp_send_errors: bool = False
    whatsapp_admin_dest: str = ""
    footer_text: str = ""
    forbidden_keywords: List[str] = []
    message_template: str = DEFAULT_MESSAGE_TEMPLATE
    gemini_prompt: str = DEFAULT_GEMINI_PROMPT
    openrouter_model_1: str = "google/gemma-2-9b-it:free"
    openrouter_model_2: str = "meta-llama/llama-3-8b-instruct:free"
    regex_shopee: str = DEFAULT_REGEX_SHOPEE
    regex_mercado_livre: str = DEFAULT_REGEX_MERCADO_LIVRE
    regex_amazon: str = DEFAULT_REGEX_AMAZON
    regex_magalu: str = DEFAULT_REGEX_MAGALU

    # User environment credentials (optional per-user overrides)
    custom_telegram_api_id: Optional[str] = None
    custom_telegram_api_hash: Optional[str] = None
    custom_telegram_session: Optional[str] = None
    custom_shopee_app_id: Optional[str] = None
    custom_shopee_secret: Optional[str] = None
    custom_openrouter_api_key: Optional[str] = None

    # Direct credentials mapped from the Settings UI per user
    shopee_app_id: Optional[str] = None
    shopee_app_secret: Optional[str] = None
    openrouter_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    google_api_key: Optional[str] = None
    telegram_api_id: Optional[Union[int, str]] = None
    telegram_api_hash: Optional[str] = None

class SettingsUpdate(BaseModel):
    ai_enabled: Optional[bool] = None
    magalu_enabled: Optional[bool] = None
    whatsapp_send_errors: Optional[bool] = None
    whatsapp_admin_dest: Optional[str] = None
    footer_text: Optional[str] = None
    forbidden_keywords: Optional[List[str]] = None
    message_template: Optional[str] = None
    gemini_prompt: Optional[str] = None
    openrouter_model_1: Optional[str] = None
    openrouter_model_2: Optional[str] = None
    regex_shopee: Optional[str] = None
    regex_mercado_livre: Optional[str] = None
    regex_amazon: Optional[str] = None
    regex_magalu: Optional[str] = None
    custom_telegram_api_id: Optional[str] = None
    custom_telegram_api_hash: Optional[str] = None
    custom_telegram_session: Optional[str] = None
    custom_shopee_app_id: Optional[str] = None
    custom_shopee_secret: Optional[str] = None
    custom_openrouter_api_key: Optional[str] = None
    shopee_app_id: Optional[str] = None
    shopee_app_secret: Optional[str] = None
    openrouter_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    google_api_key: Optional[str] = None
    telegram_api_id: Optional[Union[int, str]] = None
    telegram_api_hash: Optional[str] = None

class SettingsResponse(SettingsBase):
    user_id: str

