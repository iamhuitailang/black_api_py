from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class UserAchievementModel:
    TABLE_NAME = 'tb_daka_user_achievements'

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
                achievement_name TEXT DEFAULT '',
                achievement_icon TEXT DEFAULT '',
                points_reward INTEGER DEFAULT 0,
                unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_achievement_id ON {cls.TABLE_NAME}(achievement_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_achievement ON {cls.TABLE_NAME}(user_id, achievement_id)"
        db.execute(index_sql)

    def create(self, user_id: int, achievement_id: int, achievement_name: str = '',
               achievement_icon: str = '', points_reward: int = 0) -> int:
        existing = self.get_user_achievement(user_id, achievement_id)
        if existing:
            return 0

        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'achievement_id': achievement_id,
            'achievement_name': achievement_name,
            'achievement_icon': achievement_icon,
            'points_reward': points_reward,
            'unlocked_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_user_achievement(self, user_id: int, achievement_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'achievement_id': achievement_id})

    def get_user_achievements(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='unlocked_at DESC')

    def check_and_unlock_achievements(self, user_id: int) -> List[Dict[str, Any]]:
        from app.model.daka.achievement import AchievementModel
        from app.model.daka.record import RecordModel
        from app.model.daka.user import UserModel

        achievement_model = AchievementModel()
        record_model = RecordModel()
        user_model = UserModel()

        all_achievements = achievement_model.get_all()
        user = user_model.get_by_id(user_id)
        unlocked_achievements = []

        if not user:
            return unlocked_achievements

        user_achievement_ids = {ua.get('achievement_id') for ua in self.get_user_achievements(user_id)}
        stats = record_model.get_user_statistics(user_id)

        for achievement in all_achievements:
            achievement_id = achievement.get('id')
            if achievement_id in user_achievement_ids:
                continue

            condition_type = achievement.get('condition_type')
            condition_value = achievement.get('condition_value', 0)
            task_id = achievement.get('task_id', 0)
            unlocked = False

            if condition_type == 'checkin_count':
                unlocked = stats.get('total_checkins', 0) >= condition_value

            elif condition_type == 'streak_days':
                unlocked = user.get('current_streak', 0) >= condition_value

            elif condition_type == 'total_completions':
                unlocked = stats.get('completed_count', 0) >= condition_value

            elif condition_type == 'total_points':
                unlocked = user.get('points', 0) >= condition_value

            elif condition_type == 'perfect_day':
                today_records = record_model.get_user_today_records(user_id)
                completed_today = [r for r in today_records if r.get('is_completed') == 1]
                from app.model.daka.task import TaskModel
                task_model = TaskModel()
                user_tasks = task_model.get_user_tasks(user_id)
                unlocked = len(completed_today) >= len(user_tasks) and len(user_tasks) > 0

            elif condition_type == 'task_streak' and task_id > 0:
                streak_info = record_model.get_task_streak(user_id, task_id)
                unlocked = streak_info.get('current_streak', 0) >= condition_value

            elif condition_type == 'task_count' and task_id > 0:
                sql = f"""
                    SELECT COUNT(*) as count 
                    FROM {record_model.TABLE_NAME} 
                    WHERE user_id = ? AND task_id = ? AND is_completed = 1
                """
                result = self.db.fetch_one(sql, (user_id, task_id))
                unlocked = result and result.get('count', 0) >= condition_value

            if unlocked:
                self.create(
                    user_id=user_id,
                    achievement_id=achievement_id,
                    achievement_name=achievement.get('name', ''),
                    achievement_icon=achievement.get('icon', ''),
                    points_reward=achievement.get('points_reward', 0)
                )
                user_model.update_points(user_id, achievement.get('points_reward', 0))
                unlocked_achievements.append(achievement_model.to_dict(achievement))

        return unlocked_achievements

    def get_user_achievement_count(self, user_id: int) -> int:
        sql = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME} WHERE user_id = ?"
        result = self.db.fetch_one(sql, (user_id,))
        return result.get('count', 0) if result else 0

    def to_dict(self, record: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': record.get('id'),
            'user_id': record.get('user_id'),
            'achievement_id': record.get('achievement_id'),
            'achievement_name': record.get('achievement_name'),
            'achievement_icon': record.get('achievement_icon'),
            'points_reward': record.get('points_reward'),
            'unlocked_at': record.get('unlocked_at')
        }
