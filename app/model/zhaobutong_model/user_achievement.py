from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ZbtUserAchievementModel:
    TABLE_NAME = 'tb_zhaobutong_model_user_achievement'

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
                unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, achievement_id)
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_achievement_id ON {cls.TABLE_NAME}(achievement_id)"
        db.execute(index_sql)

    def unlock(self, user_id: int, achievement_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'achievement_id': achievement_id,
            'unlocked_at': now
        }
        return self.exec.upsert(data, ['user_id', 'achievement_id'])

    def is_unlocked(self, user_id: int, achievement_id: int) -> bool:
        return self.query.exists({'user_id': user_id, 'achievement_id': achievement_id})

    def get_user_achievements(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT ua.*, a.name, a.title, a.description, a.icon, a.type
            FROM {self.TABLE_NAME} ua
            LEFT JOIN tb_zhaobutong_model_achievement a ON ua.achievement_id = a.id
            WHERE ua.user_id = ?
            ORDER BY a.sort_order ASC
        """
        return self.db.fetch_all(sql, (user_id,))

    def get_all_with_status(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT a.*, 
                   CASE WHEN ua.id IS NOT NULL THEN 1 ELSE 0 END as unlocked,
                   ua.unlocked_at
            FROM tb_zhaobutong_model_achievement a
            LEFT JOIN {self.TABLE_NAME} ua ON a.id = ua.achievement_id AND ua.user_id = ?
            ORDER BY a.sort_order ASC
        """
        return self.db.fetch_all(sql, (user_id,))

    def get_user_achievement_count(self, user_id: int) -> int:
        return self.query.count({'user_id': user_id})
