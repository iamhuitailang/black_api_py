from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameRecordModel:
    TABLE_NAME = 'shield_game_record'

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
                player_name TEXT NOT NULL DEFAULT 'Player',
                level INTEGER NOT NULL,
                cleared INTEGER NOT NULL DEFAULT 0,
                final_hp INTEGER NOT NULL DEFAULT 0,
                final_shield_durability INTEGER NOT NULL DEFAULT 0,
                shield_broken INTEGER NOT NULL DEFAULT 0,
                total_damage_dealt INTEGER NOT NULL DEFAULT 0,
                total_damage_taken INTEGER NOT NULL DEFAULT 0,
                play_time_seconds INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_level ON {cls.TABLE_NAME}(level)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_player ON {cls.TABLE_NAME}(player_name)"
        db.execute(index_sql2)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        record_data = {
            'player_name': data.get('player_name', 'Player'),
            'level': data.get('level', 1),
            'cleared': data.get('cleared', 0),
            'final_hp': data.get('final_hp', 100),
            'final_shield_durability': data.get('final_shield_durability', 80),
            'shield_broken': data.get('shield_broken', 0),
            'total_damage_dealt': data.get('total_damage_dealt', 0),
            'total_damage_taken': data.get('total_damage_taken', 0),
            'play_time_seconds': data.get('play_time_seconds', 0),
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(record_data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_player(self, player_name: str) -> List[Dict[str, Any]]:
        return self.query.find_all_by_field('player_name', player_name, order_by='id DESC')

    def get_best_by_level(self, level: int) -> Optional[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE level = ? AND cleared = 1 ORDER BY play_time_seconds ASC LIMIT 1"
        return self.db.fetch_one(sql, (level,))

    def get_all(self, limit: int = 100) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id DESC', limit=limit)

    def get_cleared_levels(self, player_name: str) -> List[int]:
        sql = f"SELECT DISTINCT level FROM {self.TABLE_NAME} WHERE player_name = ? AND cleared = 1 ORDER BY level ASC"
        rows = self.db.fetch_all(sql, (player_name,))
        return [row['level'] for row in rows]

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = data.copy()
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()

    def paginate(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='id DESC')
