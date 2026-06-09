from datetime import datetime, timezone
from supabase import Client
from typing import Dict, Any

# Condition mapping for numerical comparison
CONDITION_MAP = {
    "Like New": 4,
    "Good": 3,
    "Fair": 2,
    "For Parts": 1
}

def calculate_accuracy_score(listing_cond: str, buyer_cond: str) -> float:
    """
    Compare original listing condition against buyer rating.
    Returns a score from 1.0 to 5.0.
    """
    if not listing_cond or not buyer_cond:
        return 5.0
        
    val_list = CONDITION_MAP.get(listing_cond, 3)
    val_buyer = CONDITION_MAP.get(buyer_cond, 3)
    
    if val_buyer >= val_list:
        return 5.0  # Perfect match or buyer rated it better
    
    diff = val_list - val_buyer
    if diff == 1:
        return 4.0  # 1 step off
    elif diff == 2:
        return 2.5  # 2 steps off
    else:
        return 1.0  # 3 steps off (e.g. Like New vs For Parts)

def compute_trust_score(user_id: str, supabase: Client) -> Dict[str, Any]:
    """
    Score is a weighted sum of:
      - completion_rate       (0.35) — completed / total transactions
      - condition_accuracy    (0.25) — listed condition matches buyer rating
      - response_time_score   (0.15) — avg time to respond to interest
      - dispute_penalty       (0.15) — deduction per unresolved dispute
      - account_age_bonus     (0.10) — longevity bonus, capped
      
    Score decays on inactivity (no transactions in 60 days -> gradual decay).
    """
    now = datetime.now(timezone.utc)
    
    # 1. Fetch user account age
    user_res = supabase.table("users").select("account_created_at").eq("id", user_id).execute()
    if not user_res.data:
        return {"score": 0.00, "badge": "New", "breakdown": {}}
    
    account_created_at = datetime.fromisoformat(user_res.data[0]["account_created_at"].replace("Z", "+00:00"))
    account_age_days = (now - account_created_at).days
    
    # 2. Fetch all transactions for this user as seller
    tx_res = supabase.table("transactions") \
        .select("*, listings(condition)") \
        .eq("seller_id", user_id) \
        .execute()
        
    tx_list = tx_res.data or []
    
    # Filter transactions
    # Exclude raw 'interested' if it hasn't progressed, but count it if it was processed
    total_tx_count = 0
    completed_tx_count = 0
    disputes_buyer_won = 0
    
    accuracy_scores = []
    response_scores = []
    
    last_activity_date = account_created_at
    
    for tx in tx_list:
        status = tx.get("status")
        created_at = datetime.fromisoformat(tx.get("created_at").replace("Z", "+00:00"))
        updated_at = datetime.fromisoformat(tx.get("updated_at").replace("Z", "+00:00"))
        
        if updated_at > last_activity_date:
            last_activity_date = updated_at
            
        # Total counts (exclude 'interested' status unless it's the only status,
        # but let's count anything that has been confirmed, declined, completed, or disputed)
        if status != "interested":
            total_tx_count += 1
            
        if status in ["completed", "resolved_seller"]:
            completed_tx_count += 1
            
        if status == "resolved_buyer":
            disputes_buyer_won += 1
            
        # Condition accuracy
        buyer_rating = tx.get("buyer_condition_rating")
        listing_info = tx.get("listings")
        if buyer_rating and listing_info and status == "completed":
            listing_cond = listing_info.get("condition")
            acc_score = calculate_accuracy_score(listing_cond, buyer_rating)
            accuracy_scores.append(acc_score)
            
        # Response time (difference between created_at and updated_at when it moves out of interested)
        if status != "interested":
            diff_hours = (updated_at - created_at).total_seconds() / 3600.0
            if diff_hours < 2.0:
                resp_score = 5.0
            elif diff_hours < 12.0:
                resp_score = 4.0
            elif diff_hours < 24.0:
                resp_score = 3.0
            elif diff_hours < 48.0:
                resp_score = 2.0
            else:
                resp_score = 1.0
            response_scores.append(resp_score)

    # 3. Calculate components
    
    # Completion Rate Score (0.35)
    if total_tx_count > 0:
        completion_rate = completed_tx_count / total_tx_count
        completion_score = completion_rate * 5.0
    else:
        completion_score = 0.0 # Default 0 for new user
        
    # Condition Accuracy Score (0.25)
    if accuracy_scores:
        accuracy_score = sum(accuracy_scores) / len(accuracy_scores)
    else:
        accuracy_score = 5.0 # Default 5.0 if no ratings yet
        
    # Response Time Score (0.15)
    if response_scores:
        response_score = sum(response_scores) / len(response_scores)
    else:
        response_score = 5.0 # Default 5.0 if no responses yet
        
    # Dispute Penalty (0.15)
    # Deduct 1.5 per buyer-won dispute
    dispute_score = max(0.0, 5.0 - (disputes_buyer_won * 1.5))
    
    # Account Age Bonus (0.10)
    age_bonus = min(5.0, (account_age_days / 30.0) * 1.0)
    
    # Weighted Score calculation
    weighted_score = (
        0.35 * completion_score +
        0.25 * accuracy_score +
        0.15 * response_score +
        0.15 * dispute_score +
        0.10 * age_bonus
    )
    
    # Apply Inactivity Decay
    days_inactive = (now - last_activity_date).days
    decay = 0.0
    if days_inactive > 60:
        decay = (days_inactive - 60) * 0.05
        weighted_score = max(1.0, weighted_score - decay)
        
    # Round to 2 decimal places
    final_score = round(weighted_score, 2)
    
    # 4. Badge assignment
    # Flagged: < 1.5 or too many disputes won by buyer
    if final_score < 1.5 or disputes_buyer_won >= 2:
        badge = "Flagged"
    elif completed_tx_count == 0:
        badge = "New"
    elif completed_tx_count >= 10 and final_score >= 4.0:
        badge = "Trusted"
    elif completed_tx_count >= 3 and final_score >= 2.0:
        badge = "Verified"
    else:
        # Default badge if they have 1-2 completed transactions but good score
        badge = "Verified" if final_score >= 2.0 else "New"
        
    return {
        "score": final_score,
        "badge": badge,
        "breakdown": {
            "completion_rate_score": round(completion_score, 2),
            "condition_accuracy_score": round(accuracy_score, 2),
            "response_time_score": round(response_score, 2),
            "dispute_penalty_score": round(dispute_score, 2),
            "account_age_bonus": round(age_bonus, 2),
            "days_inactive": days_inactive,
            "decay_applied": round(decay, 2)
        }
    }
