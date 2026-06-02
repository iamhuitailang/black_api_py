from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ZumaUserAchievementModel:
    TABLE_NAME = 'tb_zuma_model_user_achievements'

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

    def create(self, user_id: int, achievement_id: int) -> int:
        now = datetime.now().isoformat()
        try:
            data = {
                'user_id': user_id,
                'achievement_id': achievement_id,
                'unlocked_at': now
            }
            return self.exec.insert(data)
        except Exception:
            return 0

    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        from app.model.zuma_model.achievement import ZumaAchievementModel
        achievement_model = ZumaAchievementModel()

        sql = f"""
            SELECT ua.*, a.name, a.description, a.category, a.requirement, a.reward_coins, a.icon
            FROM {self.TABLE_NAME} ua
            JOIN {achievement_model.TABLE_NAME} a ON ua.achievement_id = a.id
            WHERE ua.user_id = ?
            ORDER BY ua.unlocked_at DESC
        """
        return self.db.fetch_all(sql, (user_id,))

    def get_user_achievement_ids(self, user_id: int) -> List[int]:
        sql = f"SELECT achievement_id FROM {self.TABLE_NAME} WHERE user_id = ?"
        results = self.db.fetch_all(sql, (user_id,))
        return [r['achievement_id'] for r in results]

    def has_achievement(self, user_id: int, achievement_id: int) -> bool:
        result = self.query.find_one({'user_id': user_id, 'achievement_id': achievement_id})
        return result is not None

    def delete_by_user_id(self, user_id: int) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE user_id = ?"
        cursor = self.db.execute(sql, (user_id,))
        return cursor.rowcount
