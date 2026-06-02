from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class XiangqiSpectatorModel:
    TABLE_NAME = 'tb_xiangqi077_model_spectator'

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
                username TEXT DEFAULT '',
                nickname TEXT DEFAULT '',
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                left_at TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_id ON {cls.TABLE_NAME}(game_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)

    def join_spectate(self, game_id: int, user_id: int, username: str = '', nickname: str = '') -> int:
        existing = self.query.find_one({
            'game_id': game_id,
            'user_id': user_id,
            'left_at': None
        })
        if existing:
            return existing.get('id')
        now = datetime.now().isoformat()
        data = {
            'game_id': game_id,
            'user_id': user_id,
            'username': username,
            'nickname': nickname,
            'joined_at': now,
            'left_at': None
        }
        return self.exec.insert(data)

    def leave_spectate(self, game_id: int, user_id: int) -> int:
        now = datetime.now().isoformat()
        sql = f"UPDATE {self.TABLE_NAME} SET left_at = ? WHERE game_id = ? AND user_id = ? AND left_at IS NULL"
        cursor = self.db.execute(sql, (now, game_id, user_id))
        return cursor.rowcount

    def get_game_spectators(self, game_id: int) -> List[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE game_id = ? AND left_at IS NULL"
        return self.db.fetch_all(sql, (game_id,))

    def get_spectator_count(self, game_id: int) -> int:
        sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE game_id = ? AND left_at IS NULL"
        result = self.db.fetch_one(sql, (game_id,))
        return result['total'] if result else 0

    def get_user_spectating(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE user_id = ? AND left_at IS NULL"
        return self.db.fetch_all(sql, (user_id,))

    def get_all(self, page: int = 1, page_size: int = 10, game_id: int = None) -> Dict[str, Any]:
        conditions = {}
        if game_id is not None:
            conditions['game_id'] = game_id
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def to_dict(self, record: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': record.get('id'),
            'game_id': record.get('game_id'),
            'user_id': record.get('user_id'),
            'username': record.get('username'),
            'nickname': record.get('nickname'),
            'joined_at': record.get('joined_at'),
            'left_at': record.get('left_at')
        }
