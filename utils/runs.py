import traceback
from typing import Optional

from utils.db_client import DBClient


def count_run(db: DBClient, key_id: str, owner: str, repo: str, version: Optional[str], action: Optional[str],
              input_tokens: int, output_tokens: Optional[int]) -> str | None:
    # FIXME: Calc inside this function the input and output tokens
    try:
        hosted_release_res = (db.table("hosted_releases")
                          .select("""
                            owner: organization_name,
                            repository: repository_name,
                            version,
                            build_number,
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
                          """)
                          .eq("organization_name", owner)
                          .eq("repository_name", repo)
                          # .eq("version", version) # FIXME: Check version
                          .order("build_number", desc=True)
                          .limit(1)
                          .execute())
        if hosted_release_res.data is None or len(hosted_release_res.data) < 1: return
        release = hosted_release_res.data[0]
        selected_action = next((item for item in release["actions"] if item["action"] == action), None)
        res = (db
               .table("runs")
               .insert({
            "key_id": key_id,
            "organization_name": release["owner"],
            "repository_name": release["repository"],
            "build_number": release["build_number"],
            "action": selected_action["action"],
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "price_input_mt": selected_action["price_input_mt"],
            "price_output_mt": selected_action["price_output_mt"],
            "price_run": selected_action["price_run"],
            "price_run_second": selected_action["price_run_second"],
            "run_seconds": None  # FIXME: Calc run seconds
        }).execute())
        # Skip check if the request has gone ok to prevent time waists
        return res.data[0]["id"]
    except Exception as e:
        traceback.print_exc()
        print(e)
        # raise HTTPException(status_code=500, detail="Server Error")
        return
