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
from app.model.game import LevelModel, UpgradeModel, ProgressModel
from app.common.sqlite.db import get_db


def migrate_database():
    print("Running database migrations...")
    
    migrated = BannerModel.migrate_remove_aspect_ratio()
    if migrated:
        print("  - Migrated tb_mudan_banner: removed aspect_ratio column")


def seed_game_data():
    import json
    
    level_model = LevelModel()
    if level_model.count() == 0:
        map_config_1 = json.dumps({
            "width": 20,
            "height": 15,
            "grid": [[0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],[0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],[0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],[0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],[0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],[0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],[0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0]],
            "deploy_nodes": [{"x":1,"y":1},{"x":4,"y":2},{"x":8,"y":2},{"x":16,"y":1},{"x":4,"y":4},{"x":10,"y":4},{"x":1,"y":6},{"x":4,"y":7},{"x":8,"y":6},{"x":8,"y":10},{"x":15,"y":9},{"x":2,"y":12}],
            "entry_points": [{"x":2,"y":0},{"x":17,"y":0}],
            "exit_point": {"x":11,"y":14},
            "waves": [
                {"wave_index":0,"enemies":[{"type":"normal","count":5,"entry_index":0,"spawn_interval":1000,"spawn_delay":0},{"type":"normal","count":5,"entry_index":1,"spawn_interval":1000,"spawn_delay":0}]},
                {"wave_index":1,"enemies":[{"type":"normal","count":8,"entry_index":0,"spawn_interval":800,"spawn_delay":0},{"type":"acid","count":3,"entry_index":1,"spawn_interval":1200,"spawn_delay":0}]},
                {"wave_index":2,"enemies":[{"type":"normal","count":10,"entry_index":0,"spawn_interval":600,"spawn_delay":0},{"type":"shell","count":4,"entry_index":1,"spawn_interval":1000,"spawn_delay":0},{"type":"acid","count":3,"entry_index":0,"spawn_interval":1200,"spawn_delay":3000}]},
                {"wave_index":3,"enemies":[{"type":"acid","count":5,"entry_index":0,"spawn_interval":800,"spawn_delay":0},{"type":"shell","count":6,"entry_index":1,"spawn_interval":800,"spawn_delay":0},{"type":"mother","count":1,"entry_index":0,"spawn_interval":0,"spawn_delay":5000}]},
                {"wave_index":4,"enemies":[{"type":"normal","count":15,"entry_index":0,"spawn_interval":400,"spawn_delay":0},{"type":"acid","count":5,"entry_index":1,"spawn_interval":600,"spawn_delay":0},{"type":"shell","count":5,"entry_index":0,"spawn_interval":800,"spawn_delay":2000},{"type":"mother","count":2,"entry_index":1,"spawn_interval":3000,"spawn_delay":3000}]}
            ]
        })
        level_model.create(name='研发区走廊', difficulty=1, wave_count=5, map_config=map_config_1)
        level_model.create(name='实验区通道', difficulty=2, wave_count=7, map_config='')
        level_model.create(name='核心反应堆', difficulty=3, wave_count=10, map_config='')

    UpgradeModel.seed_data()
    ProgressModel.seed_data()


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
    LevelModel.create_table()
    UpgradeModel.create_table()
    ProgressModel.create_table()
    
    seed_game_data()
    
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8680,
        reload=True
    )
