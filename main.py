import traceback
from typing import Any

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.params import Depends
from gotrue import UserResponse
from requests import HTTPError

from anonymize_pii import AnonymizePIIRun
from bing_search import BingSearchRun
from ddg_search import DuckDuckGoSearchRun
from gitingest_tool import GitIngestRun
from utils.auth import check_auth
from utils.db_client import create_db_client

app = FastAPI()
create_db_client()


@app.get("/")
def get_root():
    return {"message": "👾 Hello from mkinf hub!"}


@app.post("/v0.1/{owner}/{repo}")
def run_default_action(owner: str, repo: str, body: str | dict[str, Any], user: UserResponse = Depends(check_auth)):
    # TODO: count runs per agent
    try:
        if owner == "langchain" and repo == "ddg_search":
            return DuckDuckGoSearchRun().run(body)
        elif owner == "langchain" and repo == "bing_search":
            return BingSearchRun().run(body)
        elif owner == "glaider" and repo == "anonymize_pii":
            return AnonymizePIIRun().run(body)
        elif owner == "cyclotruc" and repo == "gitingest":
            return GitIngestRun().run(body)
        raise HTTPException(status_code=404, detail="Repository not found")
    except HTTPError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        traceback.print_exc()
        print(e)
        raise HTTPException(status_code=500, detail="Server error")


@app.post("/v0.1/{owner}/{repo}/{action}")
def run_action(owner: str, repo: str, action: str, body: str | dict[str, Any],
               user: UserResponse = Depends(check_auth)):
    # TODO: count runs per agent
    try:
        if owner == "langchain" and repo == "ddg_search" and action == "run":
            return DuckDuckGoSearchRun().run(body)
        elif owner == "langchain" and repo == "bing_search" and action == "run":
            return BingSearchRun().run(body)
        elif owner == "glaider" and repo == "anonymize_pii" and action == "run":
            return AnonymizePIIRun().run(body)
        elif owner == "cyclotruc" and repo == "gitingest" and action == "run":
            return GitIngestRun().run(body)
        raise HTTPException(status_code=404, detail="Repository not found")
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
    uvicorn.run("main:app", host="localhost", port=3000, reload=True)
