from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import random
import string


class KuaidiPickupCodeModel:
    TABLE_NAME = 'tb_kuaidi_077_model_pickup_code'

    STATUS_UNUSED = 0
    STATUS_USED = 1
    STATUS_EXPIRED = 2

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
                user_id INTEGER NOT NULL,
                code TEXT NOT NULL UNIQUE,
                status INTEGER DEFAULT 0,
                expires_at TIMESTAMP NOT NULL,
                used_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_package_id ON {cls.TABLE_NAME}(package_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_code ON {cls.TABLE_NAME}(code)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def _generate_code(self) -> str:
        while True:
            code = ''.join(random.choices(string.digits, k=6))
            existing = self.query.find_one({'code': code})
            if not existing:
                return code

    def create(self, package_id: int, user_id: int, hours: int = 24) -> str:
        code = self._generate_code()
        expires_at = (datetime.now() + timedelta(hours=hours)).isoformat()
        data = {
            'package_id': package_id,
            'user_id': user_id,
            'code': code,
            'status': self.STATUS_UNUSED,
            'expires_at': expires_at,
            'created_at': datetime.now().isoformat()
        }
        self.exec.insert(data)
        return code

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'code': code})

    def get_by_package_id(self, package_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'package_id': package_id}, order_by='id DESC')

    def get_by_user_id(self, user_id: int, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def use_code(self, code_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_USED,
            'used_at': now
        }
        return self.exec.update_by_id(code_id, data)

    def expire_code(self, code_id: int) -> int:
        data = {
            'status': self.STATUS_EXPIRED
        }
        return self.exec.update_by_id(code_id, data)

    def cleanup_expired(self) -> int:
        sql = f"""
            UPDATE {self.TABLE_NAME}
            SET status = ?
            WHERE status = ? AND expires_at < ?
        """
        cursor = self.db.execute(sql, (self.STATUS_EXPIRED, self.STATUS_UNUSED, datetime.now().isoformat()))
        return cursor.rowcount

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None,
                user_id: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        if user_id is not None:
            conditions['user_id'] = user_id
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_UNUSED: '未使用',
            self.STATUS_USED: '已使用',
            self.STATUS_EXPIRED: '已过期'
        }
        return status_map.get(status, '未知')

    def to_dict(self, pickup_code: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': pickup_code.get('id'),
            'package_id': pickup_code.get('package_id'),
            'user_id': pickup_code.get('user_id'),
            'code': pickup_code.get('code'),
            'status': pickup_code.get('status'),
            'status_text': self.get_status_text(pickup_code.get('status')),
            'expires_at': pickup_code.get('expires_at'),
            'used_at': pickup_code.get('used_at'),
            'created_at': pickup_code.get('created_at')
        }
