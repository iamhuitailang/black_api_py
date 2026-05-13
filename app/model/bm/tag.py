from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TagModel:
    TABLE_NAME = 'tb_bm_tags'

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
                color TEXT DEFAULT '#1890ff',
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

    def create(self, name: str, color: str = '#1890ff', sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'color': color,
            'sort_order': sort_order,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'name': name})

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in ['name', 'color', 'sort_order']}
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} ORDER BY sort_order ASC, id DESC"
        return self.db.fetch_all(sql)

    def to_dict(self, tag: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': tag.get('id'),
            'name': tag.get('name'),
            'color': tag.get('color'),
            'sort_order': tag.get('sort_order'),
            'created_at': tag.get('created_at')
        }
