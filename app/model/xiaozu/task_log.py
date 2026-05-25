from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TaskLogModel:
    TABLE_NAME = 'tb_xiaozu_task_logs'

    ACTION_CREATE = 'create'
    ACTION_UPDATE = 'update'
    ACTION_STATUS_CHANGE = 'status_change'
    ACTION_ASSIGN = 'assign'
    ACTION_DELETE = 'delete'
    ACTION_COMMENT = 'comment'

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
                action TEXT NOT NULL,
                old_value TEXT DEFAULT '',
                new_value TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_task_id ON {cls.TABLE_NAME}(task_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql2)

    def create(self, task_id: int, user_id: int, action: str,
               old_value: str = '', new_value: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'task_id': task_id,
            'user_id': user_id,
            'action': action,
            'old_value': old_value or '',
            'new_value': new_value or '',
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_task(self, task_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT tl.*, u.username, u.avatar
            FROM {self.TABLE_NAME} tl
            LEFT JOIN tb_xiaozu_users u ON tl.user_id = u.id
            WHERE tl.task_id = ?
            ORDER BY tl.created_at DESC
        """
        return self.db.fetch_all(sql, (task_id,))

    def get_by_team_recent(self, team_id: int, limit: int = 20) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT tl.*, u.username, u.avatar, t.title as task_title
            FROM {self.TABLE_NAME} tl
            LEFT JOIN tb_xiaozu_users u ON tl.user_id = u.id
            LEFT JOIN tb_xiaozu_tasks t ON tl.task_id = t.id
            WHERE t.team_id = ?
            ORDER BY tl.created_at DESC
            LIMIT {limit}
        """
        return self.db.fetch_all(sql, (team_id,))

    def get_all(self, page: int = 1, page_size: int = 10, task_id: int = None) -> Dict[str, Any]:
        conditions = {}
        if task_id:
            conditions['task_id'] = task_id
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')
