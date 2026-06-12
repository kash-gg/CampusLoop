from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

security = HTTPBearer()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        # Verify JWT with Supabase
        user = supabase.auth.get_user(token)
        if not user.user:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        
        # Get institution_domain from users table
        user_data = supabase.table("users").select("id, institution_domain").eq("id", user.user.id).execute()
        if not user_data.data:
            raise HTTPException(status_code=404, detail="User record not found")
        
        return {
            "id": user.user.id,
            "email": user.user.email,
            "institution_domain": user_data.data[0]["institution_domain"]
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))