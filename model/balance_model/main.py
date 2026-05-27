from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.init_db import init_database
from controllers import router

app = FastAPI(title="Balance Game API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.on_event("startup")
def startup_event():
    init_database()
    print("Database initialized!")


@app.get("/")
def root():
    return {"message": "Balance Game API is running!", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
