from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class UserAchievementModel:
    TABLE_NAME = 'tb_doudizhu_model_user_achievements'

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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_achievement_id ON {cls.TABLE_NAME}(achievement_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_achievement ON {cls.TABLE_NAME}(user_id, achievement_id)"
        db.execute(index_sql)

    def create(self, user_id: int, achievement_id: int) -> int:
        existing = self.query.find_one({'user_id': user_id, 'achievement_id': achievement_id})
        if existing:
            return 0

        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'achievement_id': achievement_id,
            'unlocked_at': now,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='unlocked_at DESC')

    def get_by_achievement_id(self, achievement_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'achievement_id': achievement_id})

    def is_unlocked(self, user_id: int, achievement_id: int) -> bool:
        return self.query.exists({'user_id': user_id, 'achievement_id': achievement_id})

    def get_user_achievement_count(self, user_id: int) -> int:
        return self.query.count({'user_id': user_id})

    def get_all(self, page: int = 1, page_size: int = 10, user_id: int = None) -> Dict[str, Any]:
        conditions = {}
        if user_id is not None:
            conditions['user_id'] = user_id
        return self.query.paginate(page, page_size, conditions, order_by='unlocked_at DESC')

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_dict(self, user_achievement: Dict[str, Any], achievement: Dict[str, Any] = None) -> Dict[str, Any]:
        result = {
            'id': user_achievement.get('id'),
            'user_id': user_achievement.get('user_id'),
            'achievement_id': user_achievement.get('achievement_id'),
            'unlocked_at': user_achievement.get('unlocked_at')
        }
        if achievement:
            from app.model.doudizhu_model.achievement import AchievementModel
            achievement_model = AchievementModel()
            result['achievement'] = achievement_model.to_dict(achievement)
        return result
