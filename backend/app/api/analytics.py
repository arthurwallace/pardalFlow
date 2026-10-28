import re
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, Dict
from zoneinfo import ZoneInfo
from datetime import datetime, timezone, timedelta
import httpx
import pandas as pd

from app.core.config import settings
from app.models.analytics import AnalyticsSummary, ParticipantRecord
from app.api.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics de Grupos"])

_cache_by_group: Dict[str, tuple[float, list]] = {}

def format_duration_ptbr(td: timedelta) -> str:
    """Converts a timedelta into a friendly Portuguese string."""
    total_seconds = int(td.total_seconds())
    if total_seconds < 0:
        total_seconds = 0
    days = total_seconds // 86400
    rem = total_seconds % 86400
    hours = rem // 3600
    rem2 = rem % 3600
    mins = rem2 // 60
    secs = rem2 % 60

    if days > 0:
        d_str = f"{days} dia" if days == 1 else f"{days} dias"
        if hours > 0:
            return f"{d_str} e {hours}h {mins:02d}m"
        elif mins > 0:
            return f"{d_str} e {mins}m"
        else:
            return d_str
    elif hours > 0:
        return f"{hours}h {mins:02d}m"
    elif mins > 0:
        return f"{mins} min"
    else:
        return f"{secs}s"

def format_phone(phone: str) -> str:
    """Formats phone number into Brazilian standard (+55 (DD) 9XXXX-XXXX or +55 (DD) XXXX-XXXX)."""
    if not phone:
        return ""
    digits = re.sub(r"\D", "", str(phone))
    if len(digits) == 13 and digits.startswith("55"):
        return f"+55 ({digits[2:4]}) {digits[4:9]}-{digits[9:]}"
    if len(digits) == 12 and digits.startswith("55"):
        return f"+55 ({digits[2:4]}) {digits[4:8]}-{digits[8:]}"
    if len(digits) == 11:
        return f"({digits[0:2]}) {digits[2:7]}-{digits[7:]}"
    if len(digits) == 10:
        return f"({digits[0:2]}) {digits[2:6]}-{digits[6:]}"
    if len(digits) > 10:
        return f"+{digits[:-10]} ({digits[-10:-8]}) {digits[-8:-4]}-{digits[-4:]}"
    return f"+{digits}" if digits else str(phone)

@router.get("/whatsapp-groups", response_model=AnalyticsSummary)
async def get_group_analytics(
    group: str = Query("noivas", description="Slug do grupo (ex: noivas, pardal, cupons, baby, maromba, pardal_2)"),
    period: Optional[str] = Query("all", description="Filtro temporal (all, today, yesterday, week, month)"),
    current_user: dict = Depends(get_current_user)
):
    global _cache_by_group
    now_ts = datetime.now().timestamp()
    slug = group.strip().lower()

    cached_entry = _cache_by_group.get(slug)
    raw_data = None

    if cached_entry and (now_ts - cached_entry[0]) < 60:
        raw_data = cached_entry[1]
    else:
        base_url = (getattr(settings, "ANALYTICS_API_BASE_URL", "") or "https://n8n.arthurwallace.com.br/webhook/csv_monitoramento_entradas_saidas_grupos").rstrip("/")
        url = f"{base_url}/{slug}"
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, timeout=15.0)
                if resp.status_code == 200:
                    raw_data = resp.json()
                    _cache_by_group[slug] = (now_ts, raw_data)
                else:
                    raw_data = []
        except Exception as e:
            if cached_entry:
                raw_data = cached_entry[1]
            else:
                raw_data = []

    if not raw_data:
        return AnalyticsSummary(
            total_records=0,
            total_active=0,
            total_exits=0,
            quick_exits_under_15m=0,
            quick_exit_percentage=0.0,
            participants=[]
        )

    # Process events into entries/exits
    try:
        df = pd.DataFrame(raw_data)
        df["phone"] = df["participant_id"].apply(lambda x: str(x).split("@")[0] if pd.notnull(x) else x)
        fuso_br = ZoneInfo("America/Sao_Paulo")
        df["date"] = pd.to_datetime(df["date"], format="mixed", utc=True).dt.tz_convert(fuso_br)
        df = df.sort_values("date")

        records = []
        active_map = {}
        now_br = datetime.now(fuso_br)

        for _, row in df.iterrows():
            phone = str(row["phone"])
            event = str(row["event"]).strip().lower()
            ev_date = row["date"]

            if event == "entrada":
                active_map[phone] = ev_date
            elif event in ["saida", "saída"]:
                if phone in active_map:
                    entry_date = active_map.pop(phone)
                    duration = ev_date - entry_date
                    minutes = duration.total_seconds() / 60
                    tag = "🚨 Saiu em < 15 min" if minutes <= 15 else "🔴 Saiu"

                    records.append(ParticipantRecord(
                        phone=format_phone(phone),
                        entry_time=entry_date.to_pydatetime(),
                        exit_time=ev_date.to_pydatetime(),
                        status="Inativo",
                        group_time=format_duration_ptbr(duration),
                        minutes=round(minutes, 1),
                        tag=tag
                    ))

        for phone, entry_date in active_map.items():
            duration = now_br - entry_date
            minutes = duration.total_seconds() / 60
            records.append(ParticipantRecord(
                phone=format_phone(phone),
                entry_time=entry_date.to_pydatetime(),
                exit_time=None,
                status="Ativo",
                group_time=format_duration_ptbr(duration),
                minutes=round(minutes, 1),
                tag="🟢 Ativo"
            ))

        # Sort by entry descending by default
        records.sort(key=lambda x: x.entry_time or datetime.min, reverse=True)

        # Optional backend-level period filter
        if period in ["today", "hoje"]:
            today_date = now_br.date()
            records = [
                r for r in records
                if (r.entry_time and r.entry_time.date() == today_date) or
                   (r.exit_time and r.exit_time.date() == today_date)
            ]
        elif period in ["yesterday", "ontem"]:
            yesterday_date = (now_br - timedelta(days=1)).date()
            records = [
                r for r in records
                if (r.entry_time and r.entry_time.date() == yesterday_date) or
                   (r.exit_time and r.exit_time.date() == yesterday_date)
            ]
        elif period in ["week", "semana"]:
            min_date = (now_br - timedelta(days=7)).to_pydatetime() if hasattr(now_br, "to_pydatetime") else (now_br - timedelta(days=7))
            records = [
                r for r in records
                if (r.entry_time and r.entry_time >= min_date) or
                   (r.exit_time and r.exit_time >= min_date)
            ]
        elif period in ["month", "mes", "mês"]:
            min_date = (now_br - timedelta(days=30)).to_pydatetime() if hasattr(now_br, "to_pydatetime") else (now_br - timedelta(days=30))
            records = [
                r for r in records
                if (r.entry_time and r.entry_time >= min_date) or
                   (r.exit_time and r.exit_time >= min_date)
            ]

        total_records = len(records)
        total_active = len([r for r in records if r.status == "Ativo"])
        total_exits = len([r for r in records if r.status == "Inativo"])
        quick_exits = len([r for r in records if r.tag == "🚨 Saiu em < 15 min"])
        quick_pct = round((quick_exits / total_exits * 100), 1) if total_exits > 0 else 0.0

        return AnalyticsSummary(
            total_records=total_records,
            total_active=total_active,
            total_exits=total_exits,
            quick_exits_under_15m=quick_exits,
            quick_exit_percentage=quick_pct,
            participants=records
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar dados analíticos: {e}")
