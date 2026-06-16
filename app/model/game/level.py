from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class LevelModel:
    TABLE_NAME = 'tb_game_level'

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
                level_num INTEGER NOT NULL UNIQUE,
                target_speed REAL NOT NULL,
                target_radius REAL NOT NULL,
                knife_count INTEGER NOT NULL,
                direction_change INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_level_num ON {cls.TABLE_NAME}(level_num)"
        db.execute(index_sql)

        cls._init_default_levels()

    @classmethod
    def _init_default_levels(cls):
        db = get_db()
        exists = db.fetch_one(f"SELECT COUNT(*) as cnt FROM {cls.TABLE_NAME}")
        if exists and exists.get('cnt', 0) > 0:
            return

        base_speed = 1.0
        base_radius = 120.0
        base_knife_count = 5

        levels_data = []
        for i in range(1, 101):
            speed = base_speed + (i // 5) * 0.3
            radius = base_radius * (0.9 ** (i // 10))
            if radius < 50:
                radius = 50
            knife_count = base_knife_count + (i // 3)
            direction_change = 1 if i % 5 == 0 and i > 1 else 0

            levels_data.append((
                i, speed, radius, knife_count, direction_change,
                datetime.now().isoformat(), datetime.now().isoformat()
            ))

        db.execute_many(
            f"INSERT INTO {cls.TABLE_NAME} (level_num, target_speed, target_radius, knife_count, direction_change, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            levels_data
        )

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data.setdefault('created_at', now)
        data.setdefault('updated_at', now)
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_level(self, level_num: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'level_num': level_num})

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        data['updated_at'] = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='level_num ASC')
