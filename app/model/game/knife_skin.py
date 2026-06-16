from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class KnifeSkinModel:
    TABLE_NAME = 'tb_game_knife_skin'

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
                skin_key TEXT NOT NULL UNIQUE,
                skin_name TEXT NOT NULL,
                description TEXT,
                unlock_level INTEGER NOT NULL DEFAULT 1,
                color_primary TEXT NOT NULL,
                color_secondary TEXT,
                effect_type TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_skin_key ON {cls.TABLE_NAME}(skin_key)"
        db.execute(index_sql)

        cls._init_default_skins()

    @classmethod
    def _init_default_skins(cls):
        db = get_db()
        exists = db.fetch_one(f"SELECT COUNT(*) as cnt FROM {cls.TABLE_NAME}")
        if exists and exists.get('cnt', 0) > 0:
            return

        now = datetime.now().isoformat()
        skins = [
            ('default', '普通刀', '基础飞刀，初始可用', 1, '#8B4513', '#D2691E', None),
            ('fire', '火焰刀', '灼热的火焰飞刀，通关第10关解锁', 10, '#FF4500', '#FFD700', 'fire'),
            ('ice', '冰霜刀', '冰冷的寒霜飞刀，通关第20关解锁', 20, '#00CED1', '#E0FFFF', 'ice'),
            ('rainbow', '彩虹刀', '绚丽的彩虹飞刀，通关第30关解锁', 30, '#FF00FF', '#00FFFF', 'rainbow'),
        ]

        for skin in skins:
            db.execute(
                f"INSERT INTO {cls.TABLE_NAME} (skin_key, skin_name, description, unlock_level, color_primary, color_secondary, effect_type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                skin + (now, now)
            )

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data.setdefault('created_at', now)
        data.setdefault('updated_at', now)
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_key(self, skin_key: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'skin_key': skin_key})

    def get_unlocked_skins(self, current_level: int) -> List[Dict[str, Any]]:
        return self.query.query_raw(
            f"SELECT * FROM {self.TABLE_NAME} WHERE unlock_level <= ? ORDER BY unlock_level ASC",
            (current_level,)
        )

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='unlock_level ASC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        data['updated_at'] = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
