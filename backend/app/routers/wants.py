from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.models.want import WantCreate, WantUpdate, WantResponse
from app.db.supabase import get_supabase
from app.services.embedding import generate_embedding
from supabase import Client

router = APIRouter(prefix="/api/wants", tags=["wants"])

@router.post("", response_model=WantResponse, status_code=status.HTTP_201_CREATED)
async def create_want(want: WantCreate, supabase: Client = Depends(get_supabase)):
    """Creates a new want request and generates its embedding for similarity search."""
    # Generate embedding using the want details
    embedding = generate_embedding(want.title, want.description or "", "")
    
    data = want.model_dump()
    data["embedding"] = embedding
    data["status"] = "open"
    
    res = supabase.table("wants").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create want request")
    return res.data[0]

@router.get("", response_model=List[WantResponse])
async def get_wants(
    institution_domain: str,
    limit: int = 50,
    supabase: Client = Depends(get_supabase)
):
    """Fetches open wants scoped to the user's institution."""
    res = supabase.table("wants") \
        .select("*") \
        .eq("institution_domain", institution_domain) \
        .eq("status", "open") \
        .order("created_at", desc=True) \
        .limit(limit) \
        .execute()
    return res.data or []

@router.patch("/{want_id}", response_model=WantResponse)
async def update_want(want_id: str, want: WantUpdate, supabase: Client = Depends(get_supabase)):
    update_data = want.model_dump(exclude_unset=True)
    
    # Check if we need to regenerate embedding
    if any(k in update_data for k in ["title", "description"]):
        # Fetch current want
        curr_res = supabase.table("wants").select("title, description").eq("id", want_id).execute()
        if not curr_res.data:
            raise HTTPException(status_code=404, detail="Want not found")
        
        curr = curr_res.data[0]
        new_title = update_data.get("title", curr.get("title"))
        new_desc = update_data.get("description", curr.get("description"))
        update_data["embedding"] = generate_embedding(new_title, new_desc or "", "")
        
    res = supabase.table("wants").update(update_data).eq("id", want_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Want not found or update failed")
    return res.data[0]

@router.delete("/{want_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_want(want_id: str, supabase: Client = Depends(get_supabase)):
    """Deletes or marks want as expired/deleted."""
    res = supabase.table("wants").update({"status": "expired"}).eq("id", want_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Want not found")
    return None
