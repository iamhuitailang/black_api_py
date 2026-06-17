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
from app.model.kpi import EmployeeModel, AssessmentCycleModel, AssessmentDimensionModel, AssessmentRecordModel, AssessmentScoreModel
from app.common.sqlite.db import get_db
from app.controller.kpi.kpi_controller import router as kpi_router


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
    EmployeeModel.create_table()
    AssessmentCycleModel.create_table()
    AssessmentDimensionModel.create_table()
    AssessmentRecordModel.create_table()
    AssessmentScoreModel.create_table()
    
    _init_default_users(db)
    
    migrate_database()
    
    print("Database initialized successfully")


def _init_default_users(db):
    user_model = UserModel()
    for i in range(2, 11):
        username = f"user{i}"
        existing = user_model.get_by_username(username)
        if not existing:
            user_model.create(username, f"user{i}123")


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
app.include_router(kpi_router, prefix="/api")


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
