#!/bin/bash
apt update
apt install -y git
curl -LsSf https://astral.sh/uv/install.sh | sh
uv sync
playwright install
playwright install-deps
uvicorn main:app --host 0.0.0.0 --port 8000