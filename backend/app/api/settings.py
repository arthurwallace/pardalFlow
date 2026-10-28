from fastapi import APIRouter, HTTPException, Depends
from app.models.settings import SettingsUpdate, SettingsResponse
from app.core.database import get_db
from app.api.deps import get_current_user

router = APIRouter(prefix="/settings", tags=["Configurações"])

@router.get("", response_model=SettingsResponse)
async def get_settings(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="DB indisponível")

    doc = db.user_configs.find_one({"user_id": current_user["id"]})
    data = doc.get("data", {}) if doc else {}
    data["user_id"] = current_user["id"]
    return SettingsResponse(**data)

@router.put("", response_model=SettingsResponse)
async def update_settings(settings_in: SettingsUpdate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="DB indisponível")

    current_doc = db.user_configs.find_one({"user_id": current_user["id"]})
    existing_data = current_doc.get("data", {}) if current_doc else {}

    updates = {k: v for k, v in settings_in.model_dump().items() if v is not None}
    existing_data.update(updates)

    db.user_configs.update_one(
        {"user_id": current_user["id"]},
        {"$set": {"data": existing_data}},
        upsert=True
    )
    existing_data["user_id"] = current_user["id"]
    return SettingsResponse(**existing_data)
