from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class TestConversionRequest(BaseModel):
    text: str
    custom_shopee_tag: Optional[str] = None
    custom_ml_tag: Optional[str] = None

class ConvertedLinkDetail(BaseModel):
    original_url: str
    converted_url: str
    platform: str
    status: str

class TestConversionResponse(BaseModel):
    original_text: str
    converted_text: str
    detected_links: List[ConvertedLinkDetail] = []
    has_errors: bool = False
    error_message: Optional[str] = None

class TestAiFormatRequest(BaseModel):
    text: str
    template: Optional[str] = None
    prompt: Optional[str] = None

class TestAiFormatResponse(BaseModel):
    original_text: str
    formatted_text: str
    model_used: Optional[str] = None
    success: bool = True
    error_message: Optional[str] = None

class TestFullPipelineRequest(BaseModel):
    text: str
    send_test_telegram: bool = False
    telegram_target_id: Optional[str] = None
    send_test_whatsapp: bool = False
    whatsapp_target_id: Optional[str] = None
    whatsapp_session: Optional[str] = None

class TestFullPipelineResponse(BaseModel):
    step1_cleaned_text: str
    step2_resolved_urls: str
    step3_converted_links: str
    step4_ai_formatted: str
    final_text: Optional[str] = None
    telegram_sent: bool = False
    telegram_error: Optional[str] = None
    whatsapp_sent: bool = False
    whatsapp_error: Optional[str] = None
    success: bool = True
    error_message: Optional[str] = None
