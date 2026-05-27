from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class FeedbackModel:
    TABLE_NAME = 'tb_tousu_model_feedback'

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
                complaint_id INTEGER NOT NULL,
                handler_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                status TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_complaint_id ON {cls.TABLE_NAME}(complaint_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_handler_id ON {cls.TABLE_NAME}(handler_id)"
        db.execute(index_sql)

    def create(self, complaint_id: int, handler_id: int, content: str, status: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'complaint_id': complaint_id,
            'handler_id': handler_id,
            'content': content,
            'status': status,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_complaint(self, complaint_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'complaint_id': complaint_id}, order_by='created_at DESC')

    def get_by_handler(self, handler_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {'handler_id': handler_id}
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_dict(self, feedback: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': feedback.get('id'),
            'complaint_id': feedback.get('complaint_id'),
            'handler_id': feedback.get('handler_id'),
            'content': feedback.get('content'),
            'status': feedback.get('status'),
            'created_at': feedback.get('created_at')
        }