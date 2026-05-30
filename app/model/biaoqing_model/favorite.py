from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class FavoriteModel:
    TABLE_NAME = 'tb_biaoqing_model_favorites'

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
                emoji_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_emoji ON {cls.TABLE_NAME}(emoji_id)"
        db.execute(index_sql)
        index_sql = f"CREATE UNIQUE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_unique ON {cls.TABLE_NAME}(user_id, emoji_id)"
        db.execute(index_sql)

    def create(self, user_id: int, emoji_id: int) -> int:
        existing = self.query.find_one({'user_id': user_id, 'emoji_id': emoji_id})
        if existing:
            return 0
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'emoji_id': emoji_id,
            'created_at': now
        }
        result = self.exec.insert(data)
        if result > 0:
            from app.model.biaoqing_model.emoji import EmojiModel
            EmojiModel().increment_favorite(emoji_id, 1)
        return result

    def delete(self, user_id: int, emoji_id: int) -> int:
        result = self.exec.delete({'user_id': user_id, 'emoji_id': emoji_id})
        if result > 0:
            from app.model.biaoqing_model.emoji import EmojiModel
            EmojiModel().increment_favorite(emoji_id, -1)
        return result

    def is_favorited(self, user_id: int, emoji_id: int) -> bool:
        return self.query.exists({'user_id': user_id, 'emoji_id': emoji_id})

    def get_user_favorites(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        from app.model.biaoqing_model.emoji import EmojiModel
        emoji_table = EmojiModel.TABLE_NAME

        count_sql = f"""
            SELECT COUNT(*) as total FROM {self.TABLE_NAME} f
            INNER JOIN {emoji_table} e ON f.emoji_id = e.id
            WHERE f.user_id = ? AND e.status = ?
        """
        total_result = self.db.fetch_one(count_sql, (user_id, EmojiModel.STATUS_APPROVED))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT e.* FROM {self.TABLE_NAME} f
            INNER JOIN {emoji_table} e ON f.emoji_id = e.id
            WHERE f.user_id = ? AND e.status = ?
            ORDER BY f.id DESC
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, (user_id, EmojiModel.STATUS_APPROVED))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def delete_by_user_id(self, user_id: int) -> int:
        return self.exec.delete({'user_id': user_id})

    def delete_by_emoji_id(self, emoji_id: int) -> int:
        return self.exec.delete({'emoji_id': emoji_id})
