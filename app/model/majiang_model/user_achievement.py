from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class UserAchievementModel:
    TABLE_NAME = 'tb_majiang_model_user_achievement'

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
                reward_claimed INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_achievement ON {cls.TABLE_NAME}(user_id, achievement_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql2)

    def create(self, user_id: int, achievement_id: int) -> int:
        existing = self.get_by_user_and_achievement(user_id, achievement_id)
        if existing:
            return 0

        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'achievement_id': achievement_id,
            'unlocked_at': now,
            'reward_claimed': 0,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_and_achievement(self, user_id: int, achievement_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'achievement_id': achievement_id})

    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT ua.*, a.name, a.description, a.category, a.rarity, 
                   a.reward_coins, a.reward_exp, a.icon
            FROM {self.TABLE_NAME} ua
            LEFT JOIN tb_majiang_model_achievement a ON ua.achievement_id = a.id
            WHERE ua.user_id = ?
            ORDER BY ua.unlocked_at DESC
        """
        return self.db.fetch_all(sql, (user_id,))

    def get_unlocked_ids(self, user_id: int) -> List[int]:
        records = self.query.find_all({'user_id': user_id})
        return [r.get('achievement_id') for r in records]

    def claim_reward(self, record_id: int) -> int:
        return self.exec.update_by_id(record_id, {'reward_claimed': 1})

    def check_and_unlock(self, user_id: int, achievement_id: int) -> Optional[Dict[str, Any]]:
        existing = self.get_by_user_and_achievement(user_id, achievement_id)
        if existing:
            return None

        record_id = self.create(user_id, achievement_id)
        if record_id > 0:
            from app.model.majiang_model.achievement import AchievementModel
            ach_model = AchievementModel()
            achievement = ach_model.get_by_id(achievement_id)
            return {
                'record_id': record_id,
                'achievement': achievement
            }
        return None

    def get_all(self, page: int = 1, page_size: int = 10, user_id: int = None) -> Dict[str, Any]:
        conditions = {}
        if user_id is not None:
            conditions['user_id'] = user_id
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')
