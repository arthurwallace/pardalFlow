from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends, Body, Request

from app.core.database import get_db
from app.api.deps import get_current_user

router = APIRouter(prefix="/cookies", tags=["Cookies & Plataformas"])

class CookieUpdate(BaseModel):
    cookies: str
    extra_data: Optional[Dict[str, Any]] = None

@router.get("")
async def list_cookies(current_user: dict = Depends(get_current_user)):
    """Retorna o status e os cookies salvos para cada uma das lojas/plataformas."""
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="DB indisponível")

    platforms = ["mercadolivre", "amazon", "magalu", "shopee"]
    results = []

    for p in platforms:
        doc = db.platform_cookies.find_one({"user_id": current_user["id"], "platform": p})
        if not doc:
            results.append({
                "platform": p,
                "has_cookies": False,
                "cookies": "",
                "status": "pending",
                "last_updated": None,
                "extra_data": {}
            })
        else:
            cookie_str = doc.get("cookies", "")
            results.append({
                "platform": p,
                "has_cookies": bool(cookie_str.strip()),
                "cookies": cookie_str,
                "status": doc.get("status", "valid" if cookie_str else "pending"),
                "last_updated": doc.get("last_updated"),
                "extra_data": doc.get("extra_data", {})
            })

    return results

@router.post("/{platform}")
async def save_cookie(platform: str, body: CookieUpdate, current_user: dict = Depends(get_current_user)):
    """Atualiza ou salva cookies para a plataforma especificada."""
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="DB indisponível")

    norm_platform = platform.lower().strip()
    db.platform_cookies.update_one(
        {"user_id": current_user["id"], "platform": norm_platform},
        {"$set": {
            "cookies": body.cookies.strip(),
            "status": "valid" if body.cookies.strip() else "pending",
            "last_updated": datetime.now(timezone.utc),
            "extra_data": body.extra_data or {}
        }},
        upsert=True
    )

    return {"ok": True, "message": f"Cookies da plataforma {norm_platform} atualizados com sucesso."}

@router.post("/webhook/atualizar-cookies-loja")
async def webhook_atualizar_cookies(request: Request):
    """
    Endpoint nativo de webhook para atualização de cookies de lojas.
    Permite que a extensão do navegador ou script envie os cookies diretamente via POST:
    { "plataforma": "mercadolivre" | "amazon" | "magalu" | "shopee", "cookies": "..." }
    """
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="DB indisponível")

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="JSON inválido")

    platform = str(body.get("plataforma") or body.get("platform") or "").lower().strip()
    cookies = str(body.get("cookies") or body.get("cookie") or "").strip()

    if not platform or not cookies:
        raise HTTPException(status_code=400, detail="Campos 'plataforma' e 'cookies' são obrigatórios")

    # Identifica o usuário de destino de forma segura e explícita
    target_user_id = (
        request.query_params.get("user_id") or
        request.headers.get("x-user-id") or
        body.get("user_id")
    )
    if not target_user_id:
        raise HTTPException(
            status_code=400,
            detail="Identificação do usuário ('user_id' no payload, query param '?user_id=' ou header 'X-User-ID') é obrigatória para isolamento seguro de cookies."
        )

    user = db.users.find_one({"id": target_user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário especificado não encontrado no sistema.")
    user_id = user["id"]

    db.platform_cookies.update_one(
        {"user_id": user_id, "platform": platform},
        {"$set": {
            "cookies": cookies,
            "status": "valid",
            "last_updated": datetime.now(timezone.utc),
            "extra_data": body.get("extra_data", {})
        }},
        upsert=True
    )

    return {
        "ok": True,
        "plataforma": platform,
        "status": "armazenado com sucesso",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
