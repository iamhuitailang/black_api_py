from sqlalchemy.orm import Session
from typing import List, Optional
from models.skill import Skill


class SkillBusiness:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        name: str,
        display_name: str,
        type: str = "attack",
        damage: float = 25.0,
        cooldown: float = 10.0,
        bullet_count: int = 3,
        description: str = None,
    ) -> Skill:
        skill = Skill(
            name=name,
            display_name=display_name,
            type=type,
            damage=damage,
            cooldown=cooldown,
            bullet_count=bullet_count,
            description=description,
        )
        self.db.add(skill)
        self.db.commit()
        self.db.refresh(skill)
        return skill

    def get_by_id(self, skill_id: int) -> Optional[Skill]:
        return self.db.query(Skill).filter(Skill.id == skill_id).first()

    def get_by_name(self, name: str) -> Optional[Skill]:
        return self.db.query(Skill).filter(Skill.name == name).first()

    def get_all_active(self) -> List[Skill]:
        return self.db.query(Skill).filter(Skill.is_active == 1).all()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Skill]:
        return self.db.query(Skill).offset(skip).limit(limit).all()

    def update(self, skill_id: int, **kwargs) -> Optional[Skill]:
        skill = self.get_by_id(skill_id)
        if skill:
            for key, value in kwargs.items():
                if hasattr(skill, key):
                    setattr(skill, key, value)
            self.db.commit()
            self.db.refresh(skill)
        return skill

    def delete(self, skill_id: int) -> bool:
        skill = self.get_by_id(skill_id)
        if skill:
            self.db.delete(skill)
            self.db.commit()
            return True
        return False

    def init_default_skills(self) -> List[Skill]:
        skills = [
            {
                "name": "tracking_missile",
                "display_name": "追踪飞弹",
                "type": "attack",
                "damage": 25.0,
                "cooldown": 10.0,
                "bullet_count": 3,
                "description": "释放3枚追踪飞弹，自动锁定目标",
            },
        ]
        created = []
        for skill_data in skills:
            if not self.get_by_name(skill_data["name"]):
                created.append(self.create(**skill_data))
        return created
