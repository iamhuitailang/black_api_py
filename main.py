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
from app.model.community import ItemModel, BorrowRequestModel, BorrowRecordModel, ReviewModel
from app.common.sqlite.db import get_db


def migrate_database():
    print("Running database migrations...")
    
    migrated = BannerModel.migrate_remove_aspect_ratio()
    if migrated:
        print("  - Migrated tb_mudan_banner: removed aspect_ratio column")
    
    migrated_user = UserModel.migrate_add_profile_fields()
    if migrated_user:
        print("  - Migrated tb_auth_user: added nickname, avatar_url, credit_score columns")


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
    ItemModel.create_table()
    BorrowRequestModel.create_table()
    BorrowRecordModel.create_table()
    ReviewModel.create_table()
    
    migrate_database()
    
    _seed_demo_data()
    
    print("Database initialized successfully")


def _seed_demo_data():
    import os
    from datetime import datetime, timedelta
    db = get_db()
    
    user_count = db.fetch_one(f"SELECT COUNT(*) as c FROM {UserModel.TABLE_NAME}")
    if user_count and user_count['c'] >= 2:
        return
    
    user_model = UserModel()
    item_model = ItemModel()
    borrow_request_model = BorrowRequestModel()
    borrow_record_model = BorrowRecordModel()
    review_model = ReviewModel()
    
    demo_users = [
        {'username': 'neighbor1', 'password': '123456', 'nickname': '小明'},
        {'username': 'neighbor2', 'password': '123456', 'nickname': '李阿姨'},
        {'username': 'neighbor3', 'password': '123456', 'nickname': '王叔叔'},
        {'username': 'neighbor4', 'password': '123456', 'nickname': '张姐'},
    ]
    user_ids = []
    for u in demo_users:
        uid = user_model.create(u['username'], u['password'], u['nickname'])
        user_ids.append(uid)
        print(f"  - Created demo user: {u['nickname']} (id={uid})")
    
    today = datetime.now().date()
    demo_items = [
        {
            'owner_idx': 0, 'name': '露营帐篷4人套装', 'category': 'outdoor',
            'description': '4人露营帐篷，含地垫、防潮垫，适合周末户外使用。帐篷空间充足，防风防雨。',
            'condition': 'like_new',
            'borrow_rule': '免费借用，押金200元，使用后请清洗干净归还',
            'available_times': [{'day': '周六', 'time': '全天'}, {'day': '周日', 'time': '全天'}],
            'image_url': '/static/community/images/item1.svg'
        },
        {
            'owner_idx': 0, 'name': '无线电钻套装', 'category': 'tool',
            'description': '博世无线电钻，含多种钻头、批头，适合家装DIY。电池续航充足。',
            'condition': 'usable',
            'borrow_rule': '免费借用，押金100元，请注意使用安全',
            'available_times': [{'day': '工作日', 'time': '18:00-22:00'}, {'day': '周末', 'time': '全天'}],
            'image_url': '/static/community/images/item2.svg'
        },
        {
            'owner_idx': 1, 'name': '家用投影仪', 'category': 'electronic',
            'description': '极米家用投影仪，1080P高清，支持无线投屏。适合家庭影院。',
            'condition': 'new',
            'borrow_rule': '免费借用，押金500元，需在3天内归还',
            'available_times': [{'day': '每天', 'time': '19:00-23:00'}],
            'image_url': '/static/community/images/item3.svg'
        },
        {
            'owner_idx': 1, 'name': '山地自行车', 'category': 'sport',
            'description': '26寸山地自行车，适合骑行健身用。车况良好，变速顺畅。',
            'condition': 'like_new',
            'borrow_rule': '免费借用，押金300元，请爱护使用',
            'available_times': [{'day': '周末', 'time': '06:00-20:00'}],
            'image_url': '/static/community/images/item4.svg'
        },
        {
            'owner_idx': 2, 'name': '烧烤架套装', 'category': 'outdoor',
            'description': '折叠式烧烤架，含烤网、碳夹、烤盘，5-8人使用。',
            'condition': 'usable',
            'borrow_rule': '免费借用，押金150元，用后请清洁归还',
            'available_times': [{'day': '周六', 'time': '全天'}, {'day': '周日', 'time': '全天'}],
            'image_url': '/static/community/images/item5.svg'
        },
        {
            'owner_idx': 2, 'name': '多功能料理锅', 'category': 'kitchen',
            'description': '摩飞多功能料理锅，煎烤煮一体，适合聚会做饭。',
            'condition': 'like_new',
            'borrow_rule': '免费借用，押金200元',
            'available_times': [{'day': '每天', 'time': '10:00-20:00'}],
            'image_url': '/static/community/images/item6.svg'
        },
        {
            'owner_idx': 3, 'name': '羽毛球拍套装', 'category': 'sport',
            'description': '尤尼克斯羽毛球拍2支，含羽毛球3只，适合双打用。',
            'condition': 'new',
            'borrow_rule': '免费借用，押金80元',
            'available_times': [{'day': '每天', 'time': '全天'}],
            'image_url': '/static/community/images/item7.svg'
        },
        {
            'owner_idx': 3, 'name': '电动螺丝刀', 'category': 'tool',
            'description': '小米电动螺丝刀，含多种批头，适合组装家具。',
            'condition': 'like_new',
            'borrow_rule': '免费借用，押金50元',
            'available_times': [{'day': '工作日', 'time': '09:00-21:00'}],
            'image_url': '/static/community/images/item8.svg'
        },
    ]
    
    for it in demo_items:
        owner_id = user_ids[it['owner_idx']]
        iid = item_model.create(
            owner_id=owner_id,
            name=it['name'],
            category=it['category'],
            description=it['description'],
            condition=it['condition'],
            borrow_rule=it['borrow_rule'],
            available_times=it['available_times'],
            image_url=it['image_url']
        )
        print(f"  - Created demo item: {it['name']} (id={iid})")
    
    print("  - Demo data seeded successfully")


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
        port=8000,
        reload=True
    )
