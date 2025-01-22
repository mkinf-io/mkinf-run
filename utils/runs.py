import traceback
from utils.db_client import DBClient


def count_run(db: DBClient, key_id: str, owner: str, repo: str, version: str | None, action: str | None,
              input_tokens: int, output_tokens: int | None) -> str | None:
    try:
        # TODO: Get price
        hosted_release = (db.table("hosted_releases")
                          .select("*")
                          .eq("organization_name", owner)
                          .eq("repository_name", repo)
                          .order("build_number", desc=True) # FIXME: Check version
                          .limit(1)
                          .execute()
                          )
        if hosted_release.data is None or len(hosted_release.data) < 1: return
        print(hosted_release)
        build_number = 0  # TODO: derive it from version
        res = (db
               .table("runs")
               .insert({
            "key_id": key_id,
            "organization_name": owner,
            "repository_name": repo,
            "build_number": build_number,
            "action": action,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "price_input_mt": hosted_release.data[0]["price_input_mt"],
            "price_output_mt": hosted_release.data[0]["price_output_mt"]
        })
               .execute())
        # Skip check if the request has gone ok to prevent time waists
        return res.data[0]["id"]
    except Exception as e:
        traceback.print_exc()
        print(e)
        #raise HTTPException(status_code=500, detail="Server Error")
        return
