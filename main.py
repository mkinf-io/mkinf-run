from pydantic import BaseModel

from ddg_search import DuckDuckGoSearchRun

from fastapi import FastAPI, Query, HTTPException
import uvicorn

app = FastAPI()


@app.get("/")
def read_root():
    return {"message": "👾 Hello from mkinf hub!"}


class Body(BaseModel):
    query: str

@app.get("/v0.2/repositories/")
def get_repos(ids: list[str] = Query(...)):
    results = []
    for id in ids:
        ownerRepo = id.split("/")
        if len(ownerRepo) == 2:
            owner = ownerRepo[0]
            repo = ownerRepo[1]
            if owner == "langchain" and repo == "ddg_search":
                results.append({
                    "id": id,
                    "owner": owner,
                    "repository": repo,
                    "name": DuckDuckGoSearchRun().name,
                    "description": DuckDuckGoSearchRun().description
                })
            else:
                raise HTTPException(status_code=404, detail=f"Repository not found: {id}")
        else:
            raise HTTPException(status_code=404, detail=f"Invalid id: {id}")
    return results

@app.get("/v0.2/{owner}/{repo}/")
def get_repo(owner: str, repo: str):
    if owner == "langchain" and repo == "ddg_search":
        return {
            "owner": owner,
            "repository": repo,
            "name": DuckDuckGoSearchRun.name,
            "description": DuckDuckGoSearchRun.description
        }
    raise HTTPException(status_code=404, detail="Repository not found")

@app.post("/v0.2/{owner}/{repo}/")
def run_default_action(owner: str, repo: str, body: Body = None):
    if owner == "langchain" and repo == "ddg_search":
        return DuckDuckGoSearchRun().run(body.query)
    raise HTTPException(status_code=404, detail="Repository not found")


@app.post("/v0.2/{owner}/{repo}/{action}")
def run_action(owner: str, repo: str, action: str, body: Body = None):
    if owner == "langchain" and repo == "ddg_search" and action == "run":
        return DuckDuckGoSearchRun().run(body.query)
    raise HTTPException(status_code=404, detail="Repository not found")


# Additional route
@app.get("/about")
def about():
    return {"message": "mkinf hub"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="localhost", port=3000, reload=True)
