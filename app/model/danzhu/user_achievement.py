from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class UserAchievementModel:
    TABLE_NAME = 'tb_danzhu_model_user_achievement'

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
                achievement_code TEXT NOT NULL,
                progress_json TEXT DEFAULT '{{}}',
                is_unlocked INTEGER DEFAULT 0,
                unlocked_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)

        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_achievement_code ON {cls.TABLE_NAME}(achievement_code)"
        db.execute(index_sql2)

    def get_user_achievements(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT 
                ua.*,
                a.name,
                a.description,
                a.icon,
                a.type,
                a.condition_json,
                a.sort_order
            FROM {self.TABLE_NAME} ua
            RIGHT JOIN tb_danzhu_model_achievement a ON ua.achievement_id = a.id AND ua.user_id = ?
            ORDER BY a.sort_order ASC, a.id ASC
        """
        return self.db.fetch_all(sql, (user_id,))

    def get_by_user_and_code(self, user_id: int, achievement_code: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({
            'user_id': user_id,
            'achievement_code': achievement_code
        })

    def create(self, user_id: int, achievement_id: int, achievement_code: str,
               progress_json: str = '{}', is_unlocked: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'achievement_id': achievement_id,
            'achievement_code': achievement_code,
            'progress_json': progress_json,
            'is_unlocked': is_unlocked,
            'created_at': now,
        }
        if is_unlocked:
            data['unlocked_at'] = now
        return self.exec.insert(data)

    def update(self, record_id: int, **kwargs) -> int:
        data = {}
        for key in ['progress_json', 'is_unlocked', 'unlocked_at']:
            if kwargs.get(key) is not None:
                data[key] = kwargs[key]
        if not data:
            return 0
        return self.exec.update_by_id(record_id, data)

    def unlock(self, user_id: int, achievement_id: int, achievement_code: str) -> bool:
        existing = self.get_by_user_and_code(user_id, achievement_code)
        now = datetime.now().isoformat()

        if existing:
            if existing.get('is_unlocked'):
                return False
            self.update(
                existing.get('id'),
                is_unlocked=1,
                unlocked_at=now
            )
            return True
        else:
            self.create(
                user_id=user_id,
                achievement_id=achievement_id,
                achievement_code=achievement_code,
                progress_json='{}',
                is_unlocked=1
            )
            return True

    def get_unlocked_count(self, user_id: int) -> int:
        return self.query.count({
            'user_id': user_id,
            'is_unlocked': 1
        })

    def get_total_launches(self, user_id: int) -> int:
        record = self.get_by_user_and_code(user_id, 'launch_100')
        if not record:
            return 0
        import json
        try:
            progress = json.loads(record.get('progress_json', '{}'))
            return progress.get('count', 0)
        except (json.JSONDecodeError, TypeError):
            return 0

    def update_launch_count(self, user_id: int, count: int) -> None:
        achievement_model = AchievementModel()
        achievement = achievement_model.get_by_code('launch_100')
        if not achievement:
            return

        existing = self.get_by_user_and_code(user_id, 'launch_100')
        import json
        now = datetime.now().isoformat()

        if existing:
            progress = {'count': count}
            is_unlocked = 1 if count >= 100 else 0
            data = {
                'progress_json': json.dumps(progress),
                'is_unlocked': is_unlocked,
            }
            if is_unlocked and not existing.get('is_unlocked'):
                data['unlocked_at'] = now
            self.update(existing.get('id'), **data)
        else:
            progress = {'count': count}
            is_unlocked = 1 if count >= 100 else 0
            self.create(
                user_id=user_id,
                achievement_id=achievement.get('id'),
                achievement_code='launch_100',
                progress_json=json.dumps(progress),
                is_unlocked=is_unlocked
            )


from .achievement import AchievementModel
