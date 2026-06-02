from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameLogModel:
    TABLE_NAME = 'tb_dafuweng_model_game_log'

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
                game_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                action TEXT NOT NULL,
                detail TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_id ON {cls.TABLE_NAME}(game_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql)

    def create(self, game_id: int, user_id: int, action: str, detail: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'game_id': game_id,
            'user_id': user_id,
            'action': action,
            'detail': detail,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_game_id(self, game_id: int, page: int = 1, page_size: int = 50) -> Dict[str, Any]:
        conditions = {'game_id': game_id}
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_recent(self, game_id: int, limit: int = 20) -> List[Dict[str, Any]]:
        return self.query.find_all(
            {'game_id': game_id},
            order_by='created_at DESC',
            limit=limit
        )
