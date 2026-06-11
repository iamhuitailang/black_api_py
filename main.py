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
from app.model.restaurant import DishModel, OrderModel, OrderItemModel
from app.common.sqlite.db import get_db


def migrate_database():
    print("Running database migrations...")
    
    migrated = BannerModel.migrate_remove_aspect_ratio()
    if migrated:
        print("  - Migrated tb_mudan_banner: removed aspect_ratio column")


def seed_database():
    dish_model = DishModel()
    count = dish_model.count()
    
    if count == 0:
        print("Seeding database with sample dishes...")
        
        sample_dishes = [
            {'name': '凉拌黄瓜', 'category': 'cold', 'price': 12.0, 'description': '清爽开胃，夏日必备', 'spicy_level': 1, 'image_url': ''},
            {'name': '口水鸡', 'category': 'cold', 'price': 38.0, 'description': '麻辣鲜香，皮嫩肉滑', 'spicy_level': 3, 'image_url': ''},
            {'name': '麻酱拉皮', 'category': 'cold', 'price': 16.0, 'description': '口感爽滑，酱香浓郁', 'spicy_level': 0, 'image_url': ''},
            {'name': '夫妻肺片', 'category': 'cold', 'price': 42.0, 'description': '经典川菜，麻辣过瘾', 'spicy_level': 3, 'image_url': ''},
            {'name': '宫保鸡丁', 'category': 'hot', 'price': 32.0, 'description': '花生香脆，鸡肉嫩滑', 'spicy_level': 2, 'image_url': ''},
            {'name': '鱼香肉丝', 'category': 'hot', 'price': 28.0, 'description': '酸甜微辣，下饭神器', 'spicy_level': 2, 'image_url': ''},
            {'name': '水煮牛肉', 'category': 'hot', 'price': 58.0, 'description': '麻辣鲜香，肉质嫩滑', 'spicy_level': 3, 'image_url': ''},
            {'name': '红烧肉', 'category': 'hot', 'price': 48.0, 'description': '肥而不腻，入口即化', 'spicy_level': 0, 'image_url': ''},
            {'name': '麻婆豆腐', 'category': 'hot', 'price': 22.0, 'description': '麻辣鲜香，嫩滑可口', 'spicy_level': 2, 'image_url': ''},
            {'name': '糖醋里脊', 'category': 'hot', 'price': 36.0, 'description': '酸甜可口，外酥里嫩', 'spicy_level': 0, 'image_url': ''},
            {'name': '米饭', 'category': 'staple', 'price': 2.0, 'description': '香糯可口，粒粒分明', 'spicy_level': 0, 'image_url': ''},
            {'name': '牛肉面', 'category': 'staple', 'price': 26.0, 'description': '汤浓味美，牛肉软烂', 'spicy_level': 1, 'image_url': ''},
            {'name': '蛋炒饭', 'category': 'staple', 'price': 15.0, 'description': '粒粒分明，蛋香四溢', 'spicy_level': 0, 'image_url': ''},
            {'name': '葱油拌面', 'category': 'staple', 'price': 12.0, 'description': '葱香浓郁，简单美味', 'spicy_level': 0, 'image_url': ''},
            {'name': '可乐', 'category': 'drink', 'price': 6.0, 'description': '冰爽可口', 'spicy_level': 0, 'image_url': ''},
            {'name': '酸梅汤', 'category': 'drink', 'price': 8.0, 'description': '酸甜解腻，开胃消食', 'spicy_level': 0, 'image_url': ''},
            {'name': '青岛啤酒', 'category': 'drink', 'price': 10.0, 'description': '清爽麦香', 'spicy_level': 0, 'image_url': ''},
            {'name': '鲜榨橙汁', 'category': 'drink', 'price': 18.0, 'description': '新鲜现榨，维C满满', 'spicy_level': 0, 'image_url': ''},
        ]
        
        for dish in sample_dishes:
            dish_model.create(
                dish['name'],
                dish['category'],
                dish['price'],
                dish['description'],
                dish['spicy_level'],
                dish['image_url'],
                1
            )
        
        print(f"  - Added {len(sample_dishes)} sample dishes")


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
    DishModel.create_table()
    OrderModel.create_table()
    OrderItemModel.create_table()
    
    migrate_database()
    seed_database()
    
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
        port=8780,
        reload=True
    )
