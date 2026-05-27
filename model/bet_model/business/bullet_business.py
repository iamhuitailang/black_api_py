from sqlalchemy.orm import Session
from typing import List, Optional
from models.bullet import Bullet


class BulletBusiness:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        name: str,
        type: str = "normal",
        damage: float = 10.0,
        speed: float = 8.0,
        size: int = 8,
        color: str = "#ff6b6b",
        description: str = None,
        is_tracking: int = 0,
        cooldown: float = 0.5,
    ) -> Bullet:
        bullet = Bullet(
            name=name,
            type=type,
            damage=damage,
            speed=speed,
            size=size,
            color=color,
            description=description,
            is_tracking=is_tracking,
            cooldown=cooldown,
        )
        self.db.add(bullet)
        self.db.commit()
        self.db.refresh(bullet)
        return bullet

    def get_by_id(self, bullet_id: int) -> Optional[Bullet]:
        return self.db.query(Bullet).filter(Bullet.id == bullet_id).first()

    def get_by_name(self, name: str) -> Optional[Bullet]:
        return self.db.query(Bullet).filter(Bullet.name == name).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Bullet]:
        return self.db.query(Bullet).offset(skip).limit(limit).all()

    def get_by_type(self, type: str) -> List[Bullet]:
        return self.db.query(Bullet).filter(Bullet.type == type).all()

    def update(self, bullet_id: int, **kwargs) -> Optional[Bullet]:
        bullet = self.get_by_id(bullet_id)
        if bullet:
            for key, value in kwargs.items():
                if hasattr(bullet, key):
                    setattr(bullet, key, value)
            self.db.commit()
            self.db.refresh(bullet)
        return bullet

    def delete(self, bullet_id: int) -> bool:
        bullet = self.get_by_id(bullet_id)
        if bullet:
            self.db.delete(bullet)
            self.db.commit()
            return True
        return False

    def init_default_bullets(self) -> List[Bullet]:
        bullets = [
            {
                "name": "normal",
                "type": "normal",
                "damage": 10.0,
                "speed": 8.0,
                "size": 8,
                "color": "#ff6b6b",
                "description": "普通炮弹，基础伤害",
                "is_tracking": 0,
                "cooldown": 0.3,
            },
            {
                "name": "heavy",
                "type": "heavy",
                "damage": 25.0,
                "speed": 5.0,
                "size": 14,
                "color": "#ff8c00",
                "description": "重型炮弹，高伤害但速度慢",
                "is_tracking": 0,
                "cooldown": 0.8,
            },
            {
                "name": "rapid",
                "type": "rapid",
                "damage": 5.0,
                "speed": 12.0,
                "size": 5,
                "color": "#4ecdc4",
                "description": "速射炮弹，低伤害但速度快",
                "is_tracking": 0,
                "cooldown": 0.15,
            },
            {
                "name": "tracking",
                "type": "tracking",
                "damage": 15.0,
                "speed": 6.0,
                "size": 10,
                "color": "#9b59b6",
                "description": "追踪飞弹，自动追踪目标",
                "is_tracking": 1,
                "cooldown": 2.0,
            },
        ]
        created = []
        for bullet_data in bullets:
            if not self.get_by_name(bullet_data["name"]):
                created.append(self.create(**bullet_data))
        return created
