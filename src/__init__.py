import uvicorn


def main():
    uvicorn.run("src.main:app", host="localhost", port=8000, reload=True)


# Optionally expose other important items at package level
__all__ = ["main"]