from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import API_PREFIX, APP_NAME, APP_VERSION
from .core.database import Base, engine
from .models import novel as _novel_models
from .controllers.novel import router as novel_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title=APP_NAME, version=APP_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get(API_PREFIX + "/health")
def health():
    return {"status": "ok", "app": APP_NAME, "version": APP_VERSION}


app.include_router(novel_router, prefix=API_PREFIX, tags=["小说阅读器"])
