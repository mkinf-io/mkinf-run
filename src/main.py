import traceback
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.params import Depends
from requests import HTTPError

from src.core.run_session import RunSession
from src.services.auth import check_auth
from src.services.db import DBClient, create_db_client, get_db

load_dotenv()

app = FastAPI()
create_db_client()


@app.get("/")
def get_root():
    return {"message": "👾 Hello from mkinf hub runner!"}


@app.post("/v1/sessions/{session_id}/{action}")
async def run_session_action(
    owner: str,
    session_id: str,
    action: str,
    body: dict,
    key_id: str = Depends(check_auth),  # type: ignore
    db: Optional[DBClient] = Depends(get_db),  # type: ignore
):
    if not db:
        return HTTPException(status_code=500, detail="Server error")
    # TODO: check for credit card
    try:
        session = RunSession.from_session(
            db=db,
            session_id=session_id,
        )
        result = await session.run(
            action=action,
            args=body.get("args", None),
            timeout=body.get("timeout", 60),
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


@app.delete("/v1/sessions/{session_id}")
async def delete_session(
    owner: str,
    session_id: str,
    key_id: str = Depends(check_auth),  # type: ignore
    db: Optional[DBClient] = Depends(get_db),  # type: ignore
):
    if not db:
        return HTTPException(status_code=500, detail="Server error")
    # TODO: check for credit card
    try:
        session = RunSession.from_session(
            db=db,
            session_id=session_id,
        )
        result = await session.close()
        return result["response"] if result else None
    except HTTPException as e:
        raise e
    except HTTPError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        traceback.print_exc()
        print(e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/v1/{owner}/{repo_version}")
async def start_session(
    owner: str,
    repo_version: str,
    body: dict,
    key_id: str = Depends(check_auth),  # type: ignore
    db: Optional[DBClient] = Depends(get_db),  # type: ignore
):
    if not db:
        return HTTPException(status_code=500, detail="Server error")
    repo, version = (
        repo_version.split(":", 1) if ":" in repo_version else (repo_version, None)
    )
    # TODO: check for credit card
    try:
        session = RunSession.from_version(
            db=db,
            key_id=key_id,
            owner=owner,
            repo=repo,
            version=version,
            envs=body.get("env", None),
        )
        session_id = await session.start(timeout=body.get("timeout", 60))
        return session_id
    except HTTPError as e:
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/v1/{owner}/{repo_version}/{action}")
async def run_action_once(
    owner: str,
    repo_version: str,
    action: str,
    body: dict,
    key_id: str = Depends(check_auth),  # type: ignore
    db: Optional[DBClient] = Depends(get_db),  # type: ignore
):
    if not db:
        return HTTPException(status_code=500, detail="Server error")
    repo, version = (
        repo_version.split(":", 1) if ":" in repo_version else (repo_version, None)
    )
    # TODO: check for credit card
    try:
        session = RunSession.from_version(
            db=db,
            key_id=key_id,
            owner=owner,
            repo=repo,
            version=version,
            envs=body.get("env", None),
        )
        result = await session.run_once(
            action=action,
            args=body.get("args", None),
            timeout=body.get("timeout", 60),
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
