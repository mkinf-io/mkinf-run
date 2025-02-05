#!/bin/bash

# Ensure dependencies are installed
poetry install

# Update package lists
apt update -y

# Install Git if missing
if ! command -v git &> /dev/null; then
    apt install -y git
fi

# Install Playwright if missing
if ! command -v playwright &> /dev/null; then
    uv pip install playwright
    playwright install
    playwright install-deps
fi

# Start the application
uvicorn main:app --host 0.0.0.0 --port 8000