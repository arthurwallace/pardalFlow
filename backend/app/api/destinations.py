from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any

from app.models.destination import (
    WhatsAppGroupCreate, WhatsAppGroupUpdate, WhatsAppGroupResponse,
    TelegramDestCreate, TelegramDestUpdate, TelegramDestResponse,
    WhatsAppSessionCreate, WhatsAppSessionUpdate, WhatsAppSessionResponse
)
from app.core.database import get_db
from app.api.deps import get_current_user

router = APIRouter(prefix="/destinations", tags=["Destinos e Sessões"])

# --- WhatsApp Groups ---
@router.get("/whatsapp-groups", response_model=List[WhatsAppGroupResponse])
async def list_whatsapp_groups(current_user: dict = Depends(get_current_user)):
    db = get_db()
    docs = list(db.whatsapp_groups.find({"user_id": current_user["id"]}))
    return [
        WhatsAppGroupResponse(
            id_db=str(d.get("id_db") or d.get("id") or d.get("_id")),
            user_id=d["user_id"],
            name=d["name"],
            id=d["id"],
            keywords=d.get("keywords", []),
            footer_text=d.get("footer_text", ""),
            active=d.get("active", True)
        )
        for d in docs
    ]

@router.post("/whatsapp-groups", response_model=WhatsAppGroupResponse)
async def create_whatsapp_group(grp: WhatsAppGroupCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    existing = db.whatsapp_groups.find_one({"user_id": current_user["id"], "id": grp.id.strip()})
    if existing:
        raise HTTPException(status_code=400, detail="Grupo com este ID já cadastrado")

    doc = {
        "user_id": current_user["id"],
        "name": grp.name.strip(),
        "id": grp.id.strip(),
        "keywords": grp.keywords,
        "footer_text": grp.footer_text.strip() if grp.footer_text else "",
        "active": grp.active
    }
    res = db.whatsapp_groups.insert_one(doc)
    doc["id_db"] = str(res.inserted_id)
    return WhatsAppGroupResponse(**doc)

@router.put("/whatsapp-groups/{id_db}", response_model=WhatsAppGroupResponse)
async def update_whatsapp_group(id_db: str, grp: WhatsAppGroupUpdate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    update_data = {k: v for k, v in grp.model_dump().items() if v is not None}
    if "id" in update_data and isinstance(update_data["id"], str):
        update_data["id"] = update_data["id"].strip()
        update_data["group_id"] = update_data["id"]
    if "name" in update_data and isinstance(update_data["name"], str):
        update_data["name"] = update_data["name"].strip()
    if "footer_text" in update_data and isinstance(update_data["footer_text"], str):
        update_data["footer_text"] = update_data["footer_text"].strip()

    res = db.whatsapp_groups.find_one_and_update(
        {"id": id_db, "user_id": current_user["id"]},
        {"$set": update_data},
        return_document=True
    )
    if not res:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
    res["id_db"] = str(res.get("id_db") or res.get("_id") or res.get("id"))
    return WhatsAppGroupResponse(**res)

@router.delete("/whatsapp-groups/{id_db}")
async def delete_whatsapp_group(id_db: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    res = db.whatsapp_groups.delete_one({"id": id_db, "user_id": current_user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
    return {"message": "Grupo WhatsApp removido com sucesso"}

# --- Telegram Destinations ---
@router.get("/telegram", response_model=List[TelegramDestResponse])
async def list_telegram_destinations(current_user: dict = Depends(get_current_user)):
    db = get_db()
    docs = list(db.telegram_destinations.find({"user_id": current_user["id"]}))
    return [
        TelegramDestResponse(
            id_db=str(d.get("id") or d.get("_id")),
            user_id=d["user_id"],
            name=d["name"],
            id=d["id"],
            admin=d.get("admin", False)
        )
        for d in docs
    ]

@router.post("/telegram", response_model=TelegramDestResponse)
async def create_telegram_destination(dest: TelegramDestCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    existing = db.telegram_destinations.find_one({"user_id": current_user["id"], "id": dest.id.strip()})
    if existing:
        raise HTTPException(status_code=400, detail="Destino Telegram com este ID já cadastrado")

    doc = {
        "user_id": current_user["id"],
        "name": dest.name.strip(),
        "id": dest.id.strip(),
        "admin": dest.admin
    }
    res = db.telegram_destinations.insert_one(doc)
    doc["id_db"] = str(res.inserted_id)
    return TelegramDestResponse(**doc)

@router.put("/telegram/{id_db}", response_model=TelegramDestResponse)
async def update_telegram_destination(id_db: str, dest: TelegramDestUpdate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    update_data = {k: v for k, v in dest.model_dump().items() if v is not None}
    res = db.telegram_destinations.find_one_and_update(
        {"id": id_db, "user_id": current_user["id"]},
        {"$set": update_data},
        return_document=True
    )
    if not res:
        raise HTTPException(status_code=404, detail="Destino não encontrado")
    res["id_db"] = str(res.get("id") or res.get("_id"))
    return TelegramDestResponse(**res)

@router.delete("/telegram/{id_db}")
async def delete_telegram_destination(id_db: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    res = db.telegram_destinations.delete_one({"id": id_db, "user_id": current_user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Destino não encontrado")
    return {"message": "Destino Telegram removido com sucesso"}

# --- WhatsApp Sessions ---
@router.get("/whatsapp-sessions", response_model=List[WhatsAppSessionResponse])
async def list_whatsapp_sessions(current_user: dict = Depends(get_current_user)):
    db = get_db()
    docs = list(db.whatsapp_sessions.find({"user_id": current_user["id"]}))
    return [
        WhatsAppSessionResponse(
            id_db=str(d.get("id") or d.get("_id")),
            user_id=d["user_id"],
            name=d["name"],
            active=d.get("active", True)
        )
        for d in docs
    ]

@router.post("/whatsapp-sessions", response_model=WhatsAppSessionResponse)
async def create_whatsapp_session(session: WhatsAppSessionCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    existing = db.whatsapp_sessions.find_one({"user_id": current_user["id"], "name": session.name.strip()})
    if existing:
        raise HTTPException(status_code=400, detail="Sessão com este nome já cadastrada")

    doc = {
        "user_id": current_user["id"],
        "name": session.name.strip(),
        "active": session.active
    }
    res = db.whatsapp_sessions.insert_one(doc)
    doc["id_db"] = str(res.inserted_id)
    return WhatsAppSessionResponse(**doc)

@router.put("/whatsapp-sessions/{id_db}", response_model=WhatsAppSessionResponse)
async def update_whatsapp_session(id_db: str, session: WhatsAppSessionUpdate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    update_data = {k: v for k, v in session.model_dump().items() if v is not None}
    res = db.whatsapp_sessions.find_one_and_update(
        {"id": id_db, "user_id": current_user["id"]},
        {"$set": update_data},
        return_document=True
    )
    if not res:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    res["id_db"] = str(res.get("id") or res.get("_id"))
    return WhatsAppSessionResponse(**res)

@router.delete("/whatsapp-sessions/{id_db}")
async def delete_whatsapp_session(id_db: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    res = db.whatsapp_sessions.delete_one({"id": id_db, "user_id": current_user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    return {"message": "Sessão WhatsApp removida com sucesso"}
