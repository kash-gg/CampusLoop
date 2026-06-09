from apscheduler.schedulers.background import BackgroundScheduler
from app.db.supabase import get_supabase
from app.services.surge_detector import check_surge
from datetime import datetime, timezone, timedelta

scheduler = BackgroundScheduler()

def run_surge_checks():
    """Recalculates surge status for all unique institution domains in the database."""
    print("Running background surge detection checks...")
    try:
        supabase = get_supabase()
        
        # Fetch unique institution domains from listings/users
        res = supabase.table("users").select("institution_domain").execute()
        domains = set(u["institution_domain"] for u in (res.data or []))
        
        for domain in domains:
            print(f"Checking surge for: {domain}")
            # Run check_surge (runs async, we run synchronously in thread pool)
            import asyncio
            asyncio.run(check_surge(domain, supabase))
            
    except Exception as e:
        print(f"Error in background surge checks: {e}")

def run_nightly_cleanup():
    """Nightly maintenance: clean up old notifications or expired wants (> 30 days)."""
    print("Running background database cleanup...")
    try:
        supabase = get_supabase()
        threshold_date = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        
        # Expire wants older than 30 days
        supabase.table("wants") \
            .update({"status": "expired"}) \
            .eq("status", "open") \
            .lt("created_at", threshold_date) \
            .execute()
            
        print("Cleanup completed.")
    except Exception as e:
        print(f"Error in database cleanup: {e}")

def start_scheduler():
    """Starts the background scheduler and adds tasks."""
    if not scheduler.running:
        # Check surge every 6 hours
        scheduler.add_job(run_surge_checks, 'interval', hours=6, id='surge_checks')
        # Nightly database cleanup at 2:00 AM
        scheduler.add_job(run_nightly_cleanup, 'cron', hour=2, minute=0, id='db_cleanup')
        
        scheduler.start()
        print("APScheduler background tasks initialized and started.")

def shutdown_scheduler():
    """Gracefully shuts down the scheduler."""
    if scheduler.running:
        scheduler.shutdown()
        print("APScheduler background tasks shut down.")
