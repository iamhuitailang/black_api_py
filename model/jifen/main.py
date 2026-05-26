from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from controllers import (
    user_router, category_router, product_router, order_router,
    points_router, task_router, address_router, lottery_router
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="积分商城API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router)
app.include_router(category_router)
app.include_router(product_router)
app.include_router(order_router)
app.include_router(points_router)
app.include_router(task_router)
app.include_router(address_router)
app.include_router(lottery_router)


@app.get("/")
def root():
    return {"message": "积分商城API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
