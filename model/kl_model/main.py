from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from model.kl_model.database.db import engine, Base
from model.kl_model.core.config import settings
from model.kl_model.controllers import (
    user_controller,
    park_controller,
    fossil_controller,
    dinosaur_controller,
    habitat_controller,
    facility_controller,
    event_controller,
    friend_controller,
    gene_controller,
    share_controller
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="恐龙公园 API", description="恐龙公园游戏后端API", redirect_slashes=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_prefix = settings.API_V1_STR

app.include_router(user_controller.router, prefix=api_prefix)
app.include_router(park_controller.router, prefix=api_prefix)
app.include_router(fossil_controller.router, prefix=api_prefix)
app.include_router(dinosaur_controller.router, prefix=api_prefix)
app.include_router(habitat_controller.router, prefix=api_prefix)
app.include_router(facility_controller.router, prefix=api_prefix)
app.include_router(event_controller.router, prefix=api_prefix)
app.include_router(friend_controller.router, prefix=api_prefix)
app.include_router(gene_controller.router, prefix=api_prefix)
app.include_router(share_controller.router, prefix=api_prefix)


@app.get("/")
def read_root():
    return {"message": "恐龙公园 API 服务运行中"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
