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
from app.model.farm import FarmerModel, FarmProductModel, FarmOrderModel, ConsumerModel
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
    FarmerModel.create_table()
    FarmProductModel.create_table()
    FarmOrderModel.create_table()
    ConsumerModel.create_table()

    migrate_database()
    seed_initial_data()

    print("Database initialized successfully")


def seed_initial_data():
    farmer_model = FarmerModel()
    if farmer_model.count() == 0:
        fid = farmer_model.create(
            name='张大爷',
            phone='13800138001',
            password='123456',
            address='山东省寿光市蔬菜基地A区12号',
            categories='蔬菜,西红柿,黄瓜',
            certification='organic',
            certification_desc='有机蔬菜认证编号：ORG202400123'
        )
        farmer_model.approve(fid)
        farmer_model.update_shop(fid, shop_name='张大爷的有机菜园', shop_description='30年种植经验，坚持不打农药，只为给您最放心的蔬菜')

        fid2 = farmer_model.create(
            name='李阿姨',
            phone='13800138002',
            password='123456',
            address='河北省保定市草莓种植园',
            categories='水果,草莓,苹果',
            certification='green',
            certification_desc='绿色食品认证'
        )
        farmer_model.approve(fid2)
        farmer_model.update_shop(fid2, shop_name='李阿姨的甜蜜果园', shop_description='自家果园，新鲜现摘，自然成熟不催熟')

        product_model = FarmProductModel()
        from datetime import date, timedelta
        today = date.today()
        tomorrow = today + timedelta(days=1)

        product_model.create(
            farmer_id=1,
            name='有机西红柿',
            category='蔬菜',
            price=8.5,
            unit='jin',
            stock=100,
            harvest_date=today.isoformat(),
            delivery_range='朝阳区,海淀区,西城区',
            expected_delivery=tomorrow.isoformat(),
            description='自然成熟沙瓤西红柿，生吃炒菜都好吃',
            image_url='https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20red%20organic%20tomatoes%20in%20basket%20farm%20background&image_size=square'
        )
        product_model.create(
            farmer_id=1,
            name='水果黄瓜',
            category='蔬菜',
            price=6.0,
            unit='jin',
            stock=80,
            harvest_date=today.isoformat(),
            delivery_range='朝阳区,海淀区',
            expected_delivery=tomorrow.isoformat(),
            description='脆嫩爽口水果黄瓜，洗干净直接吃',
            image_url='https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20green%20cucumbers%20farm%20harvest%20natural&image_size=square'
        )
        product_model.create(
            farmer_id=2,
            name='奶油草莓',
            category='水果',
            price=35.0,
            unit='portion',
            stock=50,
            harvest_date=today.isoformat(),
            delivery_range='朝阳区,海淀区,西城区,丰台区',
            expected_delivery=tomorrow.isoformat(),
            description='每盒约2斤，奶香浓郁自然成熟',
            image_url='https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20red%20strawberries%20cream%20variety%20wooden%20basket&image_size=square'
        )
        product_model.create(
            farmer_id=2,
            name='红富士苹果',
            category='水果',
            price=12.0,
            unit='jin',
            stock=200,
            harvest_date=today.isoformat(),
            delivery_range='朝阳区,海淀区,西城区,丰台区,东城区',
            expected_delivery=tomorrow.isoformat(),
            description='脆甜多汁，自然套袋生长无农药',
            image_url='https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=red%20fuji%20apples%20fresh%20farm%20harvest%20basket&image_size=square'
        )

    consumer_model = ConsumerModel()
    if consumer_model.count() == 0:
        consumer_model.create(
            name='王小明',
            phone='13900139001',
            password='123456',
            address='北京市朝阳区建国路88号'
        )


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
        port=8650,
        reload=True
    )
