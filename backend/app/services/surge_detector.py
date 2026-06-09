from datetime import datetime, timedelta, timezone
from supabase import Client
from typing import Dict, Any, List
import statistics

async def check_surge(institution_domain: str, supabase: Client) -> Dict[str, Any]:
    """
    Check if listing activity in this campus is experiencing a surge (e.g., graduation/semester-end).
    Surge condition: today's count > 2 * rolling 7-day average (with a minimum baseline).
    Updates the cached surge_status table in database.
    """
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # 1. Count listings created today
    today_res = supabase.table("listings") \
        .select("id, price, category", count="exact") \
        .eq("institution_domain", institution_domain) \
        .gte("created_at", today_start.isoformat()) \
        .execute()
        
    today_count = today_res.count or 0
    today_listings = today_res.data or []

    # 2. Get history to compute 7-day rolling average (excluding today)
    seven_days_ago = today_start - timedelta(days=7)
    hist_res = supabase.table("listings") \
        .select("created_at") \
        .eq("institution_domain", institution_domain) \
        .gte("created_at", seven_days_ago.isoformat()) \
        .lt("created_at", today_start.isoformat()) \
        .execute()
        
    hist_listings = hist_res.data or []
    
    # Group counts by day
    daily_counts = [0] * 7
    for item in hist_listings:
        created_dt = datetime.fromisoformat(item["created_at"].replace("Z", "+00:00"))
        day_diff = (today_start - created_dt.replace(hour=0, minute=0, second=0, microsecond=0)).days
        if 0 <= day_diff < 7:
            daily_counts[day_diff] += 1
            
    # Calculate average (default to a baseline of 1.0 to prevent division by zero or tiny surges)
    avg_count = sum(daily_counts) / 7.0
    if avg_count < 1.0:
        avg_count = 1.0
        
    # Surge criteria: today > 2x average AND today's count >= 3 (minimum volume threshold)
    is_surge = today_count > 2.0 * avg_count and today_count >= 3
    
    # 3. Calculate category stats for suggestions if surge is active
    similar_items_today: List[Dict[str, Any]] = []
    
    if is_surge and today_listings:
        # Group listing prices by category
        cat_prices: Dict[str, List[float]] = {}
        for item in today_listings:
            cat = item.get("category") or "Other"
            price = float(item["price"])
            if cat not in cat_prices:
                cat_prices[cat] = []
            cat_prices[cat].append(price)
            
        for cat, prices in cat_prices.items():
            similar_items_today.append({
                "category": cat,
                "count": len(prices),
                "median_price": statistics.median(prices) if prices else 0.0
            })
            
    # 4. Cache status in surge_status table
    status_data = {
        "institution_domain": institution_domain,
        "is_surge": is_surge,
        "today_count": today_count,
        "avg_count": round(avg_count, 2),
        "updated_at": "now()"
    }
    
    supabase.table("surge_status").upsert(status_data).execute()
    
    return {
        "is_surge": is_surge,
        "today_count": today_count,
        "avg_count": round(avg_count, 2),
        "similar_items_today": similar_items_today
    }
