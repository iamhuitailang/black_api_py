import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
from controllers import user, plan, equipment, campsite, community, admin
from models import User
from business.user import hash_password

Base.metadata.create_all(bind=engine)


def init_admin_user():
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                username="admin",
                password=hash_password("admin123"),
                nickname="系统管理员",
                role="admin",
                email="admin@example.com"
            )
            db.add(admin_user)
            db.commit()
            print("管理员账号创建成功: admin / admin123")
    except Exception as e:
        print(f"初始化管理员失败: {e}")
    finally:
        db.close()


app = FastAPI(
    title="野外露营管理系统",
    description="帮助露营爱好者规划行程、记录装备、追踪营地信息、分享露营经验",
    version="1.0.0"
)

@app.on_event("startup")
def startup_event():
    init_admin_user()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router)
app.include_router(plan.router)
app.include_router(equipment.router)
app.include_router(campsite.router)
app.include_router(community.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {
        "message": "欢迎使用野外露营管理系统API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
