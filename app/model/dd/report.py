from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ReportModel:
    TABLE_NAME = 'tb_dd_reports'
    
    STATUS_PENDING = 0
    STATUS_HANDLED = 1
    
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
                task_id INTEGER,
                reporter_id INTEGER NOT NULL,
                reported_id INTEGER NOT NULL,
                reason TEXT NOT NULL,
                status INTEGER DEFAULT 0,
                result TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_task_id ON {cls.TABLE_NAME}(task_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_reporter_id ON {cls.TABLE_NAME}(reporter_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_reported_id ON {cls.TABLE_NAME}(reported_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, reporter_id: int, reported_id: int, reason: str, 
               task_id: int = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'task_id': task_id,
            'reporter_id': reporter_id,
            'reported_id': reported_id,
            'reason': reason,
            'status': self.STATUS_PENDING,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_reporter(self, reporter_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, {'reporter_id': reporter_id}, order_by='created_at DESC')

    def get_by_reported(self, reported_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, {'reported_id': reported_id}, order_by='created_at DESC')

    def get_pending(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, {'status': self.STATUS_PENDING}, order_by='created_at DESC')

    def handle_report(self, report_id: int, result: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_HANDLED,
            'result': result,
            'updated_at': now
        }
        return self.exec.update_by_id(report_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_PENDING: '待处理',
            self.STATUS_HANDLED: '已处理'
        }
        return status_map.get(status, '未知')
