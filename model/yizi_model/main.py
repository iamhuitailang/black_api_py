from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import user_router, game_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="椅子大战游戏API", description="椅子大战游戏后端服务")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router)
app.include_router(game_router)


@app.get("/")
def read_root():
    return {"message": "椅子大战游戏API服务已启动", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
