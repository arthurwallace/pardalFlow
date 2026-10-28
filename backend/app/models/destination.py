from pydantic import BaseModel, Field
from typing import List, Optional

# WhatsApp Destination Groups
class WhatsAppGroupBase(BaseModel):
    name: str = Field(..., description="Friendly name of the WhatsApp group")
    id: str = Field(..., description="WhatsApp group JID e.g. 120363421799900681@g.us")
    keywords: List[str] = []
    footer_text: Optional[str] = ""
    active: bool = True

class WhatsAppGroupCreate(WhatsAppGroupBase):
    pass

class WhatsAppGroupUpdate(BaseModel):
    name: Optional[str] = None
    id: Optional[str] = None
    keywords: Optional[List[str]] = None
    footer_text: Optional[str] = None
    active: Optional[bool] = None

class WhatsAppGroupResponse(WhatsAppGroupBase):
    id_db: str
    user_id: str

# Telegram Destination Channels/Groups
class TelegramDestBase(BaseModel):
    name: str = Field(..., description="Destination channel/group name")
    id: str = Field(..., description="Telegram ID or username e.g. -1001908902043 or @canal")
    admin: bool = Field(False, description="If true, only receives conversion error notifications")

class TelegramDestCreate(TelegramDestBase):
    pass

class TelegramDestUpdate(BaseModel):
    name: Optional[str] = None
    id: Optional[str] = None
    admin: Optional[bool] = None

class TelegramDestResponse(TelegramDestBase):
    id_db: str
    user_id: str

# WhatsApp Sessions (Round-Robin)
class WhatsAppSessionBase(BaseModel):
    name: str = Field(..., description="Session identifier e.g. WHATS_BUSSINESS_01")
    active: bool = True

class WhatsAppSessionCreate(WhatsAppSessionBase):
    pass

class WhatsAppSessionUpdate(BaseModel):
    name: Optional[str] = None
    active: Optional[bool] = None

class WhatsAppSessionResponse(WhatsAppSessionBase):
    id_db: str
    user_id: str
