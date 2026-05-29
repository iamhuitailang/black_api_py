from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db.database import Base, engine
from .controller import user_router, movie_router, rating_router, favorite_router, stats_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="光影推荐 · 电影小站 API", description="电影推荐系统后端API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router)
app.include_router(movie_router)
app.include_router(rating_router)
app.include_router(favorite_router)
app.include_router(stats_router)


@app.get("/")
def root():
    return {"code": 200, "message": "欢迎来到光影推荐 · 电影小站 API", "data": {"version": "1.0.0"}}


@app.get("/health")
def health_check():
    return {"code": 200, "message": "服务运行正常", "data": {"status": "healthy"}}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
