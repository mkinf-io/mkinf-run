from typing import Any, Dict, List

import requests
from langchain_core.utils import get_from_dict_or_env
from pydantic import BaseModel, ConfigDict, Field, model_validator

DEFAULT_GLAIDER_ANONYMIZE_PII_ENDPOINT = "https://api.glaider.it/v1/anonymize-pii"


class AnonymizePIIAPIWrapper(BaseModel):
    glaider_key: str
    glaider_anonymize_pii_url: str
    search_kwargs: dict = Field(default_factory=dict)
    """Additional keyword arguments to pass to the search request."""

    model_config = ConfigDict(
        extra="forbid",
    )

    def _glaider_anonymize_pii_result(self, prompt: str) -> dict:
        headers = {
            "Authorization": self.glaider_key,
            "Content-Type": "application/json"
        }
        body = {
            "prompt": prompt,
            **self.search_kwargs,
        }
        response = requests.post(
            self.glaider_anonymize_pii_url,
            headers=headers,
            json=body
        )
        response.raise_for_status()
        result = response.json()
        return result

    @model_validator(mode="before")
    @classmethod
    def validate_environment(cls, values: Dict) -> Any:
        """Validate that api key and endpoint exists in environment."""
        glaider_key = get_from_dict_or_env(
            values, "glaider_key", "GLAIDER_KEY"
        )
        values["glaider_key"] = glaider_key

        glaider_anonymize_pii_url = get_from_dict_or_env(
            values,
            "glaider_anonymize_pii_url",
            "GLAIDER_ANONYMIZE_PII_ENDPOINT",
            default=DEFAULT_GLAIDER_ANONYMIZE_PII_ENDPOINT,
        )

        values["glaider_anonymize_pii_url"] = glaider_anonymize_pii_url

        return values

    def run(self, prompt: str) -> dict:
        """Run query through BingSearch and parse result."""
        return self._glaider_anonymize_pii_result(prompt)
