from pydantic import BaseModel

from ddg_search import DuckDuckGoSearchRun
from bing_search import BingSearchRun

from fastapi import FastAPI, Query, HTTPException
import uvicorn
from requests import HTTPError

app = FastAPI()


@app.get("/")
def read_root():
    return {"message": "👾 Hello from mkinf hub!"}


class Body(BaseModel):
    query: str


@app.post("/v0.1/{owner}/{repo}")
def run_default_action(owner: str, repo: str, body: Body = None):
    try:
        if owner == "langchain" and repo == "ddg_search":
            return DuckDuckGoSearchRun().run(body.query)
        elif owner == "langchain" and repo == "bing_search":
            return BingSearchRun().run(body.query)
        raise HTTPException(status_code=404, detail="Repository not found")
    except HTTPError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception:
        raise HTTPException(status_code=500, detail="Server error")


@app.post("/v0.1/{owner}/{repo}/{action}")
def run_action(owner: str, repo: str, action: str, body: Body = None):
    try:
        if owner == "langchain" and repo == "ddg_search" and action == "run":
            return DuckDuckGoSearchRun().run(body.query)
        elif owner == "langchain" and repo == "bing_search" and action == "run":
            return BingSearchRun().run(body.query)
        raise HTTPException(status_code=404, detail="Repository not found")
    except HTTPError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception:
        raise HTTPException(status_code=500, detail="Server error")


# Additional route
@app.get("/about")
def about():
    return {"message": "👾 mkinf hub"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="localhost", port=3000, reload=True)
