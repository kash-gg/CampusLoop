from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class TransactionCreate(BaseModel):
    listing_id: str
    buyer_id: str
    seller_id: str

class TransactionUpdate(BaseModel):
    status: Optional[str] = None
    buyer_condition_rating: Optional[str] = None
    dispute_reason: Optional[str] = None
    meetup_location: Optional[str] = None
    meetup_time: Optional[datetime] = None

class MeetupDetails(BaseModel):
    location: str
    time: datetime

class TransactionResponse(BaseModel):
    id: str
    listing_id: str
    buyer_id: str
    seller_id: str
    status: str
    buyer_condition_rating: Optional[str] = None
    dispute_reason: Optional[str] = None
    meetup_location: Optional[str] = None
    meetup_time: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
