from fastapi import APIRouter, Depends
from app.services.embedding import generate_embedding
from app.db.supabase import get_supabase
from supabase import Client

router = APIRouter(prefix="/api/search", tags=["search"])

@router.get("")
async def semantic_search(
    q: str,
    institution: str,
    limit: int = 20,
    supabase: Client = Depends(get_supabase)
):
    if len(q.split()) < 3:
        # Fallback to ILIKE keyword search for very short queries
        query = f"%{q}%"
        response = supabase.table("listings") \
            .select("*") \
            .eq("institution_domain", institution) \
            .eq("status", "active") \
            .or_(f"title.ilike.{query},description.ilike.{query}") \
            .limit(limit) \
            .execute()
        return response.data
        
    # Semantic search
    # Note: We need to use supabase.rpc for vector similarity search since postgrest doesn't 
    # directly support it with a simple .eq()
    
    embedding = generate_embedding(q, "", "")
    
    # Requires a custom postgres function in supabase: match_listings
    response = supabase.rpc(
        "match_listings",
        {
            "query_embedding": embedding,
            "match_threshold": 0.5, # 1 - distance
            "match_count": limit,
            "institution": institution
        }
    ).execute()
    
    return response.data
