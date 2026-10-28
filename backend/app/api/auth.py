from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone

from app.models.user import UserCreate, UserLogin, UserResponse, Token
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.settings import DEFAULT_MESSAGE_TEMPLATE, DEFAULT_GEMINI_PROMPT

router = APIRouter(prefix="/auth", tags=["Autenticação"])

@router.post("/register", response_model=Token)
async def register(user_in: UserCreate):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Banco de dados indisponível")

    existing = db.users.find_one({"email": user_in.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Este e-mail já está cadastrado")

    # If first user, make admin
    total_users = db.users.count_documents({})
    role = "admin" if total_users == 0 else "user"

    now = datetime.now(timezone.utc)
    user_doc = {
        "email": user_in.email.lower(),
        "full_name": user_in.full_name,
        "hashed_password": get_password_hash(user_in.password),
        "is_active": True,
        "role": role,
        "created_at": now
    }
    result = db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # Initialize user config with clean default templates and settings (no personal data leaked)
    db.user_configs.insert_one({
        "user_id": user_id,
        "data": {
            "ai_enabled": True,
            "magalu_enabled": False,
            "whatsapp_send_errors": False,
            "whatsapp_admin_dest": "",
            "footer_text": "",
            "forbidden_keywords": [],
            "message_template": DEFAULT_MESSAGE_TEMPLATE,
            "gemini_prompt": DEFAULT_GEMINI_PROMPT,
            "openrouter_model_1": "google/gemma-2-9b-it:free",
            "openrouter_model_2": "meta-llama/llama-3-8b-instruct:free"
        }
    })

    access_token = create_access_token(subject=user_id)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user_id,
            email=user_doc["email"],
            full_name=user_doc["full_name"],
            is_active=True,
            role=role,
            created_at=now
        )
    )

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Banco de dados indisponível")

    user = db.users.find_one({"email": credentials.email.lower()})
    if not user or not verify_password(credentials.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos"
        )

    if not user.get("is_active", True):
        raise HTTPException(status_code=400, detail="Usuário desativado")

    user_id = str(user["_id"])
    access_token = create_access_token(subject=user_id)

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user_id,
            email=user["email"],
            full_name=user.get("full_name"),
            is_active=user.get("is_active", True),
            role=user.get("role", "user"),
            created_at=user.get("created_at")
        )
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        full_name=current_user.get("full_name"),
        is_active=current_user.get("is_active", True),
        role=current_user.get("role", "user"),
        created_at=current_user.get("created_at")
    )
