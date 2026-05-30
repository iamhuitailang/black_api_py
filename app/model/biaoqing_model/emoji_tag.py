from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class EmojiTagModel:
    TABLE_NAME = 'tb_biaoqing_model_emoji_tags'

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
                emoji_id INTEGER NOT NULL,
                tag_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_emoji ON {cls.TABLE_NAME}(emoji_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_tag ON {cls.TABLE_NAME}(tag_id)"
        db.execute(index_sql)
        index_sql = f"CREATE UNIQUE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_unique ON {cls.TABLE_NAME}(emoji_id, tag_id)"
        db.execute(index_sql)

    def create(self, emoji_id: int, tag_id: int) -> int:
        existing = self.query.find_one({'emoji_id': emoji_id, 'tag_id': tag_id})
        if existing:
            return existing['id']
        now = datetime.now().isoformat()
        data = {
            'emoji_id': emoji_id,
            'tag_id': tag_id,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_tag_ids_by_emoji_id(self, emoji_id: int) -> List[int]:
        items = self.query.find_all({'emoji_id': emoji_id}, fields=['tag_id'])
        return [item['tag_id'] for item in items]

    def get_emoji_ids_by_tag_id(self, tag_id: int) -> List[int]:
        items = self.query.find_all({'tag_id': tag_id}, fields=['emoji_id'])
        return [item['emoji_id'] for item in items]

    def delete_by_emoji_id(self, emoji_id: int) -> int:
        return self.exec.delete({'emoji_id': emoji_id})

    def delete_by_tag_id(self, tag_id: int) -> int:
        return self.exec.delete({'tag_id': tag_id})

    def delete(self, emoji_id: int, tag_id: int) -> int:
        return self.exec.delete({'emoji_id': emoji_id, 'tag_id': tag_id})
