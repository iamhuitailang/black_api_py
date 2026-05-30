from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ReportModel:
    TABLE_NAME = 'tb_biaoqing_model_reports'

    TYPE_EMOJI = 1
    TYPE_COMMENT = 2
    TYPE_USER = 3

    STATUS_PENDING = 0
    STATUS_PROCESSING = 1
    STATUS_RESOLVED = 2
    STATUS_REJECTED = 3

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
                type INTEGER DEFAULT 1,
                target_id INTEGER NOT NULL,
                reason TEXT NOT NULL,
                description TEXT DEFAULT '',
                images TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                handle_result TEXT DEFAULT '',
                handled_by INTEGER DEFAULT 0,
                handled_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_target ON {cls.TABLE_NAME}(type, target_id)"
        db.execute(index_sql)

    def create(self, user_id: int, type: int, target_id: int, reason: str,
               description: str = '', images: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'type': type,
            'target_id': target_id,
            'reason': reason,
            'description': description,
            'images': images,
            'status': self.STATUS_PENDING,
            'handle_result': '',
            'handled_by': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update_status(self, record_id: int, status: int, handle_result: str = '', handled_by: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'handle_result': handle_result,
            'handled_by': handled_by,
            'handled_at': now,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def get_all(self, page: int = 1, page_size: int = 20, status: int = None, type: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        if type is not None:
            conditions['type'] = type
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_user_reports(self, user_id: int, page: int = 1, page_size: int = 20, status: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_type_text(self, type: int) -> str:
        type_map = {
            self.TYPE_EMOJI: '举报表情包',
            self.TYPE_COMMENT: '举报评论',
            self.TYPE_USER: '举报用户'
        }
        return type_map.get(type, '未知')

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_PENDING: '待处理',
            self.STATUS_PROCESSING: '处理中',
            self.STATUS_RESOLVED: '已解决',
            self.STATUS_REJECTED: '已驳回'
        }
        return status_map.get(status, '未知')

    def to_dict(self, report: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': report.get('id'),
            'user_id': report.get('user_id'),
            'type': report.get('type'),
            'type_text': self.get_type_text(report.get('type')),
            'target_id': report.get('target_id'),
            'reason': report.get('reason'),
            'description': report.get('description'),
            'images': report.get('images'),
            'status': report.get('status'),
            'status_text': self.get_status_text(report.get('status')),
            'handle_result': report.get('handle_result'),
            'handled_by': report.get('handled_by'),
            'handled_at': report.get('handled_at'),
            'created_at': report.get('created_at')
        }
