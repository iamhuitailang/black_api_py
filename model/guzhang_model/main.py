from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from utils.database import engine, Base
from controller.user_controller import router as user_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="喝彩争夺游戏API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router)


@app.get("/")
def root():
    return {"message": "喝彩争夺游戏API服务运行中"}


@app.get("/health")
def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
