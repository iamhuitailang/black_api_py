from sqlalchemy.orm import Session
from typing import List, Optional
from models.scene import Scene


class SceneBusiness:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        name: str,
        display_name: str,
        background_color: str = "#0a0a1a",
        ground_color: str = "#1a1a2e",
        accent_color: str = "#4a90d9",
        description: str = None,
    ) -> Scene:
        scene = Scene(
            name=name,
            display_name=display_name,
            background_color=background_color,
            ground_color=ground_color,
            accent_color=accent_color,
            description=description,
        )
        self.db.add(scene)
        self.db.commit()
        self.db.refresh(scene)
        return scene

    def get_by_id(self, scene_id: int) -> Optional[Scene]:
        return self.db.query(Scene).filter(Scene.id == scene_id).first()

    def get_by_name(self, name: str) -> Optional[Scene]:
        return self.db.query(Scene).filter(Scene.name == name).first()

    def get_all_active(self) -> List[Scene]:
        return self.db.query(Scene).filter(Scene.is_active == 1).all()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Scene]:
        return self.db.query(Scene).offset(skip).limit(limit).all()

    def update(self, scene_id: int, **kwargs) -> Optional[Scene]:
        scene = self.get_by_id(scene_id)
        if scene:
            for key, value in kwargs.items():
                if hasattr(scene, key):
                    setattr(scene, key, value)
            self.db.commit()
            self.db.refresh(scene)
        return scene

    def delete(self, scene_id: int) -> bool:
        scene = self.get_by_id(scene_id)
        if scene:
            self.db.delete(scene)
            self.db.commit()
            return True
        return False

    def init_default_scenes(self) -> List[Scene]:
        scenes = [
            {
                "name": "space",
                "display_name": "星空战场",
                "background_color": "#0a0a1a",
                "ground_color": "#1a1a2e",
                "accent_color": "#4a90d9",
                "description": "深邃的星空背景，适合激烈的空中对决",
            },
            {
                "name": "city",
                "display_name": "都市天空",
                "background_color": "#1a1a3e",
                "ground_color": "#2a2a4e",
                "accent_color": "#ff6b6b",
                "description": "繁华都市上空，穿梭于摩天大楼之间",
            },
            {
                "name": "desert",
                "display_name": "沙漠风暴",
                "background_color": "#3d2e1a",
                "ground_color": "#5a4a2e",
                "accent_color": "#ffa94d",
                "description": "炎热的沙漠上空，沙尘漫天",
            },
        ]
        created = []
        for scene_data in scenes:
            if not self.get_by_name(scene_data["name"]):
                created.append(self.create(**scene_data))
        return created
