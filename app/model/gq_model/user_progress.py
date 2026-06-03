from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GqUserProgressModel:
    TABLE_NAME = 'tb_gq_model_user_progress'

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
                user_id INTEGER NOT NULL,
                track_id INTEGER NOT NULL,
                best_score INTEGER DEFAULT 0,
                best_stars INTEGER DEFAULT 0,
                play_count INTEGER DEFAULT 0,
                is_unlocked INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE UNIQUE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id_track_id ON {cls.TABLE_NAME}(user_id, track_id)"
        db.execute(index_sql)

    def create(self, user_id: int, track_id: int, is_unlocked: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'track_id': track_id,
            'is_unlocked': is_unlocked,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_and_track(self, user_id: int, track_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'track_id': track_id})

    def get_user_progress(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='track_id ASC')

    def get_unlocked_tracks(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id, 'is_unlocked': 1}, order_by='track_id ASC')

    def update_progress(self, user_id: int, track_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'best_score', 'best_stars', 'play_count', 'is_unlocked'
        ]}
        update_data['updated_at'] = now
        return self.exec.update(update_data, conditions={'user_id': user_id, 'track_id': track_id})

    def increment_play_count(self, user_id: int, track_id: int) -> int:
        now = datetime.now().isoformat()
        sql = f"UPDATE {self.TABLE_NAME} SET play_count = play_count + 1, updated_at = ? WHERE user_id = ? AND track_id = ?"
        cursor = self.db.execute(sql, (now, user_id, track_id))
        return cursor.rowcount

    def unlock_track(self, user_id: int, track_id: int) -> int:
        now = datetime.now().isoformat()
        data = {'is_unlocked': 1, 'updated_at': now}
        return self.exec.update(data, conditions={'user_id': user_id, 'track_id': track_id})

    def get_or_create(self, user_id: int, track_id: int) -> Dict[str, Any]:
        record = self.get_by_user_and_track(user_id, track_id)
        if record:
            return record
        self.create(user_id, track_id, is_unlocked=1)
        return self.get_by_user_and_track(user_id, track_id)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_user(self, user_id: int) -> int:
        return self.exec.delete({'user_id': user_id})
