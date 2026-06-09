from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.models.transaction import TransactionResponse
from app.db.supabase import get_supabase
from supabase import Client

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/disputes", response_model=List[TransactionResponse])
async def list_disputes(supabase: Client = Depends(get_supabase)):
    """Lists all transactions that are currently in 'disputed' state."""
    res = supabase.table("transactions") \
        .select("*") \
        .eq("status", "disputed") \
        .order("updated_at", desc=True) \
        .execute()
    return res.data or []

@router.post("/disputes/{tx_id}/resolve", response_model=TransactionResponse)
async def resolve_dispute(tx_id: str, outcome: str, supabase: Client = Depends(get_supabase)):
    """
    Resolves an open dispute.
    outcome must be: 'resolved_buyer' or 'resolved_seller'
    """
    if outcome not in ["resolved_buyer", "resolved_seller"]:
        raise HTTPException(status_code=400, detail="Outcome must be 'resolved_buyer' or 'resolved_seller'")
        
    # 1. Update transaction status
    res = supabase.table("transactions") \
        .update({
            "status": outcome,
            "updated_at": "now()"
        }) \
        .eq("id", tx_id) \
        .eq("status", "disputed") \
        .execute()
        
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to resolve dispute (invalid status or ID)")
        
    tx_data = res.data[0]
    
    # 2. Update listing status based on who won
    listing_status = "expired" if outcome == "resolved_buyer" else "sold"
    supabase.table("listings") \
        .update({"status": listing_status, "updated_at": "now()"}) \
        .eq("id", tx_data["listing_id"]) \
        .execute()
        
    return tx_data
