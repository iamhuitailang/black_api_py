from sqlalchemy.orm import Session
from . import engine, Base
from models import Level, BlockTemplate, User


def init_database():
    Base.metadata.create_all(bind=engine)
    
    db = Session(bind=engine)
    try:
        _init_block_templates(db)
        _init_levels(db)
        _init_default_user(db)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error initializing database: {e}")
    finally:
        db.close()


def _init_block_templates(db: Session):
    templates = [
        {
            "name": "实心方块",
            "type": "solid_block",
            "width": 80,
            "height": 80,
            "weight": 100,
            "load_capacity": 500,
            "color": "#FF6B6B",
            "description": "厚重稳固、重心稳，承重能力高，适合底层基座、主力支撑"
        },
        {
            "name": "空心框架",
            "type": "hollow_frame",
            "width": 80,
            "height": 80,
            "weight": 30,
            "load_capacity": 200,
            "color": "#4ECDC4",
            "description": "轻便省空间、易倾斜，承重能力中，适合中层镂空搭建"
        },
        {
            "name": "斜角支架",
            "type": "angle_bracket",
            "width": 80,
            "height": 40,
            "weight": 50,
            "load_capacity": 250,
            "color": "#FFE66D",
            "description": "倾斜借力、辅助平衡，承重能力中，适合侧边加固、矫正重心"
        },
        {
            "name": "长条横梁",
            "type": "long_beam",
            "width": 160,
            "height": 30,
            "weight": 40,
            "load_capacity": 150,
            "color": "#95E1D3",
            "description": "横向延展、跨度支撑，承重能力低，适合楼层平铺、隔空搭建"
        },
        {
            "name": "配重铁块",
            "type": "weight_block",
            "width": 60,
            "height": 60,
            "weight": 200,
            "load_capacity": 800,
            "color": "#6C5B7B",
            "description": "增重稳重心、压制倾斜，承重能力极高，适合偏移结构配重找平"
        }
    ]
    
    existing = db.query(BlockTemplate).count()
    if existing == 0:
        for t in templates:
            db.add(BlockTemplate(**t))


def _init_levels(db: Session):
    levels = [
        {
            "name": "新手村 - 初次尝试",
            "description": "学习基础搭建，无风压，只需达到目标高度",
            "difficulty": 1,
            "target_height": 200,
            "target_score": 100,
            "gravity": 9.8,
            "wind_force": 0,
            "wind_direction": 0
        },
        {
            "name": "微风平原",
            "description": "轻微侧风，注意结构稳定性",
            "difficulty": 2,
            "target_height": 300,
            "target_score": 200,
            "gravity": 9.8,
            "wind_force": 5,
            "wind_direction": 1
        },
        {
            "name": "彩虹桥",
            "description": "中等风压，需要配重平衡",
            "difficulty": 3,
            "target_height": 400,
            "target_score": 350,
            "gravity": 9.8,
            "wind_force": 10,
            "wind_direction": 1
        },
        {
            "name": "云端高塔",
            "description": "强风压挑战，重心控制关键",
            "difficulty": 4,
            "target_height": 500,
            "target_score": 500,
            "gravity": 9.8,
            "wind_force": 15,
            "wind_direction": 1
        },
        {
            "name": "风暴之巅",
            "description": "极端风压，终极挑战",
            "difficulty": 5,
            "target_height": 600,
            "target_score": 800,
            "gravity": 12,
            "wind_force": 25,
            "wind_direction": 1
        }
    ]
    
    existing = db.query(Level).count()
    if existing == 0:
        for l in levels:
            db.add(Level(**l))


def _init_default_user(db: Session):
    existing = db.query(User).filter_by(username="guest").first()
    if not existing:
        guest = User(
            username="guest",
            password="guest123",
            nickname="游客玩家",
            total_score=0
        )
        db.add(guest)
