from datetime import datetime
from typing import Dict, Any, List, Optional
from enum import Enum
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class OperationType(Enum):
    PURCHASE = 'purchase'
    SALE = 'sale'
    UPDATE = 'update'
    DELETE = 'delete'
    CREATE = 'create'


class OperationLogModel:
    TABLE_NAME = 'tb_ims_operation_log'

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
                operation_type TEXT NOT NULL,
                module TEXT NOT NULL,
                record_id INTEGER DEFAULT 0,
                title TEXT DEFAULT '',
                detail TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_type = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(operation_type)"
        db.execute(index_type)

        index_module = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_module ON {cls.TABLE_NAME}(module)"
        db.execute(index_module)

        index_time = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_time ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_time)

    def create(self, operation_type: str, module: str, record_id: int = 0,
               title: str = '', detail: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'operation_type': operation_type,
            'module': module,
            'record_id': record_id,
            'title': title,
            'detail': detail,
            'created_at': now
        }
        return self.exec.insert(data)

    def log_purchase(self, title: str, detail: str = '', record_id: int = 0) -> int:
        return self.create('purchase', 'inventory', record_id, title, detail)

    def log_sale(self, title: str, detail: str = '', record_id: int = 0) -> int:
        return self.create('sale', 'inventory', record_id, title, detail)

    def log_create(self, module: str, title: str, detail: str = '', record_id: int = 0) -> int:
        return self.create('create', module, record_id, title, detail)

    def log_update(self, module: str, title: str, detail: str = '', record_id: int = 0) -> int:
        return self.create('update', module, record_id, title, detail)

    def log_delete(self, module: str, title: str, detail: str = '', record_id: int = 0) -> int:
        return self.create('delete', module, record_id, title, detail)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='created_at DESC, id DESC')

    def get_by_type(self, operation_type: str) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'operation_type': operation_type},
            order_by='created_at DESC, id DESC'
        )

    def get_by_module(self, module: str) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'module': module},
            order_by='created_at DESC, id DESC'
        )

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()

    def clear_all(self) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME}"
        return self.exec.execute_raw(sql)

    def paginate(self, page: int = 1, page_size: int = 10,
                 operation_type: str = None, module: str = None,
                 start_date: str = None, end_date: str = None,
                 keyword: str = None) -> Dict[str, Any]:
        conditions = []
        params = []

        if operation_type:
            conditions.append("operation_type = ?")
            params.append(operation_type)
        if module:
            conditions.append("module = ?")
            params.append(module)
        if start_date:
            conditions.append("date(created_at) >= ?")
            params.append(start_date)
        if end_date:
            conditions.append("date(created_at) <= ?")
            params.append(end_date)
        if keyword:
            conditions.append("(title LIKE ? OR detail LIKE ?)")
            keyword_param = f"%{keyword}%"
            params.extend([keyword_param, keyword_param])

        where_clause = " AND ".join(conditions) if conditions else "1=1"

        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {where_clause}
            ORDER BY created_at DESC, id DESC
            LIMIT {page_size} OFFSET {(page - 1) * page_size}
        """
        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {where_clause}"

        total = self.db.fetch_one(count_sql, tuple(params) if params else None)
        total_count = total['total'] if total else 0
        items = self.db.fetch_all(sql, tuple(params) if params else None)

        return {
            'items': items,
            'total': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size
        }
