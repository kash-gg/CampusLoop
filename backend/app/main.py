from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import asyncio
import logging
from app.routers import listings, search, trust, transactions, admin, wants, notifications, surge
from app.db.supabase import get_supabase
from app.jobs.scheduler import start_scheduler, shutdown_scheduler

# Configure logging to show errors in terminal
logging.basicConfig(
    level=logging.ERROR,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

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

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"-> {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"<- {response.status_code}")
    return response

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler to log all unhandled exceptions and return 500
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Include all routers
app.include_router(listings.router)
app.include_router(search.router)
app.include_router(trust.router)
app.include_router(transactions.router)
app.include_router(admin.router)
app.include_router(wants.router)
app.include_router(notifications.router)
app.include_router(surge.router)