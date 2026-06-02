from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class PlayerAchievementModel:
    TABLE_NAME = 'tb_dafuweng_model_player_achievement'

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
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_achievement_id ON {cls.TABLE_NAME}(achievement_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_achievement ON {cls.TABLE_NAME}(user_id, achievement_id)"
        db.execute(index_sql)

    def create(self, user_id: int, achievement_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'achievement_id': achievement_id,
            'unlocked_at': now
        }
        return self.exec.insert(data)

    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='unlocked_at DESC')

    def check_unlocked(self, user_id: int, achievement_id: int) -> bool:
        record = self.query.find_one({'user_id': user_id, 'achievement_id': achievement_id})
        return record is not None

    def get_all(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='unlocked_at DESC')
