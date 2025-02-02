import traceback
from dotenv import load_dotenv

load_dotenv()

from typing import Any

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.params import Depends
from requests import HTTPError

from utils.auth import check_auth
from utils.count_tokens import count_tokens
from utils.db_client import create_db_client, DBClient, get_db
from utils.repositories import repositories
from utils.runs import count_run
from typing import Optional
from utils.mcp_client import run_mcp_action

app = FastAPI()
create_db_client()


@app.get("/")
def get_root():
    return {"message": "👾 Hello from mkinf hub!"}


@app.post("/v0.1/{owner}/{repo_version}")
def run_default_action(owner: str, repo_version: str, body: str | dict[str, Any],
                       key_id: str = Depends(check_auth), db: Optional[DBClient] = Depends(get_db)):
    repo, version = repo_version.split(":", 1) if ":" in repo_version else (repo_version, None)
    # TODO: check for credit card
    # TODO: Check if can run privates repo (is_private)
    try:
        input_tokens = count_tokens(str(body))
        result = repositories[owner][repo]['run'](body)
        output_tokens = count_tokens(result)
        count_run(db=db, key_id=key_id, owner=owner, repo=repo, action=None, version=version,
                  input_tokens=input_tokens, output_tokens=output_tokens)
        return result
    except HTTPException as e:
        raise e
    except HTTPError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        traceback.print_exc()
        print(e)
        raise HTTPException(status_code=500, detail="Server error")


@app.post("/v0.1/{owner}/{repo_version}/{action}")
def run_action(owner: str, repo_version: str, action: str, body: str | dict[str, Any],
               key_id: str = Depends(check_auth), db: Optional[DBClient] = Depends(get_db)):
    repo, version = repo_version.split(":", 1) if ":" in repo_version else (repo_version, None)
    # TODO: check for credit card
    # TODO: Check if can run privates repo (is_private)
    try:
        input_tokens = count_tokens(str(body))
        result = repositories[owner][repo][action](body)
        output_tokens = count_tokens(str(result))
        count_run(db=db, key_id=key_id, owner=owner, repo=repo, action=action, version=version,
                  input_tokens=input_tokens, output_tokens=output_tokens)
        return result
    except HTTPException as e:
        raise e
    except HTTPError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        traceback.print_exc()
        print(e)
        raise HTTPException(status_code=500, detail="Server error")

@app.post("/v0.1/mcp/{owner}/{repo_version}/{action}")
async def run_mcp(owner: str, repo_version: str, action: str, body: dict | None = None,
               key_id: str = Depends(check_auth), db: Optional[DBClient] = Depends(get_db)):
    repo, version = repo_version.split(":", 1) if ":" in repo_version else (repo_version, None)
    # TODO: check for credit card
    # TODO: Check if can run privates repo (is_private)
    try:
        input_tokens = count_tokens(str(body))
        result = await run_mcp_action(owner=owner, repo=repo, version=version, action=action, arguments=body)
        output_tokens = count_tokens(str(result))
        # count_run(db=db, key_id=key_id, owner=owner, repo=repo, action=action, version=version,
        #           input_tokens=input_tokens, output_tokens=output_tokens)
        return result
    except HTTPException as e:
        raise e
    except HTTPError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        traceback.print_exc()
        print(e)
        raise HTTPException(status_code=500, detail="Server error")

# Additional route
@app.get("/about")
def get_about():
    return {"message": "👾 mkinf hub"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="localhost", port=3333, reload=True)
