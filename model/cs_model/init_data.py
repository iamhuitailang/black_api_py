from sqlalchemy.orm import Session
from .database.db import SessionLocal, engine, Base
from .models import *
from .business.user_business import UserBusiness
from .business.weapon_business import WeaponBusiness
from .business.map_business import MapBusiness
from .business.achievement_business import AchievementBusiness

def init_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        admin = UserBusiness.get_user_by_username(db, "admin")
        if not admin:
            UserBusiness.create_user(db, "admin", "admin123", "admin@cs.com", "管理员")
            admin = UserBusiness.get_user_by_username(db, "admin")
            admin.role = "admin"
            db.commit()
        print("管理员账号: admin / admin123")

        weapons = [
            {"name": "AK47", "weapon_type": "rifle", "damage": 36, "fire_rate": 0.1, "magazine_size": 30, "reload_time": 2.5, "accuracy": 0.85, "recoil": 0.3, "price": 2700},
            {"name": "M4A1", "weapon_type": "rifle", "damage": 33, "fire_rate": 0.09, "magazine_size": 30, "reload_time": 2.4, "accuracy": 0.9, "recoil": 0.25, "price": 3100},
            {"name": "AWP", "weapon_type": "sniper", "damage": 110, "fire_rate": 1.5, "magazine_size": 10, "reload_time": 3.8, "accuracy": 0.99, "recoil": 0.8, "price": 4750},
            {"name": "Desert Eagle", "weapon_type": "pistol", "damage": 54, "fire_rate": 0.22, "magazine_size": 7, "reload_time": 2.2, "accuracy": 0.8, "recoil": 0.4, "price": 700},
            {"name": "Glock", "weapon_type": "pistol", "damage": 18, "fire_rate": 0.08, "magazine_size": 20, "reload_time": 1.8, "accuracy": 0.75, "recoil": 0.15, "price": 200},
            {"name": "MP5", "weapon_type": "smg", "damage": 22, "fire_rate": 0.07, "magazine_size": 30, "reload_time": 2.0, "accuracy": 0.82, "recoil": 0.18, "price": 1500}
        ]
        for w in weapons:
            if not WeaponBusiness.get_weapon_by_name(db, w["name"]):
                WeaponBusiness.create_weapon(db, **w)
        print("武器数据初始化完成")

        maps = [
            {"name": "沙漠2", "description": "经典的沙漠地图，适合中远距离战斗", "map_type": "bomb", "max_players": 10},
            {"name": "Inferno", "description": "意大利小镇地图，多狭窄巷道", "map_type": "bomb", "max_players": 10},
            {"name": "仓库", "description": "室内仓库地图，适合近距离战斗", "map_type": "deathmatch", "max_players": 8}
        ]
        for m in maps:
            if not MapBusiness.get_map_by_name(db, m["name"]):
                MapBusiness.create_map(db, **m)
        print("地图数据初始化完成")

        achievements = [
            {"name": "初出茅庐", "description": "完成第一场比赛", "achievement_type": "game", "target_value": 1},
            {"name": "猎杀新手", "description": "累计击杀10人", "achievement_type": "kill", "target_value": 10},
            {"name": "神枪手", "description": "累计击杀100人", "achievement_type": "kill", "target_value": 100},
            {"name": "传奇杀手", "description": "累计击杀1000人", "achievement_type": "kill", "target_value": 1000},
            {"name": "首胜", "description": "获得第一场胜利", "achievement_type": "win", "target_value": 1},
            {"name": "常胜将军", "description": "累计获得10场胜利", "achievement_type": "win", "target_value": 10}
        ]
        for a in achievements:
            if not AchievementBusiness.get_achievement_by_name(db, a["name"]):
                AchievementBusiness.create_achievement(db, **a)
        print("成就数据初始化完成")

        print("所有数据初始化完成!")
    finally:
        db.close()

if __name__ == "__main__":
    init_data()
