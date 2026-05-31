from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from model.feixingqi_model.database import engine, Base, get_db
from model.feixingqi_model.models import user, room, item, user_item, game_record, game_state, spectator, rank
from model.feixingqi_model.controller import user_controller, room_controller, item_controller, game_controller, spectator_controller, rank_controller
from model.feixingqi_model.business.item_business import ItemBusiness
from model.feixingqi_model.business.user_business import UserBusiness

Base.metadata.create_all(bind=engine)

app = FastAPI(title="飞行棋游戏API", description="在线飞行棋游戏后端API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_controller.router)
app.include_router(room_controller.router)
app.include_router(item_controller.router)
app.include_router(game_controller.router)
app.include_router(spectator_controller.router)
app.include_router(rank_controller.router)

@app.on_event("startup")
def startup_event():
    db = next(get_db())
    ItemBusiness.init_default_items(db)
    if not UserBusiness.get_user_by_username(db, "admin"):
        admin = UserBusiness.create_user(db, "admin", "admin123", "管理员")
        admin.role = "admin"
        db.commit()

@app.get("/api/feixingqi/health")
def health_check():
    return {"code": 200, "message": "success", "data": {"status": "ok"}}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
