from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ExReportModel:
    TABLE_NAME = 'tb_ex_reports'
    
    STATUS_PENDING = 1
    STATUS_PROCESSING = 2
    STATUS_RESOLVED = 3
    
    STATUS_TEXT = {
        1: '待处理',
        2: '处理中',
        3: '已处理'
    }
    
    TYPE_ITEM = 1
    TYPE_USER = 2
    TYPE_EXCHANGE = 3
    
    TYPE_TEXT = {
        1: '物品举报',
        2: '用户举报',
        3: '交换举报'
    }
    
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
                reporter_id INTEGER NOT NULL,
                report_type INTEGER NOT NULL,
                target_id INTEGER NOT NULL,
                reason TEXT NOT NULL,
                description TEXT DEFAULT '',
                status INTEGER DEFAULT 1,
                handler_id INTEGER,
                handle_note TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                handled_at TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_reporter ON {cls.TABLE_NAME}(reporter_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_target ON {cls.TABLE_NAME}(report_type, target_id)"
        db.execute(index_sql3)

    def create(self, reporter_id: int, report_type: int, target_id: int,
               reason: str, description: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'reporter_id': reporter_id,
            'report_type': report_type,
            'target_id': target_id,
            'reason': reason,
            'description': description,
            'status': self.STATUS_PENDING,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update_status(self, report_id: int, status: int, handler_id: int = None,
                      handle_note: str = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'handled_at': now
        }
        if handler_id is not None:
            data['handler_id'] = handler_id
        if handle_note is not None:
            data['handle_note'] = handle_note
        return self.exec.update_by_id(report_id, data)

    def get_all(self, page: int = 1, page_size: int = 10, conditions: Dict[str, Any] = None) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def to_public_dict(self, report: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': report.get('id'),
            'reporter_id': report.get('reporter_id'),
            'report_type': report.get('report_type'),
            'report_type_text': self.TYPE_TEXT.get(report.get('report_type'), '未知'),
            'target_id': report.get('target_id'),
            'reason': report.get('reason'),
            'description': report.get('description'),
            'status': report.get('status'),
            'status_text': self.STATUS_TEXT.get(report.get('status'), '未知'),
            'handler_id': report.get('handler_id'),
            'handle_note': report.get('handle_note'),
            'created_at': report.get('created_at'),
            'handled_at': report.get('handled_at')
        }
