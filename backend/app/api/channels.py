from fastapi import APIRouter, HTTPException, Depends
from typing import List
import json
import os
from telethon import TelegramClient

from app.models.channel import ChannelCreate, ChannelUpdate, ChannelResponse, ChannelReorder
from app.core.database import get_db
from app.core.config import settings
from app.api.deps import get_current_user

router = APIRouter(prefix="/channels", tags=["Canais Monitorados"])

@router.get("", response_model=List[ChannelResponse])
async def list_channels(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="DB indisponível")

    cursor = db.channels.find({"user_id": current_user["id"]}).sort("order", 1)
    results = []
    for doc in cursor:
        results.append(ChannelResponse(
            id=str(doc["_id"]),
            user_id=doc["user_id"],
            name=doc["name"],
            description=doc.get("description", ""),
            active=doc.get("active", True),
            replace_image=doc.get("replace_image", False),
            is_coupon_group=doc.get("is_coupon_group", False),
            whatsapp_destinations=doc.get("whatsapp_destinations", []),
            order=doc.get("order", 0)
        ))
    # Trazer os canais ativos na frente, seguidos pela ordem/nome
    results.sort(key=lambda c: (not c.active, c.order, (c.name or "").lower()))
    return results

@router.post("", response_model=ChannelResponse)
async def create_channel(channel_in: ChannelCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="DB indisponível")

    existing = db.channels.find_one({
        "user_id": current_user["id"],
        "name": channel_in.name.strip()
    })
    if existing:
        raise HTTPException(status_code=400, detail="Este canal já está cadastrado")

    order_count = db.channels.count_documents({"user_id": current_user["id"]})

    doc = {
        "user_id": current_user["id"],
        "name": channel_in.name.strip(),
        "description": channel_in.description.strip(),
        "active": channel_in.active,
        "replace_image": channel_in.replace_image,
        "is_coupon_group": channel_in.is_coupon_group,
        "whatsapp_destinations": channel_in.whatsapp_destinations,
        "order": order_count
    }
    result = db.channels.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    return ChannelResponse(**doc)

@router.put("/{channel_id}", response_model=ChannelResponse)
async def update_channel(
    channel_id: str,
    channel_in: ChannelUpdate,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="DB indisponível")

    update_data = {k: v for k, v in channel_in.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")

    result = db.channels.find_one_and_update(
        {"id": channel_id, "user_id": current_user["id"]},
        {"$set": update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Canal não encontrado")

    result["id"] = str(result.get("id") or result.get("_id"))
    return ChannelResponse(**result)

@router.delete("/{channel_id}")
async def delete_channel(channel_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="DB indisponível")

    res = db.channels.delete_one({"id": channel_id, "user_id": current_user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Canal não encontrado")
    return {"message": "Canal removido com sucesso"}

@router.post("/reorder")
async def reorder_channels(reorder_in: ChannelReorder, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="DB indisponível")

    for idx, cid in enumerate(reorder_in.channel_ids):
        try:
            db.channels.update_one(
                {"id": str(cid), "user_id": current_user["id"]},
                {"$set": {"order": idx}}
            )
        except Exception:
            pass
    return {"message": "Ordem dos canais atualizada com sucesso"}

@router.post("/test-reachability")
async def test_channels_reachability(current_user: dict = Depends(get_current_user)):
    """Tests if monitored channels are accessible via Telegram client."""
    db = get_db()
    channels = list(db.channels.find({"user_id": current_user["id"]}))
    if not channels:
        return {"results": [], "total": 0}

    results = []
    user_config_doc = db.user_configs.find_one({"user_id": current_user["id"]})
    user_config = {}
    if user_config_doc:
        c_data = user_config_doc.get("data", {})
        user_config = json.loads(c_data) if isinstance(c_data, str) else c_data

    api_id_val = user_config.get("telegram_api_id") or user_config.get("custom_telegram_api_id")
    api_id = int(api_id_val) if api_id_val else 0
    api_hash = user_config.get("telegram_api_hash") or user_config.get("custom_telegram_api_hash") or ""
    if not api_id or not api_hash:
        return {
            "results": [{"name": ch.get("name"), "accessible": False, "error": "Credenciais do Telegram não configuradas"} for ch in channels],
            "total": len(channels)
        }

    sessions_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "sessions")
    user_session_path = os.path.join(sessions_dir, f"user_{current_user['id']}")
    session_target = user_session_path if os.path.exists(f"{user_session_path}.session") else f"test_session_{current_user['id'][:8]}"

    client = TelegramClient(session_target, api_id, api_hash)
    try:
        await client.connect()
        if not await client.is_user_authorized():
            await client.disconnect()
            return {
                "results": [{"name": ch.get("name"), "accessible": False, "error": "Sessão do Telegram não autorizada. Conecte sua conta em Configurações."} for ch in channels],
                "total": len(channels)
            }

        for ch in channels:
            ch_name = ch.get("name")
            try:
                entity = await client.get_entity(ch_name)
                results.append({
                    "name": ch_name,
                    "accessible": True,
                    "title": getattr(entity, "title", "Sem título"),
                    "id": getattr(entity, "id", None)
                })
            except Exception as e:
                results.append({
                    "name": ch_name,
                    "accessible": False,
                    "error": str(e)
                })
        await client.disconnect()
    except Exception as e:
        return {"error": f"Não foi possível conectar ao cliente Telegram: {e}", "results": results}

    return {"results": results, "total": len(results)}
