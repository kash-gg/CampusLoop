from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
from app.routers import listings, search, trust, transactions, admin, wants, notifications, surge
from app.db.supabase import get_supabase
from app.jobs.scheduler import start_scheduler, shutdown_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start pg_notify listener
    supabase = get_supabase()
    listener_task = asyncio.create_task(trust.trust_notification_listener(supabase))
    
    # Start background schedulers
    start_scheduler()
    
    yield
    # Shutdown: Clean up background tasks
    listener_task.cancel()
    shutdown_scheduler()

app = FastAPI(
    title="CampusLoop API",
    description="Backend API for CampusLoop marketplace",
    version="0.1.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "ok"}

app.include_router(listings.router)
app.include_router(search.router)
app.include_router(trust.router)
app.include_router(transactions.router)
app.include_router(admin.router)
app.include_router(wants.router)
app.include_router(notifications.router)
app.include_router(surge.router)
