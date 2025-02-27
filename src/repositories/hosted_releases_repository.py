from src.services.db import DBClient
from typing import Optional

class HostedReleaseRepository:
    def __init__(self, db: DBClient):
        self.db = db

    def get_latest_release(self, owner: str, repo: str, version: Optional[str]):
      return (self.db.table("hosted_releases")
        .select("""
            owner: organization_name,
            repository: repository_name,
            version,
            build_number,
            env_variables,
            template_id,
            bootstrap_command
        """)
        .eq("organization_name", owner)
        .eq("repository_name", repo)
        #.eq("version", version)  # FIXME: Check version
        .order("build_number", desc=True)
        .limit(1)
        .execute())