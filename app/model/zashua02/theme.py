from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ThemeModel:
    TABLE_NAME = "tb_zashua02_model_theme"

    def __init__(self):
        self.db = get_db()
        self.query = ORMQuery(self.TABLE_NAME)
        self.exec = ORMExec(self.TABLE_NAME)

    @classmethod
    def create_table(cls):
        db = get_db()
        sql = f"""
            CREATE TABLE IF NOT EXISTS {cls.TABLE_NAME} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL UNIQUE,
                bg_color TEXT DEFAULT '',
                accent_color TEXT DEFAULT '',
                text_color TEXT DEFAULT '',
                config TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

    @classmethod
    def init_default_themes(cls):
        model = ThemeModel()
        existing = model.get_all()
        if len(existing) > 0:
            return
        now = datetime.now().isoformat()
        themes = [
            {"name": "马戏团之夜", "type": "circus", "bg_color": "#1a0a2e", "accent_color": "#ff6b35", "text_color": "#ffffff", "config": '{"stage_bg":"#2d1b4e","floor_color":"#8b4513","spotlight":"#ffd700"}', "created_at": now},
            {"name": "街头嘉年华", "type": "carnival", "bg_color": "#0d1b2a", "accent_color": "#00b4d8", "text_color": "#e0e1dd", "config": '{"stage_bg":"#1b263b","floor_color":"#415a77","spotlight":"#90e0ef"}', "created_at": now},
            {"name": "宫廷盛宴", "type": "palace", "bg_color": "#2b1a0e", "accent_color": "#d4af37", "text_color": "#f5f0e8", "config": '{"stage_bg":"#3d2b1f","floor_color":"#8b6914","spotlight":"#f0e68c"}', "created_at": now},
        ]
        for theme in themes:
            model.exec.insert(theme)

    def create(self, name: str, type: str, bg_color: str = "", accent_color: str = "", text_color: str = "", config: str = "") -> int:
        now = datetime.now().isoformat()
        return self.exec.insert({"name": name, "type": type, "bg_color": bg_color, "accent_color": accent_color, "text_color": text_color, "config": config, "created_at": now})

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_type(self, type: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({"type": type})

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by="id")

    def update(self, theme_id: int, **kwargs) -> int:
        return self.exec.update_by_id(theme_id, kwargs)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
