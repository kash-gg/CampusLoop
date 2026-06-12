from fastapi import APIRouter, Depends, HTTPException
from app.db.supabase import get_supabase
from app.services.surge_detector import check_surge
from supabase import Client

router = APIRouter(prefix="/api/surge", tags=["surge"])

@router.get("/{institution_domain}")
async def get_surge_status(institution_domain: str, supabase: Client = Depends(get_supabase)):
    """
    Returns the surge status for a specific campus.
    Checks and updates the status dynamically to guarantee fresh statistics.
    """
    try:
        res = await check_surge(institution_domain, supabase)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check surge status: {str(e)}")
