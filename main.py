from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, Request, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from pydantic import BaseModel, Field
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.common import get_router_registry
from app.model.helloworld import HelloWorldModel
from app.model.mudan import BannerModel, BannerConfigModel, TabModel, TabDetailModel, CommercialModel, ProductModel
from app.model.auth import UserModel, TokenModel
from app.model.cyber_ninja import ScoreModel
from app.business.cyber_ninja import CyberNinjaBusiness
from app.common.sqlite.db import get_db
from fastapi.responses import FileResponse


class SubmitScoreRequest(BaseModel):
    player_name: str = Field(default="匿名忍者", max_length=20, description="玩家名称")
    score: int = Field(ge=0, description="游戏得分")
    level: int = Field(ge=1, default=1, description="到达的关卡")


cyber_ninja_business = CyberNinjaBusiness()


def migrate_database():
    print("Running database migrations...")
    
    migrated = BannerModel.migrate_remove_aspect_ratio()
    if migrated:
        print("  - Migrated tb_mudan_banner: removed aspect_ratio column")


def init_database():
    db = get_db()
    HelloWorldModel.create_table()
    UserModel.create_table()
    TokenModel.create_table()
    BannerModel.create_table()
    BannerConfigModel.create_table()
    TabModel.create_table()
    TabDetailModel.create_table()
    CommercialModel.create_table()
    ProductModel.create_table()
    ScoreModel.create_table()
    
    migrate_database()
    
    print("Database initialized successfully")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_database()
    yield
    db = get_db()
    db.close()


app = FastAPI(
    title="FastAPI SQLite Backend",
    description="A modular FastAPI backend service with SQLite",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "code": 500,
            "message": str(exc),
            "data": None
        }
    )


router_registry = get_router_registry()
api_router = router_registry.register_all(prefix="/api")
app.include_router(api_router)


@app.post("/api/cyber_ninja/submit_score", tags=["cyber_ninja"])
async def api_cyber_ninja_submit_score(body: SubmitScoreRequest):
    """
    提交游戏成绩
    POST /api/cyber_ninja/submit_score
    """
    return cyber_ninja_business.submit_score(body.player_name, body.score, body.level)


@app.get("/api/cyber_ninja/leaderboard", tags=["cyber_ninja"])
async def api_cyber_ninja_get_leaderboard(limit: int = Query(10, ge=1, le=100)):
    """
    获取排行榜
    GET /api/cyber_ninja/leaderboard
    """
    return cyber_ninja_business.get_leaderboard(limit)


@app.get("/api/cyber_ninja/player_best", tags=["cyber_ninja"])
async def api_cyber_ninja_get_player_best(player_name: str = Query(..., max_length=20)):
    """
    获取玩家最佳成绩
    GET /api/cyber_ninja/player_best
    """
    return cyber_ninja_business.get_player_best(player_name)


@app.get("/api/cyber_ninja/scores", tags=["cyber_ninja"])
async def api_cyber_ninja_get_all_scores(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100)
):
    """
    获取所有成绩（分页）
    GET /api/cyber_ninja/scores
    """
    return cyber_ninja_business.get_all_scores(page, page_size)


@app.get("/")
async def root():
    return {
        "code": 0,
        "message": "success",
        "data": {
            "name": "FastAPI SQLite Backend",
            "version": "1.0.0",
            "docs": "/docs",
            "redoc": "/redoc"
        }
    }


@app.get("/health")
async def health_check():
    return {
        "code": 0,
        "message": "ok",
        "data": {
            "status": "healthy"
        }
    }


@app.get("/cyber_ninja")
async def cyber_ninja_game():
    game_html_path = os.path.join(os.path.dirname(__file__), "static", "cyber_ninja", "index.html")
    if os.path.exists(game_html_path):
        return FileResponse(game_html_path)
    return {
        "code": 404,
        "message": "Game not found",
        "data": None
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
