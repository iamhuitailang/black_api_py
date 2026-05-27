from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, get_db
from .controllers import user_controller, character_controller, level_controller
from .controllers import progress_controller, session_controller
from .business.character_business import CharacterBusiness
from .business.level_business import LevelBusiness

Base.metadata.create_all(bind=engine)

app = FastAPI(title="人类一败涂地 - 马戏闯关游戏API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_controller.router)
app.include_router(character_controller.router)
app.include_router(level_controller.router)
app.include_router(progress_controller.router)
app.include_router(session_controller.router)


@app.on_event("startup")
def startup_event():
    db = next(get_db())
    try:
        CharacterBusiness.init_default_characters(db)
        LevelBusiness.init_default_levels(db)
    finally:
        db.close()


@app.get("/")
def read_root():
    return {"message": "欢迎来到人类一败涂地 - 马戏闯关游戏API", "docs": "/docs"}


@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "服务运行正常"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
