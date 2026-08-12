from fastapi import FastAPI

app = FastAPI(title="Intelligent Document Editor API")

@app.get("/")
def read_root():
    return {"status": "Backend is running!"}