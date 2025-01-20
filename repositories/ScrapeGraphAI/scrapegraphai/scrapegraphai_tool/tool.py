import os
from typing import Optional

import langchain
from langchain_core.callbacks import CallbackManagerForToolRun
from langchain_core.tools import BaseTool
from scrapegraphai.graphs import SmartScraperGraph


class ScrapeGraphAiRun(BaseTool):
    name: str = "scrapegraphai"
    description: str = (
        "Extract useful information from the webpages. "
        "Useful for when you need to scrape a website given an url and a prompt. "
        "Input should be a website url a prompt. "
        "Output is a JSON object containing the require data extracted from the website."
    )

    def _run(
            self,
            url: str,
            prompt: str,
            run_manager: Optional[CallbackManagerForToolRun] = None,
    ) -> dict:
        """Use the tool."""
        langchain.verbose = False
        langchain.debug = False
        langchain.llm_cache = False

        # Define the configuration for the scraping pipeline
        graph_config = {
            "llm": {
                "api_key": os.getenv("OPENAI_API_KEY"),
                "model": "openai/gpt-4o-mini",
            },
            "verbose": True,
            "headless": True,
        }

        # Create the SmartScraperGraph instance
        smart_scraper_graph = SmartScraperGraph(
            prompt=prompt,
            source=url,
            config=graph_config
        )

        # Run the pipeline
        return smart_scraper_graph.run()
