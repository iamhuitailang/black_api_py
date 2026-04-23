from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TabDetailModel:
    TABLE_NAME = 'tb_mudan_tab_detail'
    
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
                tab_id INTEGER NOT NULL UNIQUE,
                title TEXT DEFAULT '',
                content TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_tab_id ON {cls.TABLE_NAME}(tab_id)"
        db.execute(index_sql)

    def create(self, tab_id: int, title: str = '', content: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'tab_id': tab_id,
            'title': title,
            'content': content,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_tab_id(self, tab_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'tab_id': tab_id})

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='tab_id ASC')

    def update(self, record_id: int, title: str = None, content: str = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        
        if title is not None:
            data['title'] = title
        if content is not None:
            data['content'] = content
        
        return self.exec.update_by_id(record_id, data)

    def update_by_tab_id(self, tab_id: int, title: str = None, content: str = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        
        if title is not None:
            data['title'] = title
        if content is not None:
            data['content'] = content
        
        return self.exec.update(data, conditions={'tab_id': tab_id})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_tab_id(self, tab_id: int) -> int:
        return self.exec.delete(conditions={'tab_id': tab_id})

    def count(self) -> int:
        return self.query.count()

    def exists_by_tab_id(self, tab_id: int) -> bool:
        return self.query.exists({'tab_id': tab_id})
