from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse, FileResponse
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
from app.model.sc import (
    ScUserModel,
    ScTokenModel,
    ScPartModel,
    ScUserPartModel,
    ScCarModel,
    ScCarPartModel,
    ScPaintModel,
    ScWindTunnelModel,
    ScResearchModel,
    ScTeamModel,
    ScTeamMemberModel,
    ScRaceModel,
    ScRaceEntryModel,
    ScRaceResultModel,
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

    ScUserModel.create_table()
    ScTokenModel.create_table()
    ScPartModel.create_table()
    ScUserPartModel.create_table()
    ScCarModel.create_table()
    ScCarPartModel.create_table()
    ScPaintModel.create_table()
    ScWindTunnelModel.create_table()
    ScResearchModel.create_table()
    ScTeamModel.create_table()
    ScTeamMemberModel.create_table()
    ScRaceModel.create_table()
    ScRaceEntryModel.create_table()
    ScRaceResultModel.create_table()

    XqAdminModel.init_default_admin()
    XqCategoryModel.init_default_categories()

    ScPartModel.init_default_parts()
    ScRaceModel.init_default_races()

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

class SPAStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):
        try:
            response = await super().get_response(path, scope)
            if response.status_code == 404 and (path.startswith('sc_web/') or path == 'sc_web' or path == ''):
                full_path = os.path.join(self.directory, 'sc_web', 'index.html')
                if os.path.exists(full_path):
                    return FileResponse(full_path)
            return response
        except Exception:
            if path.startswith('sc_web/') or path == 'sc_web' or path == '':
                full_path = os.path.join(self.directory, 'sc_web', 'index.html')
                if os.path.exists(full_path):
                    return FileResponse(full_path)
            raise

app.mount("/static", SPAStaticFiles(directory="static"), name="static")


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
async def root(request: Request):
    accept_header = request.headers.get("accept", "")
    if "text/html" in accept_header:
        return RedirectResponse(url="/static/sc_web/")
    return {
        "code": 0,
        "message": "success",
        "data": {
            "name": "FastAPI SQLite Backend",
            "version": "1.0.0",
            "docs": "/docs",
            "redoc": "/redoc",
            "app": "/static/sc_web/"
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
        port=8642,
        reload=True
    )
