import traceback
from typing import Optional

from src.services.db import DBClient


class RunsRepository:
    def __init__(self, db: DBClient):
        self.db = db

    def start_session(
        self,
        organization_name: str,
        repository_name: str,
        build_number: int,
        sandbox_id: str,
        pid: int,
        price_run_second: float,
        key_id: str,
    ) -> str | None:
        try:
            res = (
                self.db.table("run_sessions")
                .insert(
                    {
                        "org_key_id": key_id,
                        "sandbox_id": sandbox_id,
                        "pid": pid,
                        "price_run_second": price_run_second,
                        "organization_name": organization_name,
                        "repository_name": repository_name,
                        "build_number": build_number,
                    }
                )
                .execute()
            )
            return res.data[0]["id"]
        except Exception:
            traceback.print_exc()
            return None

    def get_session(self, id: str) -> dict | None:
        try:
            res = (
                self.db.table("run_sessions")
                .select("*")
                .eq("id", id)
                .single()
                .execute()
            )
            return res.data
        except Exception:
            traceback.print_exc()

    def end_session(self, id: str) -> bool:
        try:
            res = (
                self.db.table("run_sessions")
                .update({"closed_at": "now()"})
                .eq("id", id)
                .execute()
            )
            return res.data is not None
        except Exception:
            traceback.print_exc()
            return False

    def count_run(
        self,
        key_id: str,
        owner: str,
        repo: str,
        build_number: int,
        action: str,
        run_seconds: Optional[float],
        price_run_second: Optional[float],
        input_tokens: Optional[int] = None,
        output_tokens: Optional[int] = None,
    ) -> str | None:
        # FIXME: Calc inside this function the input and output tokens
        try:
            res = (
                self.db.table("runs")
                .insert(
                    {
                        "key_id": key_id,
                        "organization_name": owner,
                        "repository_name": repo,
                        "build_number": build_number,
                        "action": action,
                        "price_run_second": price_run_second,
                        "run_seconds": run_seconds,
                        "input_tokens": input_tokens,
                        "output_tokens": output_tokens,
                    }
                )
                .execute()
            )
            # Skip check if the request has gone ok to prevent time waists
            return res.data[0]["id"]
        except Exception as e:
            traceback.print_exc()
            print(e)
            # raise HTTPException(status_code=500, detail="Server Error")
            return
