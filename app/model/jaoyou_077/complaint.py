from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ComplaintModel:
    TABLE_NAME = 'tb_jaoyou_077_model_complaints'

    STATUS_PENDING = 0
    STATUS_PROCESSED = 1
    STATUS_REJECTED = 2

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
                reason TEXT DEFAULT '',
                description TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                reply TEXT DEFAULT '',
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

    def create(self, from_user_id: int, to_user_id: int, reason: str, description: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'from_user_id': from_user_id,
            'to_user_id': to_user_id,
            'reason': reason,
            'description': description,
            'status': self.STATUS_PENDING,
            'reply': '',
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_user_complaints(self, user_id: int, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        conditions = {'from_user_id': user_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def update_status(self, record_id: int, status: int, reply: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'reply': reply,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

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
            self.STATUS_PENDING: '待处理',
            self.STATUS_PROCESSED: '已处理',
            self.STATUS_REJECTED: '已驳回'
        }
        return status_map.get(status, '未知')

    def to_public_dict(self, complaint: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': complaint.get('id'),
            'from_user_id': complaint.get('from_user_id'),
            'to_user_id': complaint.get('to_user_id'),
            'from_user_nickname': complaint.get('from_user_nickname', ''),
            'to_user_nickname': complaint.get('to_user_nickname', ''),
            'reason': complaint.get('reason'),
            'description': complaint.get('description'),
            'status': complaint.get('status'),
            'status_text': self.get_status_text(complaint.get('status')),
            'reply': complaint.get('reply'),
            'created_at': complaint.get('created_at'),
            'updated_at': complaint.get('updated_at')
        }

    def count_pending(self) -> int:
        sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE status = ?"
        result = self.db.fetch_one(sql, (self.STATUS_PENDING,))
        return result.get('total', 0) if result else 0
