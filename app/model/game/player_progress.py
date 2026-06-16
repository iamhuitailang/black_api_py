from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class PlayerProgressModel:
    TABLE_NAME = 'tb_game_player_progress'

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
                user_id INTEGER NOT NULL UNIQUE,
                current_level INTEGER NOT NULL DEFAULT 1,
                max_unlocked_level INTEGER NOT NULL DEFAULT 1,
                total_knives_thrown INTEGER NOT NULL DEFAULT 0,
                total_success INTEGER NOT NULL DEFAULT 0,
                current_skin TEXT NOT NULL DEFAULT 'default',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data.setdefault('created_at', now)
        data.setdefault('updated_at', now)
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id})

    def get_or_create(self, user_id: int) -> Dict[str, Any]:
        progress = self.get_by_user_id(user_id)
        if progress:
            return progress

        data = {
            'user_id': user_id,
            'current_level': 1,
            'max_unlocked_level': 1,
            'total_knives_thrown': 0,
            'total_success': 0,
            'current_skin': 'default'
        }
        self.create(data)
        return self.get_by_user_id(user_id)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        data['updated_at'] = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, data)

    def update_by_user_id(self, user_id: int, data: Dict[str, Any]) -> int:
        data['updated_at'] = datetime.now().isoformat()
        return self.exec.update(data, {'user_id': user_id})

    def level_up(self, user_id: int, new_level: int) -> int:
        progress = self.get_or_create(user_id)
        data = {
            'current_level': new_level
        }
        if new_level > progress.get('max_unlocked_level', 1):
            data['max_unlocked_level'] = new_level
        return self.update_by_user_id(user_id, data)

    def increment_stats(self, user_id: int, success: bool = True) -> int:
        progress = self.get_or_create(user_id)
        data = {
            'total_knives_thrown': progress.get('total_knives_thrown', 0) + 1
        }
        if success:
            data['total_success'] = progress.get('total_success', 0) + 1
        return self.update_by_user_id(user_id, data)

    def change_skin(self, user_id: int, skin_key: str) -> int:
        return self.update_by_user_id(user_id, {'current_skin': skin_key})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='max_unlocked_level DESC')
