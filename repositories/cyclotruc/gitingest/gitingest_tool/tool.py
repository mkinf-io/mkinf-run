from typing import Optional

import langchain
from langchain_core.callbacks import CallbackManagerForToolRun
from langchain_core.tools import BaseTool
from gitingest import ingest


class GitIngestRun(BaseTool):  # type: ignore[override]
    name: str = "gitingest"
    description: str = (
        "Turns any Git repository into a prompt-friendly text ingest for LLMs. "
        "Useful for when you need to access git repositories summary, directory structure and files content. "
        "Input should be a git repository path url. "
        "Output is a JSON object containing: the repository summary (summary): repository name, files analyzed, estimated tokens; the directory structure (tree); the files content (content)."
    )

    def _run(
            self,
            path: str,
            run_manager: Optional[CallbackManagerForToolRun] = None,
    ) -> dict:
        """Use the tool."""
        langchain.verbose = False
        langchain.debug = False
        langchain.llm_cache = False
        summary, tree, content = ingest(path)
        return {
            "summary": summary,
            "tree": tree,
            "content": content
        }
