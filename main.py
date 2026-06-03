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
from app.model.ims import ContactModel, VarietyModel, PurchaseModel, SaleModel, InventoryModel, OperationLogModel
from app.model.dd import UserModel as DdUserModel, TaskModel, TaskClaimModel, ReviewModel, ReportModel, DdTokenModel
from app.model.xq import (
    UserModel as XqUserModel,
    PostModel as XqPostModel,
    ClaimModel as XqClaimModel,
    ReviewModel as XqReviewModel,
    CategoryModel as XqCategoryModel,
    AdminModel as XqAdminModel,
    XqTokenModel,
    XqAdminTokenModel
)
from app.model.ty_model import (
    UserModel as TyUserModel,
    TokenModel as TyTokenModel,
    WeaponModel as TyWeaponModel,
    ResourceModel as TyResourceModel,
    UserResourceModel as TyUserResourceModel,
    SkillModel as TySkillModel,
    UserSkillModel as TyUserSkillModel,
    BattleModel as TyBattleModel,
    WorkshopModel as TyWorkshopModel,
)
from app.common.sqlite.db import get_db


def init_ty_default_data():
    print("Initializing 涂鸦战士 default data...")
    
    resource_model = TyResourceModel()
    existing_resources = resource_model.get_all(page_size=100)
    if existing_resources.get('total', 0) == 0:
        default_resources = [
            {'name': '普通颜料', 'resource_type': 'paint', 'rarity': 1, 'description': '基础的红色颜料，可用于绘制普通武器', 'value': 1, 'price': 10},
            {'name': '高级颜料', 'resource_type': 'paint', 'rarity': 2, 'description': '优质颜料，绘制出的武器属性更佳', 'value': 1, 'price': 30},
            {'name': '稀有颜料', 'resource_type': 'paint', 'rarity': 3, 'description': '稀有颜料，有几率画出史诗级武器', 'value': 1, 'price': 100},
            {'name': '传说颜料', 'resource_type': 'paint', 'rarity': 4, 'description': '传说级颜料，蕴含神秘力量', 'value': 1, 'price': 500},
            {'name': '普通画布', 'resource_type': 'canvas', 'rarity': 1, 'description': '基础画布，武器的载体', 'value': 1, 'price': 20},
            {'name': '高级画布', 'resource_type': 'canvas', 'rarity': 2, 'description': '优质画布，提高武器耐久度', 'value': 1, 'price': 60},
            {'name': '稀有画布', 'resource_type': 'canvas', 'rarity': 3, 'description': '稀有画布，有特殊加成效果', 'value': 1, 'price': 200},
            {'name': '传说画布', 'resource_type': 'canvas', 'rarity': 4, 'description': '传说画布，蕴含古老魔力', 'value': 1, 'price': 1000},
            {'name': '初级技能书', 'resource_type': 'skill_book', 'rarity': 1, 'description': '随机解锁一个初级技能', 'value': 1, 'price': 200},
            {'name': '中级技能书', 'resource_type': 'skill_book', 'rarity': 2, 'description': '随机解锁一个中级技能', 'value': 1, 'price': 500},
        ]
        for res in default_resources:
            resource_model.create(**res)
        print(f"  - Initialized {len(default_resources)} default resources")
    
    skill_model = TySkillModel()
    existing_skills = skill_model.get_all(page_size=100)
    if existing_skills.get('total', 0) == 0:
        import json
        default_skills = [
            {
                'name': '力量强化', 'category': 'passive', 'description': '永久增加攻击力',
                'max_level': 10, 'unlock_level': 1, 'gold_cost': 100, 'exp_cost': 50,
                'base_effect': json.dumps({'attack': 5}),
                'effect_per_level': json.dumps({'attack': 3})
            },
            {
                'name': '铁壁防御', 'category': 'passive', 'description': '永久增加防御力',
                'max_level': 10, 'unlock_level': 1, 'gold_cost': 100, 'exp_cost': 50,
                'base_effect': json.dumps({'defense': 5}),
                'effect_per_level': json.dumps({'defense': 3})
            },
            {
                'name': '疾风步', 'category': 'passive', 'description': '永久增加速度',
                'max_level': 10, 'unlock_level': 2, 'gold_cost': 150, 'exp_cost': 80,
                'base_effect': json.dumps({'speed': 3}),
                'effect_per_level': json.dumps({'speed': 2})
            },
            {
                'name': '烈焰斩', 'category': 'attack', 'description': '释放火焰攻击，造成额外伤害',
                'max_level': 10, 'unlock_level': 3, 'gold_cost': 200, 'exp_cost': 100,
                'base_effect': json.dumps({'damage': 20, 'burn': 5}),
                'effect_per_level': json.dumps({'damage': 10, 'burn': 3})
            },
            {
                'name': '冰霜护盾', 'category': 'defense', 'description': '召唤冰霜护盾，减少受到的伤害',
                'max_level': 10, 'unlock_level': 3, 'gold_cost': 200, 'exp_cost': 100,
                'base_effect': json.dumps({'damage_reduction': 10, 'freeze_chance': 10}),
                'effect_per_level': json.dumps({'damage_reduction': 5, 'freeze_chance': 3})
            },
            {
                'name': '雷电一击', 'category': 'attack', 'description': '召唤雷电攻击敌人，有几率麻痹',
                'max_level': 10, 'unlock_level': 5, 'gold_cost': 300, 'exp_cost': 150,
                'base_effect': json.dumps({'damage': 30, 'paralyze_chance': 15}),
                'effect_per_level': json.dumps({'damage': 15, 'paralyze_chance': 5})
            },
            {
                'name': '生命汲取', 'category': 'support', 'description': '攻击时吸取敌人生命',
                'max_level': 10, 'unlock_level': 5, 'gold_cost': 300, 'exp_cost': 150,
                'base_effect': json.dumps({'lifesteal': 10}),
                'effect_per_level': json.dumps({'lifesteal': 3})
            },
            {
                'name': '暴击精通', 'category': 'passive', 'description': '增加暴击几率和暴击伤害',
                'max_level': 10, 'unlock_level': 7, 'gold_cost': 500, 'exp_cost': 250,
                'base_effect': json.dumps({'crit_chance': 5, 'crit_damage': 20}),
                'effect_per_level': json.dumps({'crit_chance': 2, 'crit_damage': 10})
            },
            {
                'name': '神圣祝福', 'category': 'support', 'description': '战斗开始时恢复生命值',
                'max_level': 10, 'unlock_level': 7, 'gold_cost': 500, 'exp_cost': 250,
                'base_effect': json.dumps({'heal': 30}),
                'effect_per_level': json.dumps({'heal': 15})
            },
            {
                'name': '暗影突袭', 'category': 'attack', 'description': '暗影之力，造成真实伤害',
                'max_level': 10, 'unlock_level': 10, 'gold_cost': 800, 'exp_cost': 400,
                'base_effect': json.dumps({'true_damage': 25}),
                'effect_per_level': json.dumps({'true_damage': 12})
            },
        ]
        for skill in default_skills:
            skill_model.create(**skill)
        print(f"  - Initialized {len(default_skills)} default skills")


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
    
    ContactModel.create_table()
    VarietyModel.create_table()
    PurchaseModel.create_table()
    SaleModel.create_table()
    InventoryModel.create_table()
    OperationLogModel.create_table()
    
    DdUserModel.create_table()
    DdTokenModel.create_table()
    TaskModel.create_table()
    TaskClaimModel.create_table()
    ReviewModel.create_table()
    ReportModel.create_table()

    XqUserModel.create_table()
    XqTokenModel.create_table()
    XqPostModel.create_table()
    XqClaimModel.create_table()
    XqReviewModel.create_table()
    XqCategoryModel.create_table()
    XqAdminModel.create_table()
    XqAdminTokenModel.create_table()

    XqAdminModel.init_default_admin()
    XqCategoryModel.init_default_categories()

    TyUserModel.create_table()
    TyTokenModel.create_table()
    TyWeaponModel.create_table()
    TyResourceModel.create_table()
    TyUserResourceModel.create_table()
    TySkillModel.create_table()
    TyUserSkillModel.create_table()
    TyBattleModel.create_table()
    TyWorkshopModel.create_table()

    init_ty_default_data()

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
        port=8244,
        reload=True
    )
