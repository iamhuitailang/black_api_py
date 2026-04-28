from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class FavoriteModel:
    TABLE_NAME = 'tb_dj_favorite'

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
                market_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, market_id)
            )
        """
        db.execute(sql)

        index_sql1 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_market_id ON {cls.TABLE_NAME}(market_id)"
        db.execute(index_sql1)
        db.execute(index_sql2)

    def create(self, user_id: int, market_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'market_id': market_id,
            'created_at': now
        }
        try:
            return self.exec.insert(data)
        except Exception:
            return 0

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all_by_field('user_id', user_id, order_by='created_at DESC')

    def is_favorited(self, user_id: int, market_id: int) -> bool:
        return self.query.exists({'user_id': user_id, 'market_id': market_id})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_user_and_market(self, user_id: int, market_id: int) -> int:
        return self.exec.delete({'user_id': user_id, 'market_id': market_id})

    def toggle(self, user_id: int, market_id: int) -> bool:
        if self.is_favorited(user_id, market_id):
            self.delete_by_user_and_market(user_id, market_id)
            return False
        else:
            self.create(user_id, market_id)
            return True

    def count(self, conditions: Dict[str, Any] = None) -> int:
        return self.query.count(conditions)
