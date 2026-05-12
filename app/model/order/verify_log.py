from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class VerifyLogModel:
    TABLE_NAME = 'tb_order_verify_logs'

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
                qrcode TEXT NOT NULL,
                order_id INTEGER,
                verify_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                verify_by INTEGER,
                device_info TEXT DEFAULT '',
                ip_address TEXT DEFAULT ''
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_qrcode ON {cls.TABLE_NAME}(qrcode)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_order_id ON {cls.TABLE_NAME}(order_id)"
        db.execute(index_sql)

    def create(self, qrcode: str, order_id: int, verify_by: int,
               device_info: str = '', ip_address: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'qrcode': qrcode,
            'order_id': order_id,
            'verify_time': now,
            'verify_by': verify_by,
            'device_info': device_info,
            'ip_address': ip_address
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_order_id(self, order_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'order_id': order_id}, order_by='id DESC')

    def get_by_qrcode(self, qrcode: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'qrcode': qrcode}, order_by='id DESC')

    def get_all(self, page: int = 1, page_size: int = 10, verify_by: int = None) -> Dict[str, Any]:
        conditions = {}
        if verify_by:
            conditions['verify_by'] = verify_by
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')