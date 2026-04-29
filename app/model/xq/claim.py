from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ClaimModel:
    TABLE_NAME = 'tb_xq_claims'

    STATUS_PENDING = 0
    STATUS_ACCEPTED = 1
    STATUS_REJECTED = 2
    STATUS_COMPLETED = 3

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
                post_id INTEGER NOT NULL,
                helper_id INTEGER NOT NULL,
                comment TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_post_id ON {cls.TABLE_NAME}(post_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_helper_id ON {cls.TABLE_NAME}(helper_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, post_id: int, helper_id: int, comment: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'post_id': post_id,
            'helper_id': helper_id,
            'comment': comment,
            'status': self.STATUS_PENDING,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_post(self, post_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {'post_id': post_id}
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_by_helper(self, helper_id: int, page: int = 1, page_size: int = 10,
                      status: int = None) -> Dict[str, Any]:
        conditions = {'helper_id': helper_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def update_status(self, claim_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(claim_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def has_claimed(self, post_id: int, helper_id: int) -> bool:
        record = self.query.find_one({'post_id': post_id, 'helper_id': helper_id})
        return record is not None

    def get_accepted_by_post(self, post_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'post_id': post_id, 'status': self.STATUS_ACCEPTED})

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_PENDING: '待确认',
            self.STATUS_ACCEPTED: '已接单',
            self.STATUS_REJECTED: '已拒绝',
            self.STATUS_COMPLETED: '已完成'
        }
        return status_map.get(status, '未知')

    def to_dict(self, claim: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': claim.get('id'),
            'post_id': claim.get('post_id'),
            'helper_id': claim.get('helper_id'),
            'comment': claim.get('comment'),
            'status': claim.get('status'),
            'status_text': self.get_status_text(claim.get('status')),
            'created_at': claim.get('created_at'),
            'updated_at': claim.get('updated_at')
        }
