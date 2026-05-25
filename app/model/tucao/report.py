from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ReportModel:
    TABLE_NAME = 'tb_tucao_reports'

    TYPE_POST = 'post'
    TYPE_REPLY = 'reply'

    STATUS_PENDING = 0
    STATUS_RESOLVED = 1
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
                target_id INTEGER NOT NULL,
                target_type TEXT NOT NULL,
                report_type TEXT NOT NULL,
                description TEXT DEFAULT '',
                user_id INTEGER DEFAULT 0,
                ip_address TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_target ON {cls.TABLE_NAME}(target_id, target_type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql)

    def create(self, target_id: int, target_type: str, report_type: str,
               description: str = '', user_id: int = 0,
               ip_address: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'target_id': target_id,
            'target_type': target_type,
            'report_type': report_type,
            'description': description,
            'user_id': user_id,
            'ip_address': ip_address,
            'status': self.STATUS_PENDING,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update_status(self, report_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(report_id, data)

    def get_list(self, page: int = 1, page_size: int = 10,
                 status: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_PENDING: '待处理',
            self.STATUS_RESOLVED: '已处理',
            self.STATUS_REJECTED: '已驳回'
        }
        return status_map.get(status, '未知')

    def to_dict(self, report: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': report.get('id'),
            'target_id': report.get('target_id'),
            'target_type': report.get('target_type'),
            'report_type': report.get('report_type'),
            'description': report.get('description'),
            'user_id': report.get('user_id'),
            'status': report.get('status'),
            'status_text': self.get_status_text(report.get('status')),
            'created_at': report.get('created_at'),
            'updated_at': report.get('updated_at')
        }
