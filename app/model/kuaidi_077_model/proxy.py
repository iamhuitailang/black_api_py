from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class KuaidiProxyModel:
    TABLE_NAME = 'tb_kuaidi_077_model_proxy'

    STATUS_PENDING = 0
    STATUS_ACCEPTED = 1
    STATUS_COMPLETED = 2
    STATUS_REJECTED = 3
    STATUS_CANCELLED = 4

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
                package_id INTEGER NOT NULL,
                requester_id INTEGER NOT NULL,
                proxy_user_id INTEGER DEFAULT 0,
                status INTEGER DEFAULT 0,
                remark TEXT DEFAULT '',
                accepted_at TIMESTAMP,
                completed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_package_id ON {cls.TABLE_NAME}(package_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_requester_id ON {cls.TABLE_NAME}(requester_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_proxy_user_id ON {cls.TABLE_NAME}(proxy_user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, package_id: int, requester_id: int, remark: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'package_id': package_id,
            'requester_id': requester_id,
            'proxy_user_id': 0,
            'status': self.STATUS_PENDING,
            'remark': remark,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_package_id(self, package_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'package_id': package_id}, order_by='id DESC')

    def get_by_requester_id(self, requester_id: int, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        conditions = {'requester_id': requester_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_by_proxy_user_id(self, proxy_user_id: int, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        conditions = {'proxy_user_id': proxy_user_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def accept(self, proxy_id: int, proxy_user_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_ACCEPTED,
            'proxy_user_id': proxy_user_id,
            'accepted_at': now,
            'updated_at': now
        }
        return self.exec.update_by_id(proxy_id, data)

    def complete(self, proxy_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_COMPLETED,
            'completed_at': now,
            'updated_at': now
        }
        return self.exec.update_by_id(proxy_id, data)

    def reject(self, proxy_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_REJECTED,
            'updated_at': now
        }
        return self.exec.update_by_id(proxy_id, data)

    def cancel(self, proxy_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_CANCELLED,
            'updated_at': now
        }
        return self.exec.update_by_id(proxy_id, data)

    def update_status(self, proxy_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(proxy_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None,
                requester_id: int = None, proxy_user_id: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        if requester_id is not None:
            conditions['requester_id'] = requester_id
        if proxy_user_id is not None:
            conditions['proxy_user_id'] = proxy_user_id
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_pending_list(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, {'status': self.STATUS_PENDING}, order_by='id DESC')

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_PENDING: '待接单',
            self.STATUS_ACCEPTED: '已接单',
            self.STATUS_COMPLETED: '已完成',
            self.STATUS_REJECTED: '已拒绝',
            self.STATUS_CANCELLED: '已取消'
        }
        return status_map.get(status, '未知')

    def to_dict(self, proxy: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': proxy.get('id'),
            'package_id': proxy.get('package_id'),
            'requester_id': proxy.get('requester_id'),
            'proxy_user_id': proxy.get('proxy_user_id'),
            'status': proxy.get('status'),
            'status_text': self.get_status_text(proxy.get('status')),
            'remark': proxy.get('remark'),
            'accepted_at': proxy.get('accepted_at'),
            'completed_at': proxy.get('completed_at'),
            'created_at': proxy.get('created_at'),
            'updated_at': proxy.get('updated_at')
        }
