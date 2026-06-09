from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class WantCreate(BaseModel):
    buyer_id: str
    title: str = Field(..., min_length=3)
    description: Optional[str] = None
    max_budget: Optional[float] = Field(None, ge=0)
    institution_domain: str

class WantUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    max_budget: Optional[float] = None
    status: Optional[str] = None

class WantResponse(BaseModel):
    id: str
    buyer_id: str
    title: str
    description: Optional[str] = None
    max_budget: Optional[float] = None
    institution_domain: str
    status: str
    expires_at: datetime
    created_at: datetime
