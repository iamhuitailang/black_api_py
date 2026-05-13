from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CheckinLogModel:
    TABLE_NAME = 'tb_bm_checkin_logs'

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
                registration_id INTEGER NOT NULL,
                qrcode TEXT NOT NULL,
                operator_id INTEGER,
                operator_name TEXT DEFAULT '',
                device_info TEXT DEFAULT '',
                ip_address TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_registration_id ON {cls.TABLE_NAME}(registration_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_qrcode ON {cls.TABLE_NAME}(qrcode)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql)

    def create(self, registration_id: int, qrcode: str, operator_id: int = None,
               operator_name: str = '', device_info: str = '', ip_address: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'registration_id': registration_id,
            'qrcode': qrcode,
            'operator_id': operator_id,
            'operator_name': operator_name,
            'device_info': device_info,
            'ip_address': ip_address,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_registration(self, registration_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {'registration_id': registration_id}
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_all(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='id DESC')

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_dict(self, log: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': log.get('id'),
            'registration_id': log.get('registration_id'),
            'qrcode': log.get('qrcode'),
            'operator_id': log.get('operator_id'),
            'operator_name': log.get('operator_name'),
            'device_info': log.get('device_info'),
            'ip_address': log.get('ip_address'),
            'created_at': log.get('created_at')
        }
