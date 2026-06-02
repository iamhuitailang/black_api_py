from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class UserAchievementModel:
    TABLE_NAME = 'tb_huangjin_model_user_achievement'

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
        try:
            return self.exec.insert(data)
        except Exception:
            return 0

    def is_unlocked(self, user_id: int, achievement_id: int) -> bool:
        return self.query.exists({
            'user_id': user_id,
            'achievement_id': achievement_id
        })

    def get_by_user(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT ua.*, a.name, a.description, a.condition_type, a.condition_value,
                   a.icon, a.badge_color, a.sort_order
            FROM {self.TABLE_NAME} ua
            LEFT JOIN {AchievementModel.TABLE_NAME if hasattr(AchievementModel, 'TABLE_NAME') else 'tb_huangjin_model_achievement'} a ON ua.achievement_id = a.id
            WHERE ua.user_id = ?
            ORDER BY a.sort_order ASC, ua.unlocked_at DESC
        """
        return self.db.fetch_all(sql, (user_id,))

    def get_unlocked_ids(self, user_id: int) -> List[int]:
        records = self.query.find_all(
            {'user_id': user_id},
            fields=['achievement_id']
        )
        return [r.get('achievement_id') for r in records]

    def count_by_user(self, user_id: int) -> int:
        return self.query.count({'user_id': user_id})

    def delete_by_user(self, user_id: int) -> int:
        return self.exec.execute_raw(
            f"DELETE FROM {self.TABLE_NAME} WHERE user_id = ?",
            (user_id,)
        )

    def to_dict(self, record: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': record.get('id'),
            'user_id': record.get('user_id'),
            'achievement_id': record.get('achievement_id'),
            'name': record.get('name', ''),
            'description': record.get('description', ''),
            'condition_type': record.get('condition_type', ''),
            'condition_value': record.get('condition_value', 0),
            'icon': record.get('icon', ''),
            'badge_color': record.get('badge_color', '#FFD700'),
            'sort_order': record.get('sort_order', 0),
            'unlocked_at': record.get('unlocked_at')
        }


from app.model.huangjin_model.achievement import AchievementModel
