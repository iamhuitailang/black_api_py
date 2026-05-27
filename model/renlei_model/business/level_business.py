from sqlalchemy.orm import Session
from ..models import Level
from ..utils import to_json_field, parse_json_field


class LevelBusiness:
    @staticmethod
    def create_level(db: Session, name: str, description: str = None, level_type: str = None,
                    difficulty: int = 1, theme: str = None, start_position: dict = None,
                    end_position: dict = None, obstacles: list = None, is_active: bool = True, order: int = 0):
        level = Level(
            name=name,
            description=description,
            level_type=level_type,
            difficulty=difficulty,
            theme=theme,
            start_position=to_json_field(start_position) if start_position else None,
            end_position=to_json_field(end_position) if end_position else None,
            obstacles=to_json_field(obstacles) if obstacles else None,
            is_active=is_active,
            order=order
        )
        db.add(level)
        db.commit()
        db.refresh(level)
        return level

    @staticmethod
    def get_level_by_id(db: Session, level_id: int):
        level = db.query(Level).filter(Level.id == level_id).first()
        if level:
            level.start_position = parse_json_field(level.start_position)
            level.end_position = parse_json_field(level.end_position)
            level.obstacles = parse_json_field(level.obstacles)
        return level

    @staticmethod
    def list_levels(db: Session, only_active: bool = True):
        query = db.query(Level)
        if only_active:
            query = query.filter(Level.is_active == True)
        levels = query.order_by(Level.order).all()
        for level in levels:
            level.start_position = parse_json_field(level.start_position)
            level.end_position = parse_json_field(level.end_position)
            level.obstacles = parse_json_field(level.obstacles)
        return levels

    @staticmethod
    def update_level(db: Session, level_id: int, **kwargs):
        level = db.query(Level).filter(Level.id == level_id).first()
        if not level:
            return None
        for key, value in kwargs.items():
            if hasattr(level, key) and value is not None:
                if key in ['start_position', 'end_position', 'obstacles']:
                    setattr(level, key, to_json_field(value))
                else:
                    setattr(level, key, value)
        db.commit()
        db.refresh(level)
        return level

    @staticmethod
    def delete_level(db: Session, level_id: int):
        level = db.query(Level).filter(Level.id == level_id).first()
        if not level:
            return False
        db.delete(level)
        db.commit()
        return True

    @staticmethod
    def init_default_levels(db: Session):
        existing = db.query(Level).count()
        if existing > 0:
            return

        levels = [
            {
                "name": "旋转气球舞台",
                "description": "躲避旋转气球障碍，借力气球弹跳前行",
                "level_type": "balloon",
                "difficulty": 1,
                "theme": "circus",
                "order": 1,
                "start_position": {"x": 100, "y": 400},
                "end_position": {"x": 1100, "y": 400},
                "obstacles": [
                    {"type": "balloon", "x": 300, "y": 300, "radius": 50, "rotationSpeed": 2},
                    {"type": "balloon", "x": 500, "y": 250, "radius": 60, "rotationSpeed": -1.5},
                    {"type": "balloon", "x": 700, "y": 350, "radius": 45, "rotationSpeed": 2.5},
                    {"type": "balloon", "x": 900, "y": 280, "radius": 55, "rotationSpeed": -2}
                ]
            },
            {
                "name": "摇摆吊桥马戏",
                "description": "行走晃动吊桥，极易失衡摔倒",
                "level_type": "bridge",
                "difficulty": 2,
                "theme": "circus",
                "order": 2,
                "start_position": {"x": 100, "y": 350},
                "end_position": {"x": 1100, "y": 350},
                "obstacles": [
                    {"type": "bridge", "x": 300, "y": 400, "width": 200, "height": 20, "swingAmount": 30},
                    {"type": "bridge", "x": 600, "y": 380, "width": 150, "height": 20, "swingAmount": 40},
                    {"type": "bridge", "x": 850, "y": 420, "width": 180, "height": 20, "swingAmount": 35}
                ]
            },
            {
                "name": "小丑弹跳乐园",
                "description": "多层弹力蹦床，把控落点闯关",
                "level_type": "trampoline",
                "difficulty": 3,
                "theme": "circus",
                "order": 3,
                "start_position": {"x": 100, "y": 450},
                "end_position": {"x": 1100, "y": 150},
                "obstacles": [
                    {"type": "trampoline", "x": 250, "y": 480, "width": 100, "height": 20, "bounceForce": 15},
                    {"type": "trampoline", "x": 450, "y": 400, "width": 80, "height": 20, "bounceForce": 18},
                    {"type": "trampoline", "x": 650, "y": 300, "width": 90, "height": 20, "bounceForce": 16},
                    {"type": "trampoline", "x": 850, "y": 200, "width": 100, "height": 20, "bounceForce": 14}
                ]
            },
            {
                "name": "高空钢丝巡演",
                "description": "窄道行走，重心极易偏移坠落",
                "level_type": "tightrope",
                "difficulty": 4,
                "theme": "circus",
                "order": 4,
                "start_position": {"x": 100, "y": 200},
                "end_position": {"x": 1100, "y": 200},
                "obstacles": [
                    {"type": "rope", "x": 200, "y": 200, "width": 300, "height": 10, "windForce": 5},
                    {"type": "rope", "x": 600, "y": 200, "width": 350, "height": 10, "windForce": 7}
                ]
            }
        ]

        for level_data in levels:
            LevelBusiness.create_level(db, **level_data)
