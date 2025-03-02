from typing import Optional

from src.services.db import DBClient


class HostedReleaseRepository:
    def __init__(self, db: DBClient):
        self.db = db

    def get_latest_release(
        self, key_id: str, owner: str, repo: str, version: Optional[str]
    ):
        return (
            self.db.table("repositories_keys")
            .select("""
              hosted_releases(
                owner: organization_name,
                repository: repository_name,
                version,
                build_number,
                env_variables,
                template_id,
                bootstrap_command,
                actions: actions(
                  action,
                  description,
                  method,
                  input_schema,
                  output_schema,
                  price_input_mt,
                  price_output_mt,
                  price_run,
                  price_run_second,
                  created_at
                ),
                created_at
              )
            """)
            .eq("organization_name", owner)
            .eq("repository_name", repo)
            # .eq("version", version)  # FIXME: Check version
            .eq("is_hosted", True)
            .or_(f"key_id.eq.{key_id}, is_private.eq.false")
            .order("build_number", desc=True, foreign_table="hosted_releases")
            .limit(1)
            .single()
            .execute()
        ).data["hosted_releases"][0]
