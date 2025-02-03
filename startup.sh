#!/bin/bash
sudo apt update
sudo apt install -y git
poetry install
playwright install
playwright install-deps
uvicorn main:app --host 0.0.0.0 --port 8000