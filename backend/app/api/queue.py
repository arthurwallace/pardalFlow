from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from app.api.deps import get_current_user
from app.services.queue_manager import QueueManager
from app.core.database import get_db

router = APIRouter(prefix="/queue", tags=["Fila de Envios WhatsApp"])

@router.get("")
async def get_queue_status(
    queue_type: Optional[str] = Query(None, description="ofertas | cupons | broadcast"),
    status: str = Query("pending"),
    limit: int = Query(50),
    current_user: dict = Depends(get_current_user)
):
    """Retorna itens da fila e contadores em tempo real."""
    qm = QueueManager(user_id=current_user["id"])
    items = qm.list_queue(queue_type=queue_type, status=status, limit=limit)
    counts = qm.count_pending()
    return {
        "counts": counts,
        "items": items
    }

@router.post("/clear")
async def clear_queue_items(
    queue_type: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Limpa as mensagens pendentes da fila informada."""
    qm = QueueManager(user_id=current_user["id"])
    removed = qm.clear_queue(queue_type=queue_type)
    return {"ok": True, "removed": removed, "message": f"{removed} mensagens removidas da fila."}

@router.post("/dispatch-next")
async def dispatch_next_item(
    queue_type: str = Query("ofertas"),
    current_user: dict = Depends(get_current_user)
):
    """Dispara manualmente a próxima mensagem da fila."""
    db = get_db()
    cfg_doc = db.user_configs.find_one({"user_id": current_user["id"]}) if db else None
    cfg = cfg_doc.get("data", {}) if cfg_doc else {}
    waha_url = cfg.get("waha_base_url", "http://192.168.1.25:3000")
    waha_key = cfg.get("waha_api_key")

    qm = QueueManager(user_id=current_user["id"], waha_base_url=waha_url, waha_api_key=waha_key)
    res = await qm.process_next(queue_type=queue_type)
    if res is None:
        return {"ok": False, "message": "Nenhuma mensagem pendente pronta para envio."}
    return {"ok": res, "message": "Mensagem enviada com sucesso" if res else "Falha ao enviar mensagem"}

@router.post("/trim")
async def trim_queue(
    queue_type: str = Query("ofertas"),
    keep_last: int = Query(20),
    current_user: dict = Depends(get_current_user)
):
    """Apara a fila mantendo apenas os últimos X itens pendentes."""
    qm = QueueManager(user_id=current_user["id"])
    trimmed = qm.trim_queue(queue_type=queue_type, keep_last=keep_last)
    return {"ok": True, "trimmed_count": trimmed}
