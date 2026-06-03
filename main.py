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
from app.model.gq_model import (
    GqUserModel,
    GqTokenModel,
    GqTrackModel,
    GqMagicModel,
    GqInstrumentModel,
    GqScoreModel,
    GqCompetitionModel,
    GqCompetitionEntryModel,
    GqUserMagicModel,
    GqUserInstrumentModel,
    GqUserProgressModel
)
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

    GqUserModel.create_table()
    GqTokenModel.create_table()
    GqTrackModel.create_table()
    GqMagicModel.create_table()
    GqInstrumentModel.create_table()
    GqScoreModel.create_table()
    GqCompetitionModel.create_table()
    GqCompetitionEntryModel.create_table()
    GqUserMagicModel.create_table()
    GqUserInstrumentModel.create_table()
    GqUserProgressModel.create_table()

    GqUserModel.init_default_user()
    GqTrackModel.init_default_tracks()
    GqMagicModel.init_default_magics()
    GqInstrumentModel.init_default_instruments()
    GqCompetitionModel.init_default_competitions()

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
        port=8491,
        reload=True
    )
