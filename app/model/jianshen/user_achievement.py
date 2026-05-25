from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class JianshenUserAchievementModel:
    TABLE_NAME = 'tb_jianshen_user_achievements'

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
                unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        db.execute(f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)")
        db.execute(f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_achievement ON {cls.TABLE_NAME}(user_id, achievement_id)")

    def create(self, user_id: int, achievement_id: int) -> int:
        existing = self.query.find_one({'user_id': user_id, 'achievement_id': achievement_id})
        if existing:
            return existing.get('id', 0)
        return self.exec.insert({
            'user_id': user_id,
            'achievement_id': achievement_id,
            'unlocked_at': datetime.now().isoformat()
        })

    def get_by_user(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='unlocked_at DESC')

    def is_unlocked(self, user_id: int, achievement_id: int) -> bool:
        return self.query.exists({'user_id': user_id, 'achievement_id': achievement_id})

    def to_dict(self, record: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': record.get('id'),
            'user_id': record.get('user_id'),
            'achievement_id': record.get('achievement_id'),
            'unlocked_at': record.get('unlocked_at')
        }
