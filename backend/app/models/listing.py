from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ListingCreate(BaseModel):
    seller_id: str
    title: str = Field(..., min_length=3)
    description: Optional[str] = None
    condition: str = Field(..., description="Like New, Good, Fair, For Parts")
    price: float = Field(..., ge=0)
    category: Optional[str] = None
    image_urls: List[str] = []
    institution_domain: str

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    condition: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    image_urls: Optional[List[str]] = None
    status: Optional[str] = None

class ListingResponse(BaseModel):
    id: str
    seller_id: str
    title: str
    description: Optional[str]
    condition: str
    price: float
    category: Optional[str]
    image_urls: List[str]
    status: str
    institution_domain: str
    created_at: datetime
    updated_at: datetime
