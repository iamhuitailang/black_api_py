from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class UserAchievementModel:
    TABLE_NAME = 'tb_wangzhe_model_user_achievements'

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
                achievement_id INTEGER NOT NULL,
                current_value INTEGER DEFAULT 0,
                completed INTEGER DEFAULT 0,
                claimed INTEGER DEFAULT 0,
                completed_at TIMESTAMP DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_achievement_id ON {cls.TABLE_NAME}(achievement_id)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_completed ON {cls.TABLE_NAME}(completed)"
        db.execute(index_sql3)

    def create(self, user_id: int, achievement_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'achievement_id': achievement_id,
            'current_value': 0,
            'completed': 0,
            'claimed': 0,
            'completed_at': None,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_and_achievement(self, user_id: int, achievement_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'achievement_id': achievement_id})

    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='id DESC')

    def update_progress(self, user_id: int, achievement_id: int, value: int, target_value: int) -> int:
        record = self.get_by_user_and_achievement(user_id, achievement_id)
        now = datetime.now().isoformat()

        if not record:
            self.create(user_id, achievement_id)
            record = self.get_by_user_and_achievement(user_id, achievement_id)

        current_value = min(record.get('current_value', 0) + value, target_value)
        completed = 1 if current_value >= target_value else record.get('completed', 0)
        completed_at = now if completed and not record.get('completed') else record.get('completed_at')

        data = {
            'current_value': current_value,
            'completed': completed,
            'completed_at': completed_at,
            'updated_at': now
        }
        return self.exec.update_by_id(record.get('id'), data)

    def claim_reward(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'claimed': 1,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def get_unclaimed_count(self, user_id: int) -> int:
        sql = f"""
            SELECT COUNT(*) as count FROM {self.TABLE_NAME} 
            WHERE user_id = ? AND completed = 1 AND claimed = 0
        """
        result = self.db.fetch_one(sql, (user_id,))
        return result['count'] if result else 0

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
