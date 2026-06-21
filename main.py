from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.common import get_router_registry
from app.model.helloworld import HelloWorldModel
from app.model.mudan import BannerModel, BannerConfigModel, TabModel, TabDetailModel, CommercialModel, ProductModel
from app.model.auth import UserModel, TokenModel
from app.model.rainforest import GameStateModel, LayerModel, PopulationModel
from app.common.sqlite.db import get_db


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
    
    GameStateModel.create_table()
    LayerModel.create_table()
    PopulationModel.create_table()
    
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


@app.get("/")
async def root():
    return {
        "code": 0,
        "message": "success",
        "data": {
            "name": "FastAPI SQLite Backend",
            "version": "1.0.0",
            "docs": "/docs",
            "redoc": "/redoc",
            "services": {
                "mudan": {
                    "name": "牡丹CMS",
                    "home": "/api/mudan/home/get"
                },
                "helloworld": {
                    "name": "示例模块",
                    "get": "/api/helloworld/get"
                },
                "rainforest": {
                    "name": "热带雨林腐殖层生存策略游戏",
                    "endpoints": {
                        "创建游戏": {
                            "method": "POST",
                            "url": "/api/rainforest/game/create",
                            "body": {"initial_fungi": 5, "initial_bacteria": 8, "initial_nematode": 2}
                        },
                        "获取游戏状态": {
                            "method": "GET",
                            "url": "/api/rainforest/game/get?game_id=1"
                        },
                        "游戏概要": {
                            "method": "GET",
                            "url": "/api/rainforest/game/summary/get?game_id=1"
                        },
                        "推进回合": {
                            "method": "POST",
                            "url": "/api/rainforest/game/turn/advance?game_id=1"
                        },
                        "手动形态转换": {
                            "method": "POST",
                            "url": "/api/rainforest/morph/transform",
                            "body": {"game_id": 1, "population_id": 1, "target_morph": 0}
                        },
                        "跨层迁移": {
                            "method": "POST",
                            "url": "/api/rainforest/migrate",
                            "body": {"game_id": 1, "population_id": 1, "target_layer_type": 1, "count": 3}
                        },
                        "添加种群": {
                            "method": "POST",
                            "url": "/api/rainforest/population/add",
                            "body": {"game_id": 1, "layer_type": 0, "morph_type": 0, "count": 5}
                        },
                        "线虫吞噬": {
                            "method": "POST",
                            "url": "/api/rainforest/nematode/devour",
                            "body": {"game_id": 1, "nematode_pop_id": 1, "target_pop_id": 2}
                        },
                        "获取配置": {
                            "method": "GET",
                            "url": "/api/rainforest/layer/config/get"
                        },
                        "删除游戏": {
                            "method": "DELETE",
                            "url": "/api/rainforest/game/delete?game_id=1"
                        }
                    }
                }
            }
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=6009,
        reload=True
    )
