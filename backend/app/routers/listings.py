from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.models.listing import ListingCreate, ListingUpdate, ListingResponse
from app.services.embedding import generate_embedding
from app.db.supabase import get_supabase
from supabase import Client

router = APIRouter(prefix="/api/listings", tags=["listings"])

@router.post("", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
async def create_listing(listing: ListingCreate, supabase: Client = Depends(get_supabase)):
    embedding = generate_embedding(listing.title, listing.description, listing.condition)
    
    data = listing.model_dump()
    data["embedding"] = embedding
    
    response = supabase.table("listings").insert(data).execute()
    
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create listing")
    
    return response.data[0]

@router.get("", response_model=List[ListingResponse])
async def get_listings(
    institution_domain: str, 
    limit: int = 20, 
    offset: int = 0,
    supabase: Client = Depends(get_supabase)
):
    response = supabase.table("listings") \
        .select("*") \
        .eq("institution_domain", institution_domain) \
        .eq("status", "active") \
        .order("created_at", desc=True) \
        .range(offset, offset + limit - 1) \
        .execute()
        
    return response.data

@router.get("/{listing_id}", response_model=ListingResponse)
async def get_listing(listing_id: str, supabase: Client = Depends(get_supabase)):
    response = supabase.table("listings").select("*").eq("id", listing_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Listing not found")
        
    return response.data[0]

@router.patch("/{listing_id}", response_model=ListingResponse)
async def update_listing(listing_id: str, listing: ListingUpdate, supabase: Client = Depends(get_supabase)):
    update_data = listing.model_dump(exclude_unset=True)
    
    # Check if we need to regenerate embedding
    if any(k in update_data for k in ["title", "description", "condition"]):
        # Fetch current listing to get missing fields
        curr_response = supabase.table("listings").select("title, description, condition").eq("id", listing_id).execute()
        if not curr_response.data:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        curr_listing = curr_response.data[0]
        new_title = update_data.get("title", curr_listing.get("title"))
        new_desc = update_data.get("description", curr_listing.get("description"))
        new_cond = update_data.get("condition", curr_listing.get("condition"))
        
        update_data["embedding"] = generate_embedding(new_title, new_desc, new_cond)
    
    update_data["updated_at"] = "now()"
    response = supabase.table("listings").update(update_data).eq("id", listing_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Listing not found or update failed")
        
    return response.data[0]

@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_listing(listing_id: str, supabase: Client = Depends(get_supabase)):
    response = supabase.table("listings").update({"status": "expired", "updated_at": "now()"}).eq("id", listing_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Listing not found")
    return None
