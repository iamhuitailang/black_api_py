from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class XiangqiChatModel:
    TABLE_NAME = 'tb_xiangqi077_model_chat'

    TYPE_GAME = 0
    TYPE_HALL = 1

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
                game_id INTEGER,
                user_id INTEGER NOT NULL,
                username TEXT DEFAULT '',
                nickname TEXT DEFAULT '',
                content TEXT NOT NULL,
                chat_type INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_id ON {cls.TABLE_NAME}(game_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(chat_type)"
        db.execute(index_sql)

    def create(self, user_id: int, content: str, game_id: int = None,
               username: str = '', nickname: str = '', chat_type: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'game_id': game_id,
            'user_id': user_id,
            'username': username,
            'nickname': nickname,
            'content': content,
            'chat_type': chat_type,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_game_messages(self, game_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'game_id': game_id, 'chat_type': self.TYPE_GAME},
            order_by='id ASC',
            limit=limit
        )

    def get_hall_messages(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'chat_type': self.TYPE_HALL},
            order_by='id DESC',
            limit=limit
        )

    def get_all(self, page: int = 1, page_size: int = 10, chat_type: int = None,
                game_id: int = None) -> Dict[str, Any]:
        conditions = {}
        if chat_type is not None:
            conditions['chat_type'] = chat_type
        if game_id is not None:
            conditions['game_id'] = game_id
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def to_dict(self, chat: Dict[str, Any]) -> Dict[str, Any]:
        type_map = {self.TYPE_GAME: '对局聊天', self.TYPE_HALL: '大厅聊天'}
        return {
            'id': chat.get('id'),
            'game_id': chat.get('game_id'),
            'user_id': chat.get('user_id'),
            'username': chat.get('username'),
            'nickname': chat.get('nickname'),
            'content': chat.get('content'),
            'chat_type': chat.get('chat_type'),
            'chat_type_text': type_map.get(chat.get('chat_type'), '未知'),
            'created_at': chat.get('created_at')
        }
