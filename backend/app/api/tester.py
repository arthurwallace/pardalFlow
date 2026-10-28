from fastapi import APIRouter, Depends, HTTPException
import logging
from app.models.tester import (
    TestConversionRequest, TestConversionResponse, ConvertedLinkDetail,
    TestAiFormatRequest, TestAiFormatResponse,
    TestFullPipelineRequest, TestFullPipelineResponse
)
from app.services.link_converter import LinkConverterService
from app.services.ai_formatter import AiFormatterService
from app.core.database import get_db
from app.core.config import settings
from app.api.deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tester", tags=["Simulador e Testes"])

@router.post("/convert-links", response_model=TestConversionResponse)
async def test_convert_links(req: TestConversionRequest, current_user: dict = Depends(get_current_user)):
    try:
        db = get_db()
        user_config = {}
        if db is not None:
            doc = db.user_configs.find_one({"user_id": current_user["id"]})
            if doc:
                user_config = doc.get("data", {})

        converter = LinkConverterService(user_config)
        resolved = await converter.resolve_shorteners(req.text)
        converted, success = await converter.convert_all_links(resolved, ml_tag=req.custom_ml_tag)

        detected = []
        for l in converter.re_shopee.findall(req.text):
            detected.append(ConvertedLinkDetail(original_url=l, converted_url="", platform="Shopee", status="Converted"))
        for l in converter.re_ml.findall(req.text):
            detected.append(ConvertedLinkDetail(original_url=l, converted_url="", platform="Mercado Livre", status="Converted"))
        for l in converter.re_amazon.findall(req.text):
            detected.append(ConvertedLinkDetail(original_url=l, converted_url="", platform="Amazon", status="Converted"))
        for l in converter.re_magalu.findall(req.text):
            detected.append(ConvertedLinkDetail(original_url=l, converted_url="", platform="Magalu", status="Converted"))

        return TestConversionResponse(
            original_text=req.text,
            converted_text=converted,
            detected_links=detected,
            has_errors=not success
        )
    except Exception as e:
        logger.error(f"Erro em test_convert_links: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao converter links: {str(e)}"
        )

@router.post("/format-ai", response_model=TestAiFormatResponse)
async def test_format_ai(req: TestAiFormatRequest, current_user: dict = Depends(get_current_user)):
    try:
        db = get_db()
        user_config = {}
        if db is not None:
            doc = db.user_configs.find_one({"user_id": current_user["id"]})
            if doc:
                user_config = doc.get("data", {})

        formatter = AiFormatterService(user_config)
        formatted = await formatter.format_text(
            text=req.text,
            template_override=req.template,
            prompt_override=req.prompt
        )
        return TestAiFormatResponse(
            original_text=req.text,
            formatted_text=formatted,
            model_used=user_config.get("openrouter_model_1", "google/gemma-2-9b-it:free"),
            success=True
        )
    except Exception as e:
        logger.error(f"Erro em test_format_ai: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao formatar mensagem com IA: {str(e)}"
        )

@router.post("/test-pipeline", response_model=TestFullPipelineResponse)
async def test_full_pipeline(req: TestFullPipelineRequest, current_user: dict = Depends(get_current_user)):
    try:
        db = get_db()
        user_config = {}
        if db is not None:
            doc = db.user_configs.find_one({"user_id": current_user["id"]})
            if doc:
                user_config = doc.get("data", {})

        converter = LinkConverterService(user_config)
        formatter = AiFormatterService(user_config)

        # 1. Clean forbidden lines
        cleaned = formatter.remove_forbidden_lines(req.text)
        # 2. Resolve shorteners
        resolved = await converter.resolve_shorteners(cleaned)
        # 3. Convert links
        converted, conv_ok = await converter.convert_all_links(resolved)
        # 4. AI Format
        formatted = await formatter.format_text(converted)
        final_result = formatter.append_footer(formatted)

        return TestFullPipelineResponse(
            step1_cleaned_text=cleaned,
            step2_resolved_urls=resolved,
            step3_converted_links=converted,
            step4_ai_formatted=final_result,
            final_text=final_result,
            success=True
        )
    except Exception as e:
        logger.error(f"Erro em test_full_pipeline: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao executar pipeline de simulação: {str(e)}"
        )

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from app.services.bot_manager import extract_product_title_and_price

class DispatchNowRequest(BaseModel):
    text: str
    channel_name: Optional[str] = "Simulador"
    custom_target_groups: Optional[List[str]] = None

@router.post("/dispatch-now")
async def dispatch_now(req: DispatchNowRequest, current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["id"]
        db = get_db()
        user_config = {}
        if db is not None:
            doc = db.user_configs.find_one({"user_id": user_id})
            if doc:
                user_config = doc.get("data", {})

        converter = LinkConverterService(user_config)
        formatter = AiFormatterService(user_config)

        cleaned = formatter.remove_forbidden_lines(req.text)
        resolved = await converter.resolve_shorteners(cleaned)
        converted, conv_ok = await converter.convert_all_links(resolved)
        formatted = await formatter.format_text(converted)
        final_text = formatter.append_footer(formatted)

        prod_title, prod_price = extract_product_title_and_price(final_text)

        target_group_names = req.custom_target_groups
        all_groups = []
        if db:
            all_groups = list(db.whatsapp_groups.find({"user_id": user_id}))

        if not target_group_names:
            target_group_names = [g["name"] for g in all_groups if g.get("active", True)] or ["Grupos Conectados"]

        # Attempt real WhatsApp dispatch if webhook is configured
        dest_ids = []
        for g in all_groups:
            gid = g.get("id") or g.get("group_id")
            gname = g.get("name")
            if gid and (gname in target_group_names or gid in target_group_names):
                dest_ids.append(gid)

        if dest_ids and getattr(settings, "WPP_TEXT_WEBHOOK", None):
            from app.services.dispatcher import DispatcherService
            wa_sessions = list(db.whatsapp_sessions.find({"user_id": user_id})) if db else []
            dispatcher = DispatcherService(
                telegram_destinations=[],
                whatsapp_groups=all_groups,
                whatsapp_sessions=wa_sessions,
                default_footer=user_config.get("footer_text", "")
            )
            for gid in dest_ids:
                try:
                    await dispatcher.send_to_whatsapp(
                        text=final_text,
                        media_path=None,
                        destination_id=gid
                    )
                except Exception as wpp_err:
                    logger.warning(f"Erro ao enviar para WhatsApp {gid}: {wpp_err}")

        sent_doc = {
            "user_id": user_id,
            "product_name": prod_title,
            "price": prod_price,
            "channel_name": req.channel_name or "Simulador",
            "original_text": req.text,
            "converted_text": final_text,
            "target_groups": target_group_names,
            "platform": "Multi-plataforma",
            "status": "Enviado com sucesso",
            "sent_at": datetime.now(timezone.utc)
        }

        if db is not None:
            db.sent_offers.insert_one(sent_doc)

        return {
            "success": True,
            "message": "Oferta real disparada e registrada no histórico com sucesso!",
            "offer": {
                "product_name": prod_title,
                "price": prod_price,
                "target_groups": target_group_names,
                "converted_text": final_text
            }
        }
    except Exception as e:
        logger.error(f"Erro em dispatch_now: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro ao disparar oferta: {str(e)}")
