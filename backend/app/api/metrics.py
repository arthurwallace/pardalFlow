from fastapi import APIRouter, Depends, Query
from datetime import datetime, timezone
from typing import List, Optional
from app.services.bot_manager import BotManager
from app.core.database import get_db
from app.api.deps import get_current_user

router = APIRouter(prefix="/metrics", tags=["Métricas e Estatísticas"])

@router.get("/dashboard")
async def get_dashboard_metrics(current_user: dict = Depends(get_current_user)):
    bot = BotManager.get_instance(current_user["id"])
    db = get_db()

    total_channels = 0
    active_channels = 0
    total_wa_groups = 0
    total_tg_dest = 0
    total_dispatched_offers = 0
    total_wa_sessions = 0
    active_wa_sessions = 0

    if db is not None:
        user_id = current_user["id"]
        total_channels = db.channels.count_documents({"user_id": user_id})
        active_channels = db.channels.count_documents({"user_id": user_id, "active": True})
        total_wa_groups = db.whatsapp_groups.count_documents({"user_id": user_id})
        total_tg_dest = db.telegram_destinations.count_documents({"user_id": user_id})
        # Count strictly real dispatched offers
        total_dispatched_offers = db.sent_offers.count_documents({"user_id": user_id})
        total_wa_sessions = db.whatsapp_sessions.count_documents({"user_id": user_id})
        active_wa_sessions = db.whatsapp_sessions.count_documents({"user_id": user_id, "active": True})

    avg_latency = round(sum(bot.metrics["latencies"]) / len(bot.metrics["latencies"]), 2) if bot.metrics["latencies"] else 0.0

    return {
        "bot_running": bot.is_running,
        "posts_detected": bot.metrics["detected"],
        "posts_sent": bot.metrics["sent"],
        "total_dispatched_offers": total_dispatched_offers,
        "ai_errors": bot.metrics["ai_errors"],
        "conversion_errors": bot.metrics["conversion_errors"],
        "avg_latency_seconds": avg_latency,
        "total_channels": total_channels,
        "active_channels": active_channels,
        "whatsapp_groups": total_wa_groups,
        "telegram_destinations": total_tg_dest,
        "whatsapp_sessions": total_wa_sessions,
        "active_whatsapp_sessions": active_wa_sessions
    }

@router.get("/dispatched-offers")
async def get_dispatched_offers(
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    """Returns strictly real list of products/offers dispatched to target groups (no mock data)."""
    db = get_db()
    if db is None:
        return {"total": 0, "items": []}

    user_id = current_user["id"]
    total = db.sent_offers.count_documents({"user_id": user_id})
    cursor = db.sent_offers.find({"user_id": user_id}).sort("sent_at", -1).skip(skip).limit(limit)

    items = []
    for doc in cursor:
        sent_at_val = doc.get("sent_at")
        sent_at_str = sent_at_val.isoformat() if hasattr(sent_at_val, "isoformat") else str(sent_at_val or "")

        items.append({
            "id": str(doc.get("id") or doc.get("_id")),
            "product_name": doc.get("product_name") or "Oferta sem título",
            "price": doc.get("price"),
            "channel_name": doc.get("channel_name") or "Canal Monitorado",
            "original_text": doc.get("original_text", ""),
            "converted_text": doc.get("converted_text", ""),
            "target_groups": doc.get("target_groups", []),
            "platform": doc.get("platform", "Multi-plataforma"),
            "status": doc.get("status", "Enviado com sucesso"),
            "sent_at": sent_at_str
        })

    return {
        "total": total,
        "items": items
    }

@router.delete("/dispatched-offers")
async def clear_dispatched_offers(current_user: dict = Depends(get_current_user)):
    """Clears sent offers history for the current user."""
    db = get_db()
    if db is not None:
        deleted = db.sent_offers.delete_many({"user_id": current_user["id"]})
        return {"message": "Histórico de ofertas limpo com sucesso", "count": deleted}
    return {"message": "Nenhum registro para limpar", "count": 0}
