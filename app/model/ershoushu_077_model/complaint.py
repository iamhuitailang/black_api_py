from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ErshoushuComplaintModel:
    TABLE_NAME = 'tb_ershoushu_077_model_complaint'

    STATUS_PENDING = 0
    STATUS_PROCESSING = 1
    STATUS_RESOLVED = 2

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
                target_user_id INTEGER DEFAULT 0,
                trade_id INTEGER DEFAULT 0,
                reason TEXT NOT NULL,
                description TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                admin_reply TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_target_user_id ON {cls.TABLE_NAME}(target_user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_trade_id ON {cls.TABLE_NAME}(trade_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, user_id: int, target_user_id: int, trade_id: int,
               reason: str, description: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'target_user_id': target_user_id,
            'trade_id': trade_id,
            'reason': reason,
            'description': description,
            'status': self.STATUS_PENDING,
            'admin_reply': '',
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update_status(self, complaint_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(complaint_id, data)

    def update_reply(self, complaint_id: int, admin_reply: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'admin_reply': admin_reply,
            'status': self.STATUS_RESOLVED,
            'updated_at': now
        }
        return self.exec.update_by_id(complaint_id, data)

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, {'user_id': user_id}, order_by='created_at DESC')

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_PENDING: '待处理',
            self.STATUS_PROCESSING: '处理中',
            self.STATUS_RESOLVED: '已解决'
        }
        return status_map.get(status, '未知')

    def to_dict(self, complaint: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': complaint.get('id'),
            'user_id': complaint.get('user_id'),
            'target_user_id': complaint.get('target_user_id'),
            'trade_id': complaint.get('trade_id'),
            'reason': complaint.get('reason'),
            'description': complaint.get('description'),
            'status': complaint.get('status'),
            'status_text': self.get_status_text(complaint.get('status')),
            'admin_reply': complaint.get('admin_reply'),
            'created_at': complaint.get('created_at'),
            'updated_at': complaint.get('updated_at')
        }

    def get_statistics(self) -> Dict[str, Any]:
        sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME}"
        total_result = self.db.fetch_one(sql)
        total = total_result['total'] if total_result else 0

        sql = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME} WHERE status = ?"
        pending_result = self.db.fetch_one(sql, (self.STATUS_PENDING,))
        pending = pending_result['count'] if pending_result else 0

        processing_result = self.db.fetch_one(sql, (self.STATUS_PROCESSING,))
        processing = processing_result['count'] if processing_result else 0

        resolved_result = self.db.fetch_one(sql, (self.STATUS_RESOLVED,))
        resolved = resolved_result['count'] if resolved_result else 0

        return {
            'total': total,
            'pending': pending,
            'processing': processing,
            'resolved': resolved
        }
