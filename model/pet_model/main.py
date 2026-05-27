from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from model.pet_model.core.database import engine, Base
from model.pet_model.controller.user_controller import router as user_router
from model.pet_model.controller.pet_controller import router as pet_router
from model.pet_model.controller.adoption_controller import router as adoption_router
from model.pet_model.controller.other_controller import router as other_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="宠物领养信息平台 API",
    description="连接送养人与领养人，提供宠物信息发布、领养申请、审核流程、科普知识等一站式服务",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router, prefix="/api")
app.include_router(pet_router, prefix="/api")
app.include_router(adoption_router, prefix="/api")
app.include_router(other_router)


@app.get("/", summary="健康检查")
def root():
    return {"message": "宠物领养信息平台 API 服务运行中", "code": 200}


@app.get("/health", summary="健康检查")
def health():
    return {"status": "healthy", "code": 200}
