from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class UserAchievementModel:
    TABLE_NAME = 'tb_saiche_model_user_achievements'

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
                is_unlocked INTEGER DEFAULT 0,
                unlocked_at TIMESTAMP,
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
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'achievement_id': achievement_id,
            'progress': 0,
            'is_unlocked': 0,
            'unlocked_at': None,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_and_achievement(self, user_id: int, achievement_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'achievement_id': achievement_id})

    def get_user_achievements(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT ua.*, a.name, a.description, a.icon, 
                   a.condition_type, a.condition_value,
                   a.reward_coins, a.reward_exp
            FROM {self.TABLE_NAME} ua
            LEFT JOIN tb_saiche_model_achievements a ON ua.achievement_id = a.id
            WHERE ua.user_id = ?
            ORDER BY a.condition_type, a.condition_value
        """
        return self.db.fetch_all(sql, (user_id,))

    def get_all_with_achievements(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT a.id as achievement_id, a.name, a.description, a.icon,
                   a.condition_type, a.condition_value,
                   a.reward_coins, a.reward_exp,
                   COALESCE(ua.progress, 0) as progress,
                   COALESCE(ua.is_unlocked, 0) as is_unlocked,
                   ua.unlocked_at
            FROM tb_saiche_model_achievements a
            LEFT JOIN {self.TABLE_NAME} ua ON a.id = ua.achievement_id AND ua.user_id = ?
            ORDER BY a.condition_type, a.condition_value
        """
        return self.db.fetch_all(sql, (user_id,))

    def unlock(self, user_id: int, achievement_id: int) -> int:
        user_achievement = self.get_by_user_and_achievement(user_id, achievement_id)
        now = datetime.now().isoformat()

        if user_achievement:
            if user_achievement.get('is_unlocked') == 1:
                return 0
            return self.exec.update_by_id(user_achievement['id'], {
                'is_unlocked': 1,
                'unlocked_at': now
            })
        else:
            data = {
                'user_id': user_id,
                'achievement_id': achievement_id,
                'progress': 100,
                'is_unlocked': 1,
                'unlocked_at': now,
                'created_at': now
            }
            return self.exec.insert(data)

    def update_progress(self, user_id: int, achievement_id: int, progress: int) -> int:
        user_achievement = self.get_by_user_and_achievement(user_id, achievement_id)

        if user_achievement:
            return self.exec.update_by_id(user_achievement['id'], {'progress': progress})
        else:
            now = datetime.now().isoformat()
            data = {
                'user_id': user_id,
                'achievement_id': achievement_id,
                'progress': progress,
                'is_unlocked': 0,
                'unlocked_at': None,
                'created_at': now
            }
            return self.exec.insert(data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_public_dict(self, user_achievement: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': user_achievement.get('achievement_id') or user_achievement.get('id'),
            'achievement_id': user_achievement.get('achievement_id'),
            'name': user_achievement.get('name'),
            'description': user_achievement.get('description'),
            'icon': user_achievement.get('icon'),
            'condition_type': user_achievement.get('condition_type'),
            'condition_value': user_achievement.get('condition_value'),
            'reward_coins': user_achievement.get('reward_coins'),
            'reward_exp': user_achievement.get('reward_exp'),
            'progress': user_achievement.get('progress', 0),
            'is_unlocked': user_achievement.get('is_unlocked', 0),
            'unlocked_at': user_achievement.get('unlocked_at'),
            'created_at': user_achievement.get('created_at')
        }
