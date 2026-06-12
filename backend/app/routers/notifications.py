from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from app.db.supabase import get_supabase
from supabase import Client
from datetime import datetime

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    message: str
    link: Optional[str] = None
    read: bool
    created_at: datetime

    class Config:
        arbitrary_types_allowed = True

@router.get("", response_model=List[NotificationResponse])
async def get_notifications(user_id: str, limit: int = 20, supabase: Client = Depends(get_supabase)):
    """Fetches user notifications."""
    res = supabase.table("notifications") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .limit(limit) \
        .execute()
    return res.data or []

@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_as_read(notification_id: str, supabase: Client = Depends(get_supabase)):
    """Marks a notification as read."""
    res = supabase.table("notifications") \
        .update({"read": True}) \
        .eq("id", notification_id) \
        .execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Notification not found")
    return res.data[0]
