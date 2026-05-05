from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class BqTagModel:
    TABLE_NAME = 'tb_bq_tags'

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
                name TEXT NOT NULL,
                count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, name)
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_count ON {cls.TABLE_NAME}(count)"
        db.execute(index_sql)

    def create(self, user_id: int, name: str, count: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'name': name,
            'count': count,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_name_and_user(self, name: str, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'name': name, 'user_id': user_id})

    def update_count(self, tag_id: int, delta: int) -> int:
        now = datetime.now().isoformat()
        tag = self.get_by_id(tag_id)
        if not tag:
            return 0
        
        new_count = max(0, tag.get('count', 0) + delta)
        return self.exec.update_by_id(tag_id, {
            'count': new_count,
            'updated_at': now
        })

    def increment_count(self, tag_id: int) -> int:
        return self.update_count(tag_id, 1)

    def decrement_count(self, tag_id: int) -> int:
        return self.update_count(tag_id, -1)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_user_tags(self, user_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        return self.query.find_all(
            {'user_id': user_id},
            order_by='count DESC, id ASC',
            limit=limit
        )

    def get_or_create(self, user_id: int, name: str) -> int:
        existing = self.get_by_name_and_user(name, user_id)
        if existing:
            return existing.get('id')
        return self.create(user_id, name, 0)

    def update_note_tags(self, user_id: int, old_tags: List[str], new_tags: List[str]):
        from app.model.bq.note import BqNoteModel
        note_model = BqNoteModel()
        
        old_set = set(old_tags)
        new_set = set(new_tags)
        
        added_tags = new_set - old_set
        removed_tags = old_set - new_set
        
        for tag_name in added_tags:
            tag = self.get_by_name_and_user(tag_name, user_id)
            if tag:
                self.increment_count(tag.get('id'))
            else:
                self.create(user_id, tag_name, 1)
        
        for tag_name in removed_tags:
            tag = self.get_by_name_and_user(tag_name, user_id)
            if tag:
                self.decrement_count(tag.get('id'))
                if tag.get('count', 0) <= 1:
                    self.delete(tag.get('id'))

    def search_user_tags(self, user_id: int, keyword: str, limit: int = 20) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE user_id = ? AND name LIKE ?
            ORDER BY count DESC, id ASC
            LIMIT {limit}
        """
        return self.db.fetch_all(sql, (user_id, f'%{keyword}%'))

    def to_dict(self, tag: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': tag.get('id'),
            'user_id': tag.get('user_id'),
            'name': tag.get('name'),
            'count': tag.get('count', 0),
            'created_at': tag.get('created_at'),
            'updated_at': tag.get('updated_at')
        }
