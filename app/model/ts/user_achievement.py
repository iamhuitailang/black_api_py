from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TsUserAchievementModel:
    TABLE_NAME = 'tb_ts_user_achievement'

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

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_achievement_id ON {cls.TABLE_NAME}(achievement_id)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_achievement ON {cls.TABLE_NAME}(user_id, achievement_id)"
        db.execute(index_sql3)

    def create(self, user_id: int, achievement_id: int) -> int:
        existing = self.query.find_one({
            'user_id': user_id,
            'achievement_id': achievement_id
        })
        if existing:
            return 0

        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'achievement_id': achievement_id,
            'unlocked_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT ua.id, ua.user_id, ua.achievement_id, ua.unlocked_at,
                   a.name, a.description, a.condition_type, a.condition_value, a.badge_icon
            FROM {self.TABLE_NAME} ua
            JOIN tb_ts_achievement a ON ua.achievement_id = a.id
            WHERE ua.user_id = ?
            ORDER BY ua.unlocked_at DESC
        """
        return self.db.fetch_all(sql, (user_id,))

    def get_user_achievement_ids(self, user_id: int) -> List[int]:
        records = self.query.find_all({'user_id': user_id}, fields=['achievement_id'])
        return [r.get('achievement_id') for r in records]

    def is_unlocked(self, user_id: int, achievement_id: int) -> bool:
        return self.query.exists({
            'user_id': user_id,
            'achievement_id': achievement_id
        })

    def get_achievement_count(self, user_id: int) -> int:
        return self.query.count({'user_id': user_id})

    def get_recent_achievements(self, user_id: int, limit: int = 5) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT ua.id, ua.user_id, ua.achievement_id, ua.unlocked_at,
                   a.name, a.description, a.condition_type, a.condition_value, a.badge_icon
            FROM {self.TABLE_NAME} ua
            JOIN tb_ts_achievement a ON ua.achievement_id = a.id
            WHERE ua.user_id = ?
            ORDER BY ua.unlocked_at DESC
            LIMIT ?
        """
        return self.db.fetch_all(sql, (user_id, limit))

    def check_and_unlock(self, user_id: int, user_stats: Dict[str, Any]) -> List[Dict[str, Any]]:
        from app.model.ts.achievement import TsAchievementModel

        achievement_model = TsAchievementModel()
        all_achievements = achievement_model.get_all()
        unlocked_achievement_ids = set(self.get_user_achievement_ids(user_id))

        newly_unlocked = []

        for achievement in all_achievements:
            achievement_id = achievement.get('id')
            if achievement_id in unlocked_achievement_ids:
                continue

            if achievement_model.check_achievement(user_stats, achievement):
                if self.create(user_id, achievement_id) > 0:
                    newly_unlocked.append(achievement)

        return newly_unlocked

    def delete_by_user(self, user_id: int) -> int:
        return self.exec.execute_raw(
            f"DELETE FROM {self.TABLE_NAME} WHERE user_id = ?",
            (user_id,)
        )

    def to_dict(self, user_achievement: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': user_achievement.get('id'),
            'user_id': user_achievement.get('user_id'),
            'achievement_id': user_achievement.get('achievement_id'),
            'unlocked_at': user_achievement.get('unlocked_at')
        }
