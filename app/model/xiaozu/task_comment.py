from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TaskCommentModel:
    TABLE_NAME = 'tb_xiaozu_task_comments'

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
                task_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_task_id ON {cls.TABLE_NAME}(task_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql2)

    def create(self, task_id: int, user_id: int, content: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'task_id': task_id,
            'user_id': user_id,
            'content': content,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_task(self, task_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT tc.*, u.username, u.avatar
            FROM {self.TABLE_NAME} tc
            LEFT JOIN tb_xiaozu_users u ON tc.user_id = u.id
            WHERE tc.task_id = ?
            ORDER BY tc.created_at ASC
        """
        return self.db.fetch_all(sql, (task_id,))

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, task_id: int = None) -> Dict[str, Any]:
        conditions = {}
        if task_id:
            conditions['task_id'] = task_id
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')
