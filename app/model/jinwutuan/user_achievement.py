from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class UserAchievementModel:
    TABLE_NAME = 'tb_jinwutuan_model_user_achievement'

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
                progress INTEGER DEFAULT 0,
                unlocked INTEGER DEFAULT 0,
                unlocked_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_achievement_id ON {cls.TABLE_NAME}(achievement_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_unlocked ON {cls.TABLE_NAME}(unlocked)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_achievement ON {cls.TABLE_NAME}(user_id, achievement_id)"
        db.execute(index_sql)

    def create(self, user_id: int, achievement_id: int, progress: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'achievement_id': achievement_id,
            'progress': progress,
            'unlocked': 0,
            'unlocked_at': None,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_user_id(self, user_id: int, page: int = 1, page_size: int = 10,
                        unlocked: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if unlocked is not None:
            conditions['unlocked'] = unlocked
        return self.query.paginate(page, page_size, conditions, order_by='id ASC')

    def get_user_achievements(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='id ASC')

    def check_and_unlock(self, user_id: int, achievement_id: int,
                          current_value: int) -> Optional[Dict[str, Any]]:
        from app.model.jinwutuan.achievement import AchievementModel
        achievement_model = AchievementModel()
        achievement = achievement_model.get_by_id(achievement_id)
        if not achievement:
            return None

        condition_value = achievement.get('condition_value', 0)

        record = self.query.find_one({
            'user_id': user_id,
            'achievement_id': achievement_id
        })

        if not record:
            record_id = self.create(user_id, achievement_id, progress=min(current_value, condition_value) if condition_value > 0 else current_value)
            record = self.query.find_by_id(record_id)

        if record.get('unlocked'):
            return record

        progress = min(current_value, condition_value) if condition_value > 0 else current_value

        if condition_value > 0 and current_value >= condition_value:
            now = datetime.now().isoformat()
            data = {
                'progress': condition_value,
                'unlocked': 1,
                'unlocked_at': now
            }
            self.exec.update_by_id(record.get('id'), data)

            from app.model.jinwutuan.user import UserModel
            user_model = UserModel()
            user_model.add_coins(user_id, achievement.get('reward_coins', 0))

            return self.query.find_by_id(record.get('id'))
        else:
            data = {'progress': progress}
            self.exec.update_by_id(record.get('id'), data)

        return self.query.find_by_id(record.get('id'))

    def to_dict(self, user_achievement: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': user_achievement.get('id'),
            'user_id': user_achievement.get('user_id'),
            'achievement_id': user_achievement.get('achievement_id'),
            'progress': user_achievement.get('progress'),
            'unlocked': user_achievement.get('unlocked'),
            'unlocked_at': user_achievement.get('unlocked_at'),
            'created_at': user_achievement.get('created_at')
        }
