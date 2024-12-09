# DuckDuckGo Search Tool - README

## Overview

This project provides a server-side implementation of a DuckDuckGo Search tool using the LangGraph framework. It enables seamless integration with DuckDuckGo's search capabilities for dynamic query processing and intelligent response generation.

---

## Features

- **DuckDuckGo Search API**: Access search results directly using the `langchain/ddg_search` tool.
- **Server-Side Execution**: No client-side installation or setup required.
- **AI-Enhanced Processing**: For intelligent and context-aware responses.

---

## Quick Start

1. **Tool Setup**:
   The tool is automatically configured via `MkinfHub.pull`, so no manual setup is required.

   ```python
   tools = MkinfHub.pull(["langchain/ddg_search"])
   ```

2. **Core Workflow**:
   The workflow is managed server-side and automatically decides whether to use the DuckDuckGo Search tool or conclude the process.

3. **Run the Tool**:
   The graph is compiled into a runnable object, and execution is handled server-side. No additional configuration or code changes are needed on your end.

---

## Key Highlights

- **Privacy-Focused Search**: DuckDuckGo provides search results with enhanced privacy and no tracking.
- **Plug-and-Play**: Simply invoke the server-side graph to leverage DuckDuckGo search capabilities.
- **Effortless Deployment**: No need to set environment variables or install dependencies.
- **Customizable**: Adaptable for various workflows if needed.

---

For support or customization, feel free to reach out or contribute to the repository.