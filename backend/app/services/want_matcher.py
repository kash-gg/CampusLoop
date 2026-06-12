from supabase import Client

async def match_listing_to_wants(listing_id: str, supabase: Client):
    """
    Called when a new listing is created.
    Matches the listing against all open wants in the same campus.
    If similarity > 0.75, notifies the want posters.
    """
    # 1. Fetch listing details and its embedding
    list_res = supabase.table("listings").select("title, embedding, institution_domain").eq("id", listing_id).execute()
    if not list_res.data:
        return
        
    listing = list_res.data[0]
    listing_title = listing["title"]
    listing_emb = listing["embedding"]
    institution = listing["institution_domain"]
    
    if not listing_emb:
        return
        
    # 2. Match wants using postgres match_wants RPC
    match_res = supabase.rpc(
        "match_wants",
        {
            "query_embedding": listing_emb,
            "match_threshold": 0.75,
            "match_count": 100,
            "institution": institution
        }
    ).execute()
    
    matches = match_res.data or []
    
    # 3. Create notifications for matched users
    for want in matches:
        buyer_id = want["buyer_id"]
        want_title = want["title"]
        
        notification_data = {
            "user_id": buyer_id,
            "type": "want_match",
            "title": "Wanted Item Match Found! 🎯",
            "message": f"Someone just listed '{listing_title}' which matches your wanted item '{want_title}'!",
            "link": f"/listings/{listing_id}"
        }
        
        supabase.table("notifications").insert(notification_data).execute()
