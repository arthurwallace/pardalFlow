from pydantic import BaseModel, Field
from typing import List, Optional

class ChannelBase(BaseModel):
    name: str = Field(..., description="Username (@canal) or ID (-100...)")
    description: Optional[str] = ""
    active: bool = True
    replace_image: bool = False
    is_coupon_group: bool = False
    whatsapp_destinations: List[str] = []

class ChannelCreate(ChannelBase):
    pass

class ChannelUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None
    replace_image: Optional[bool] = None
    is_coupon_group: Optional[bool] = None
    whatsapp_destinations: Optional[List[str]] = None

class ChannelResponse(ChannelBase):
    id: str
    user_id: str
    order: int = 0

class ChannelReorder(BaseModel):
    channel_ids: List[str]
