from typing import Optional

import langchain
from langchain_core.callbacks import CallbackManagerForToolRun
from langchain_core.tools import BaseTool
from pydantic import Field

from anonymize_pii.wrapper import AnonymizePIIAPIWrapper


class AnonymizePIIRun(BaseTool):  # type: ignore[override]
    name: str = "anonymize_pii"
    description: str = (
        "A wrapper around glaider anonymization API. "
        "Useful for when you need to anonymize personally identifiable information (PII) in text data before processing it with AI models or storing it. "
        "The service automatically detects and anonymizes sensitive information such as personal names, locations, organizations, email addresses, IP addresses, access tokens, API keys, credit card numbers, and more. "
        "Input should be a prompt. Output is a JSON object containing the anonymized prompt (anonymized_text) and the key value anonymized entities (entities)."
    )
    api_wrapper: AnonymizePIIAPIWrapper = Field(default_factory=AnonymizePIIAPIWrapper)

    def _run(
        self,
        prompt: str,
        run_manager: Optional[CallbackManagerForToolRun] = None,
    ) -> dict:
        """Use the tool."""
        langchain.verbose = False
        langchain.debug = False
        langchain.llm_cache = False
        return self.api_wrapper.run(prompt)