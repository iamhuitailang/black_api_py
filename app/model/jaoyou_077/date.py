from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class DateModel:
    TABLE_NAME = 'tb_jaoyou_077_model_dates'

    STATUS_PENDING = 0
    STATUS_ACCEPTED = 1
    STATUS_REJECTED = 2
    STATUS_CANCELLED = 3
    STATUS_COMPLETED = 4

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
                from_user_id INTEGER NOT NULL,
                to_user_id INTEGER NOT NULL,
                title TEXT DEFAULT '',
                description TEXT DEFAULT '',
                location TEXT DEFAULT '',
                date_time TIMESTAMP,
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_from_user_id ON {cls.TABLE_NAME}(from_user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_to_user_id ON {cls.TABLE_NAME}(to_user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, from_user_id: int, to_user_id: int, title: str, description: str, location: str, date_time: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'from_user_id': from_user_id,
            'to_user_id': to_user_id,
            'title': title,
            'description': description,
            'location': location,
            'date_time': date_time,
            'status': self.STATUS_PENDING,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update_status(self, record_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_sent_dates(self, user_id: int, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        conditions = {'from_user_id': user_id}
        if status is not None:
            conditions['status'] = status

        result = self.query.paginate(page, page_size, conditions, order_by='id DESC')

        from app.model.jaoyou_077.user import UserModel
        user_model = UserModel()
        items = []
        for item in result.get('items', []):
            to_user = user_model.get_by_id(item.get('to_user_id'))
            if to_user:
                item['to_user'] = user_model.to_public_dict(to_user)
            items.append(item)
        result['items'] = items
        return result

    def get_received_dates(self, user_id: int, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        conditions = {'to_user_id': user_id}
        if status is not None:
            conditions['status'] = status

        result = self.query.paginate(page, page_size, conditions, order_by='id DESC')

        from app.model.jaoyou_077.user import UserModel
        user_model = UserModel()
        items = []
        for item in result.get('items', []):
            from_user = user_model.get_by_id(item.get('from_user_id'))
            if from_user:
                item['from_user'] = user_model.to_public_dict(from_user)
            items.append(item)
        result['items'] = items
        return result

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        result = self.query.paginate(page, page_size, conditions, order_by='id DESC')

        from app.model.jaoyou_077.user import UserModel
        user_model = UserModel()
        items = []
        for item in result.get('items', []):
            from_user = user_model.get_by_id(item.get('from_user_id'))
            to_user = user_model.get_by_id(item.get('to_user_id'))
            item['from_user_nickname'] = from_user.get('nickname', '') if from_user else ''
            item['to_user_nickname'] = to_user.get('nickname', '') if to_user else ''
            items.append(item)
        result['items'] = items
        return result

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_PENDING: '待确认',
            self.STATUS_ACCEPTED: '已接受',
            self.STATUS_REJECTED: '已拒绝',
            self.STATUS_CANCELLED: '已取消',
            self.STATUS_COMPLETED: '已完成'
        }
        return status_map.get(status, '未知')

    def to_public_dict(self, date: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': date.get('id'),
            'from_user_id': date.get('from_user_id'),
            'to_user_id': date.get('to_user_id'),
            'from_user': date.get('from_user'),
            'to_user': date.get('to_user'),
            'from_user_nickname': date.get('from_user_nickname', ''),
            'to_user_nickname': date.get('to_user_nickname', ''),
            'title': date.get('title'),
            'description': date.get('description'),
            'location': date.get('location'),
            'date_time': date.get('date_time'),
            'status': date.get('status'),
            'status_text': self.get_status_text(date.get('status')),
            'created_at': date.get('created_at'),
            'updated_at': date.get('updated_at')
        }

    def count_pending(self, user_id: int) -> int:
        sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE to_user_id = ? AND status = ?"
        result = self.db.fetch_one(sql, (user_id, self.STATUS_PENDING))
        return result.get('total', 0) if result else 0

    def count_dates(self, status: int = None) -> int:
        where_clause = "1=1"
        params = []
        if status is not None:
            where_clause = "status = ?"
            params.append(status)

        sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {where_clause}"
        result = self.db.fetch_one(sql, tuple(params))
        return result.get('total', 0) if result else 0
