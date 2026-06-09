from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.models.transaction import TransactionCreate, TransactionUpdate, TransactionResponse, MeetupDetails
from app.db.supabase import get_supabase
from supabase import Client

router = APIRouter(prefix="/api/transactions", tags=["transactions"])

@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(tx: TransactionCreate, supabase: Client = Depends(get_supabase)):
    """Creates a new transaction indicating a buyer is interested in a listing."""
    data = tx.model_dump()
    data["status"] = "interested"
    
    # Verify the listing is active
    list_res = supabase.table("listings").select("status").eq("id", tx.listing_id).execute()
    if not list_res.data or list_res.data[0]["status"] != "active":
        raise HTTPException(status_code=400, detail="Listing is not active or does not exist")

    res = supabase.table("transactions").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create transaction")
    return res.data[0]

@router.get("", response_model=List[TransactionResponse])
async def get_my_transactions(user_id: str, mode: str = "all", supabase: Client = Depends(get_supabase)):
    """Fetches transactions where the user is either the buyer or the seller."""
    query = supabase.table("transactions").select("*")
    
    if mode == "buying":
        query = query.eq("buyer_id", user_id)
    elif mode == "selling":
        query = query.eq("seller_id", user_id)
    else:
        query = query.or_(f"buyer_id.eq.{user_id},seller_id.eq.{user_id}")
        
    res = query.order("updated_at", desc=True).execute()
    return res.data or []

@router.get("/{tx_id}", response_model=TransactionResponse)
async def get_transaction(tx_id: str, supabase: Client = Depends(get_supabase)):
    res = supabase.table("transactions").select("*").eq("id", tx_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return res.data[0]

@router.patch("/{tx_id}/confirm", response_model=TransactionResponse)
async def confirm_transaction(tx_id: str, supabase: Client = Depends(get_supabase)):
    """Seller confirms interest, moving the transaction to 'confirmed' status."""
    res = supabase.table("transactions") \
        .update({"status": "confirmed", "updated_at": "now()"}) \
        .eq("id", tx_id) \
        .eq("status", "interested") \
        .execute()
        
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to confirm transaction (invalid status or ID)")
    return res.data[0]

@router.patch("/{tx_id}/decline", response_model=TransactionResponse)
async def decline_transaction(tx_id: str, supabase: Client = Depends(get_supabase)):
    """Seller declines interest, moving the transaction to 'declined' status."""
    res = supabase.table("transactions") \
        .update({"status": "declined", "updated_at": "now()"}) \
        .eq("id", tx_id) \
        .eq("status", "interested") \
        .execute()
        
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to decline transaction (invalid status or ID)")
    return res.data[0]

@router.patch("/{tx_id}/meetup", response_model=TransactionResponse)
async def coordinate_meetup(tx_id: str, meetup: MeetupDetails, supabase: Client = Depends(get_supabase)):
    """Both coordinate and arrange a meetup details."""
    res = supabase.table("transactions") \
        .update({
            "status": "meetup_arranged",
            "meetup_location": meetup.location,
            "meetup_time": meetup.time.isoformat(),
            "updated_at": "now()"
        }) \
        .eq("id", tx_id) \
        .or_("status.eq.confirmed,status.eq.meetup_arranged") \
        .execute()
        
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to schedule meetup (invalid status or ID)")
    return res.data[0]

@router.patch("/{tx_id}/complete", response_model=TransactionResponse)
async def complete_transaction(tx_id: str, condition_rating: str, supabase: Client = Depends(get_supabase)):
    """Buyer confirms they have met up, completed exchange, and rates item condition."""
    if condition_rating not in ["Like New", "Good", "Fair", "For Parts"]:
        raise HTTPException(status_code=400, detail="Invalid condition rating")

    # 1. Update transaction to completed
    res = supabase.table("transactions") \
        .update({
            "status": "completed",
            "buyer_condition_rating": condition_rating,
            "updated_at": "now()"
        }) \
        .eq("id", tx_id) \
        .eq("status", "meetup_arranged") \
        .execute()
        
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to complete transaction (invalid status or ID)")
    
    tx_data = res.data[0]
    
    # 2. Mark the listing as sold
    supabase.table("listings") \
        .update({"status": "sold", "updated_at": "now()"}) \
        .eq("id", tx_data["listing_id"]) \
        .execute()
        
    return tx_data

@router.post("/{tx_id}/dispute", response_model=TransactionResponse)
async def dispute_transaction(tx_id: str, dispute_reason: str, supabase: Client = Depends(get_supabase)):
    """Buyer disputes the transaction (e.g. seller did not show, condition is majorly misrepresented)."""
    if not dispute_reason.strip():
        raise HTTPException(status_code=400, detail="Dispute reason cannot be empty")
        
    res = supabase.table("transactions") \
        .update({
            "status": "disputed",
            "dispute_reason": dispute_reason,
            "updated_at": "now()"
        }) \
        .eq("id", tx_id) \
        .eq("status", "meetup_arranged") \
        .execute()
        
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to open dispute (invalid status or ID)")
    return res.data[0]
