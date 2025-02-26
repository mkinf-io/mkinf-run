import os
from supabase import Client
from supabase import create_client
from supabase.lib.client_options import SyncClientOptions
from typing import Optional

DBClient = Client
db: DBClient | None = None

def create_db_client() -> DBClient:
    global db
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url: raise ValueError("Missing SUPABASE_URL")
    if not key: raise ValueError("Missing SUPABASE_SERVICE_ROLE_KEY")

    db = create_client(url, key, SyncClientOptions(persist_session=False, auto_refresh_token=False))
    return db

def get_db() -> Optional[DBClient]:
    return db
