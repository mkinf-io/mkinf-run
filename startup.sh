#!/bin/bash
poetry install
playwright install
uvicorn main:app --host 0.0.0.0 --port 8000