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
from app.model.schedule import ShiftModel, StaffModel, ScheduleModel, SwapRequestModel
from app.common.sqlite.db import get_db


def migrate_database():
    print("Running database migrations...")
    
    migrated = BannerModel.migrate_remove_aspect_ratio()
    if migrated:
        print("  - Migrated tb_mudan_banner: removed aspect_ratio column")


def seed_schedule_data():
    print("Seeding schedule data...")
    
    shift_model = ShiftModel()
    staff_model = StaffModel()
    
    if shift_model.count() == 0:
        default_shifts = [
            ('早班', '08:00', '16:00', '#3b82f6'),
            ('中班', '16:00', '24:00', '#f97316'),
            ('夜班', '00:00', '08:00', '#8b5cf6'),
            ('休息', '00:00', '00:00', '#9ca3af'),
        ]
        for name, start, end, color in default_shifts:
            shift_model.create(name, start, end, color)
        print("  - Created default shifts")
    
    if staff_model.count() == 0:
        default_staff = [
            ('张护士长', 'admin'),
            ('李护士', 'staff'),
            ('王护士', 'staff'),
            ('刘护士', 'staff'),
            ('陈护士', 'staff'),
            ('杨护士', 'staff'),
            ('赵护士', 'staff'),
            ('黄护士', 'staff'),
        ]
        for name, role in default_staff:
            staff_model.create(name, role)
        print("  - Created default staff")


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
    ShiftModel.create_table()
    StaffModel.create_table()
    ScheduleModel.create_table()
    SwapRequestModel.create_table()
    
    migrate_database()
    seed_schedule_data()
    
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
        port=8804,
        reload=True
    )
