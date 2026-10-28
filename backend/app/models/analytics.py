from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ParticipantRecord(BaseModel):
    phone: str
    entry_time: Optional[datetime] = None
    exit_time: Optional[datetime] = None
    status: str  # "Ativo" or "Inativo"
    group_time: Optional[str] = None
    minutes: Optional[float] = None
    tag: str  # "🟢 Ativo", "🔴 Saiu", "🚨 Saiu em < 15 min"

class AnalyticsSummary(BaseModel):
    total_records: int = 0
    total_active: int = 0
    total_exits: int = 0
    quick_exits_under_15m: int = 0
    quick_exit_percentage: float = 0.0
    participants: List[ParticipantRecord] = []
