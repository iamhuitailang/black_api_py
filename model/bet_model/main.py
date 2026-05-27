from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "database"))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "models"))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "business"))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "routers"))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "controller"))

from database.config import engine, Base, SessionLocal
from routers.player_router import router as player_router
from routers.game_record_router import router as game_record_router
from routers.game_save_router import router as game_save_router
from routers.scene_router import router as scene_router
from routers.bullet_router import router as bullet_router
from routers.skill_router import router as skill_router
from business.scene_business import SceneBusiness
from business.bullet_business import BulletBusiness
from business.skill_business import SkillBusiness

Base.metadata.create_all(bind=engine)

app = FastAPI(title="背叛大炮飞人 API", description="背叛大炮飞人游戏后端API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(player_router)
app.include_router(game_record_router)
app.include_router(game_save_router)
app.include_router(scene_router)
app.include_router(bullet_router)
app.include_router(skill_router)


@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        SceneBusiness(db).init_default_scenes()
        BulletBusiness(db).init_default_bullets()
        SkillBusiness(db).init_default_skills()
    finally:
        db.close()


@app.get("/api/health")
def health_check():
    return {"code": 200, "message": "success", "data": {"status": "ok"}}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8002)
