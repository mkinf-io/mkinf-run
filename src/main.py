import traceback
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.params import Depends
from requests import HTTPError

from src.utils.auth import check_auth
from src.utils.count_tokens import count_tokens
from src.utils.db_client import create_db_client, DBClient, get_db
from src.utils.runs import count_run
from typing import Optional
from src.utils.MCPSession import MCPSession

app = FastAPI()
create_db_client()


@app.get("/")
def get_root():
    return {"message": "👾 Hello from mkinf hub runner!"}

@app.post("/v0.1/{owner}/{repo_version}")
async def init_mcp(owner: str, repo_version: str, body: dict,
               key_id: str = Depends(check_auth), db: Optional[DBClient] = Depends(get_db)):
    if not db: return HTTPException(status_code=500, detail="Server error")
    repo, version = repo_version.split(":", 1) if ":" in repo_version else (repo_version, None)
    # TODO: check for credit card
    # TODO: Check if can run privates repo (is_private)
    try:
        hosted_release_res = (db.table("hosted_releases")
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
        if hosted_release_res.data is None or len(hosted_release_res.data) < 1:
            raise HTTPException(status_code=404, detail="Not found")
        release = hosted_release_res.data[0]
        if not release["template_id"] or not release["bootstrap_command"]:
            raise HTTPException(status_code=404, detail="Not found")
        session = MCPSession(owner=owner, repo=repo, version=version, template_id=release["template_id"], bootstrap_command=release["bootstrap_command"], envs=body.get("env") or None)
        session_info = await session.start(timeout=body.get("timeout") or 60)
        # FIXME: Create a jwt tokens from session_info and user API key
        return session_info
    except HTTPError as e:
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/v0.1/{owner}/{repo_version}/{action}")
async def run_mcp(owner: str, repo_version: str, action: str, body: dict,
               key_id: str = Depends(check_auth), db: Optional[DBClient] = Depends(get_db)):
    if not db: return HTTPException(status_code=500, detail="Server error")
    repo, version = repo_version.split(":", 1) if ":" in repo_version else (repo_version, None)
    # TODO: check for credit card
    # TODO: Check if can run privates repo (is_private)
    try:
        input_tokens = count_tokens(str(body.get("args"))) if body else 0
        hosted_release_res = (db.table("hosted_releases")
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
        if hosted_release_res.data is None or len(hosted_release_res.data) < 1:
            raise HTTPException(status_code=404, detail="Not found")
        release = hosted_release_res.data[0]
        if not release["template_id"] or not release["bootstrap_command"]:
            raise HTTPException(status_code=404, detail="Not found")
        result = await run_mcp_action(
          owner=owner,
          repo=repo,
          version=version,
          action=action,
          template_id=release["template_id"],
          bootstrap_command=release["bootstrap_command"],
          args=body.get("args") or None,
          envs=body.get("env") or None,
          timeout=body.get("timeout") or 60,
        )
        output_tokens = count_tokens(str(result))
        count_run(
          db=db,
          key_id=key_id,
          owner=owner,
          repo=repo,
          action=action,
          version=version,
          input_tokens=input_tokens,
          output_tokens=output_tokens,
          run_seconds=result["run_seconds"] if result else None
        )
        return result["response"] if result else None
    except HTTPException as e:
        raise e
    except HTTPError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        traceback.print_exc()
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

# Additional route
@app.get("/about")
def get_about():
    return {"message": "👾 mkinf hub runner"}
