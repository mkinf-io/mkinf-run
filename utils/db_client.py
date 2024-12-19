import os
from supabase import Client
from supabase import create_client
from supabase.lib.client_options import SyncClientOptions

DBClient = Client
db: DBClient | None = None

def create_db_client() -> DBClient:
    global db
    url: str = os.environ.get("SUPABASE_URL")
    key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    db = create_client(url, key, SyncClientOptions(persist_session=False, auto_refresh_token=False))
    return db

def get_db() -> DBClient | None:
    return db