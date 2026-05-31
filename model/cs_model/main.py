from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database.db import engine, Base
from .controller import user_router, weapon_router, map_router, game_router, achievement_router, admin_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CS射击游戏API", description="CS射击游戏后端接口")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router)
app.include_router(weapon_router)
app.include_router(map_router)
app.include_router(game_router)
app.include_router(achievement_router)
app.include_router(admin_router)

@app.get("/")
def root():
    return {"message": "CS Game API Server"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
