from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GroupBuyStatus:
    ACTIVE = 'active'
    CLOSED = 'closed'


class GroupBuyModel:
    TABLE_NAME = 'tb_group_buys'

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
                title TEXT NOT NULL,
                spec TEXT DEFAULT '',
                price REAL NOT NULL DEFAULT 0.0,
                description TEXT DEFAULT '',
                image_url TEXT DEFAULT '',
                deadline TIMESTAMP NOT NULL,
                status TEXT DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_deadline ON {cls.TABLE_NAME}(deadline)"
        db.execute(index_sql2)

    def create(self, title: str, spec: str = '', price: float = 0.0,
               description: str = '', image_url: str = '',
               deadline: str = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'title': title,
            'spec': spec,
            'price': price,
            'description': description,
            'image_url': image_url,
            'deadline': deadline or now,
            'status': GroupBuyStatus.ACTIVE,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self, order_by: str = 'created_at DESC') -> List[Dict[str, Any]]:
        return self.query.find_all(order_by=order_by)

    def get_active_list(self) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'status': GroupBuyStatus.ACTIVE},
            order_by='created_at DESC'
        )

    def update(self, record_id: int, title: str = None, spec: str = None,
               price: float = None, description: str = None,
               image_url: str = None, deadline: str = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}

        if title is not None:
            data['title'] = title
        if spec is not None:
            data['spec'] = spec
        if price is not None:
            data['price'] = price
        if description is not None:
            data['description'] = description
        if image_url is not None:
            data['image_url'] = image_url
        if deadline is not None:
            data['deadline'] = deadline

        return self.exec.update_by_id(record_id, data)

    def close(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': GroupBuyStatus.CLOSED,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()
