from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from app.services.trust_score import compute_trust_score
from app.db.supabase import get_supabase
from supabase import Client
import asyncio
import asyncpg
from app.config import get_settings

router = APIRouter(prefix="/api/trust", tags=["trust"])
settings = get_settings()

async def recompute_user_trust(user_id: str, supabase: Client) -> dict:
    """Computes the user's trust score and caches it in the database."""
    res = compute_trust_score(user_id, supabase)
    supabase.table("users").update({
        "trust_score": res["score"],
        "trust_badge": res["badge"]
    }).eq("id", user_id).execute()
    return res

@router.get("/{user_id}")
async def get_user_trust(user_id: str, supabase: Client = Depends(get_supabase)):
    """Fetches the current trust score breakdown for a user."""
    try:
        # Recompute on the fly to ensure accuracy, returning latest breakdown
        res = compute_trust_score(user_id, supabase)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate trust score: {str(e)}")

@router.post("/recompute/{user_id}")
async def trigger_recompute(user_id: str, background_tasks: BackgroundTasks, supabase: Client = Depends(get_supabase)):
    """Triggers an asynchronous recomputation and caching of trust score."""
    background_tasks.add_task(recompute_user_trust, user_id, supabase)
    return {"status": "recomputation scheduled"}

# PostgreSQL NOTIFY Listener Task
async def trust_notification_listener(supabase: Client):
    """
    Background loop that listens to PostgreSQL NOTIFY on the 'trust_recompute' channel.
    Only active if DATABASE_URL is configured.
    """
    db_url = getattr(settings, "database_url", None)
    if not db_url:
        print("DATABASE_URL not configured. Trust recompute listener is inactive.")
        return
        
    print("Starting trust recompute listener...")
    while True:
        try:
            conn = await asyncpg.connect(db_url)
            
            async def handle_notification(connection, pid, channel, payload):
                print(f"Received trust recompute notification for user: {payload}")
                try:
                    await recompute_user_trust(payload, supabase)
                except Exception as ex:
                    print(f"Error handling notification: {ex}")
                    
            await conn.add_listener('trust_recompute', handle_notification)
            
            # Keep the connection alive
            while True:
                await asyncio.sleep(10)
                
        except (asyncpg.PostgresError, OSError) as e:
            print(f"Database connection error in trust listener: {e}. Retrying in 10s...")
            await asyncio.sleep(10)
        except Exception as e:
            print(f"Unexpected error in trust listener: {e}")
            await asyncio.sleep(10)
