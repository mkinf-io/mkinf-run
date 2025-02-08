from anonymize_pii import AnonymizePIIRun
from bing_search import BingSearchRun
from ddg_search import DuckDuckGoSearchRun
from gitingest_tool import GitIngestRun
from scrapegraphai_tool import ScrapeGraphAiRun

repositories = {
    "langchain": {
        "ddg_search": {
            "run": DuckDuckGoSearchRun().run
        },
        "bing_search": {
            "run": BingSearchRun().run
        },
    },
    "glaider": {
        "anonymize_pii": {
            "run": AnonymizePIIRun().run
        }
    },
    "cyclotruc": {
        "gitingest": {
            "run": GitIngestRun().run
        }
    },
    "ScrapeGraphAI":{
        "scrapegraphai": {
            "run": ScrapeGraphAiRun().run
        }
    }
}