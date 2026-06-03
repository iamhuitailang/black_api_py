from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from controllers import (
    auth_controller,
    user_controller,
    submarine_controller,
    creature_controller,
    treasure_controller,
    equipment_controller,
    music_controller,
    ruin_controller,
    user_collection_controller,
    user_progress_controller
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="海底探险者游戏API",
    description="深海探险游戏后端API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_controller, prefix="/api")
app.include_router(user_controller, prefix="/api")
app.include_router(submarine_controller, prefix="/api")
app.include_router(creature_controller, prefix="/api")
app.include_router(treasure_controller, prefix="/api")
app.include_router(equipment_controller, prefix="/api")
app.include_router(music_controller, prefix="/api")
app.include_router(ruin_controller, prefix="/api")
app.include_router(user_collection_controller, prefix="/api")
app.include_router(user_progress_controller, prefix="/api")


@app.get("/")
def read_root():
    return {"message": "欢迎来到海底探险者游戏API", "version": "1.0.0"}


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "message": "API运行正常"}
