import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase = create_client(url, key)

# Try inserting a dummy listing
data = {
    "title": "Test Listing",
    "description": "This is a test",
    "condition": "Good",
    "price": 10.0,
    "category": "Electronics",
    "image_urls": [],
    "seller_id": "92619c12-df36-4773-a9a5-c6ebe8a34c0c",
    "institution_domain": "sitpune.edu.in",
    "embedding": [0.1] * 384
}
try:
    res = supabase.table("listings").insert(data).execute()
    print("Success:", res)
except Exception as e:
    print("Error:", e)
