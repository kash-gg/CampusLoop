from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List
from app.models.listing import ListingCreate, ListingUpdate, ListingResponse
from app.services.embedding import generate_embedding
from app.services.want_matcher import match_listing_to_wants
from app.db.supabase import get_supabase
from supabase import Client
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/listings", tags=["listings"])

@router.post("", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
async def create_listing(
    listing: ListingCreate,
    background_tasks: BackgroundTasks,
    supabase: Client = Depends(get_supabase),
    current_user: dict = Depends(get_current_user)   # <-- new dependency
):
    # Generate embedding from listing data
    embedding = generate_embedding(listing.title, listing.description or "", listing.condition)
    
    # Convert listing to dict and add authenticated user fields
    data = listing.model_dump()
    data["embedding"] = embedding
    data["seller_id"] = current_user["id"]                      # from JWT
    data["institution_domain"] = current_user["institution_domain"]  # from JWT
    data["status"] = "active"   # ensure default status
    
    # Insert into Supabase
    response = supabase.table("listings").insert(data).execute()
    
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create listing")
        
    created_listing = response.data[0]
    background_tasks.add_task(match_listing_to_wants, created_listing["id"], supabase)
    
    return created_listing

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
