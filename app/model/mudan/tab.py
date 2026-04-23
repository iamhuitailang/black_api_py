from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TabModel:
    TABLE_NAME = 'tb_mudan_tab'
    
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
                tab_name TEXT NOT NULL,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_tab_id ON {cls.TABLE_NAME}(tab_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_sort_order ON {cls.TABLE_NAME}(sort_order)"
        db.execute(index_sql2)

    def create(self, tab_id: int, tab_name: str, sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'tab_id': tab_id,
            'tab_name': tab_name,
            'sort_order': sort_order,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_tab_id(self, tab_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'tab_id': tab_id})

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='sort_order ASC, tab_id ASC')

    def update(self, record_id: int, tab_id: int = None, tab_name: str = None, 
               sort_order: int = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        
        if tab_id is not None:
            data['tab_id'] = tab_id
        if tab_name is not None:
            data['tab_name'] = tab_name
        if sort_order is not None:
            data['sort_order'] = sort_order
        
        return self.exec.update_by_id(record_id, data)

    def update_by_tab_id(self, tab_id: int, tab_name: str = None, 
                         sort_order: int = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        
        if tab_name is not None:
            data['tab_name'] = tab_name
        if sort_order is not None:
            data['sort_order'] = sort_order
        
        return self.exec.update(data, conditions={'tab_id': tab_id})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_tab_id(self, tab_id: int) -> int:
        return self.exec.delete(conditions={'tab_id': tab_id})

    def count(self) -> int:
        return self.query.count()

    def exists_by_tab_id(self, tab_id: int) -> bool:
        return self.query.exists({'tab_id': tab_id})
