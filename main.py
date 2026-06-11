from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import sys
import os
import threading
import time
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.common import get_router_registry
from app.model.helloworld import HelloWorldModel
from app.model.mudan import BannerModel, BannerConfigModel, TabModel, TabDetailModel, CommercialModel, ProductModel
from app.model.auth import UserModel, TokenModel
from app.model.rides import RideModel
from app.common.sqlite.db import get_db
from fastapi.responses import FileResponse


def migrate_database():
    print("Running database migrations...")
    
    migrated = BannerModel.migrate_remove_aspect_ratio()
    if migrated:
        print("  - Migrated tb_mudan_banner: removed aspect_ratio column")


_daily_cleanup_stop = threading.Event()
_daily_cleanup_thread = None


def _daily_cleanup_worker():
    from app.business.rides import RideBusiness
    business = RideBusiness()
    print(f"[DailyCleanup] 每日凌晨自动清理任务已启动，将在每天 00:00 执行")
    
    while not _daily_cleanup_stop.is_set():
        now = datetime.now()
        next_run = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
        wait_seconds = (next_run - now).total_seconds()
        
        print(f"[DailyCleanup] 下次清理时间: {next_run.strftime('%Y-%m-%d %H:%M:%S')} (等待 {int(wait_seconds)} 秒)")
        
        if _daily_cleanup_stop.wait(timeout=wait_seconds):
            break
        
        try:
            result = business.clean_expired(24)
            if result.get('code') == 0:
                count = result.get('data', {}).get('cleaned_count', 0)
                print(f"[DailyCleanup] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} 自动清理完成，共清理 {count} 条过期拼车信息")
            else:
                print(f"[DailyCleanup] 清理失败: {result.get('message', '未知错误')}")
        except Exception as e:
            print(f"[DailyCleanup] 清理异常: {e}")
        
        time.sleep(60)


def start_daily_cleanup():
    global _daily_cleanup_thread
    if _daily_cleanup_thread and _daily_cleanup_thread.is_alive():
        return
    _daily_cleanup_stop.clear()
    _daily_cleanup_thread = threading.Thread(target=_daily_cleanup_worker, daemon=True)
    _daily_cleanup_thread.start()


def stop_daily_cleanup():
    _daily_cleanup_stop.set()
    if _daily_cleanup_thread:
        _daily_cleanup_thread.join(timeout=5)


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
    RideModel.create_table()
    
    migrate_database()
    
    print("Database initialized successfully")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_database()
    start_daily_cleanup()
    yield
    stop_daily_cleanup()
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
    return FileResponse("static/rides/index.html")


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
        port=8002,
        reload=True
    )
