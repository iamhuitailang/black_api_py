from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TagModel:
    TABLE_NAME = 'tb_biaoqing_model_tags'

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
                name TEXT NOT NULL UNIQUE,
                use_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_name ON {cls.TABLE_NAME}(name)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_use_count ON {cls.TABLE_NAME}(use_count DESC)"
        db.execute(index_sql)

    def get_or_create(self, name: str) -> int:
        name = name.strip().lower()
        existing = self.query.find_one({'name': name})
        if existing:
            return existing['id']
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'use_count': 1,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'name': name.strip().lower()})

    def update_use_count(self, tag_id: int, delta: int = 1) -> int:
        tag = self.get_by_id(tag_id)
        if not tag:
            return 0
        new_count = max(0, tag.get('use_count', 0) + delta)
        return self.exec.update_by_id(tag_id, {'use_count': new_count})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_hot_tags(self, limit: int = 20) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='use_count DESC, id DESC', limit=limit)

    def search_tags(self, keyword: str, limit: int = 10) -> List[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE name LIKE ? ORDER BY use_count DESC LIMIT ?"
        return self.db.fetch_all(sql, (f"%{keyword.lower()}%", limit))

    def to_dict(self, tag: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': tag.get('id'),
            'name': tag.get('name'),
            'use_count': tag.get('use_count'),
            'created_at': tag.get('created_at')
        }
