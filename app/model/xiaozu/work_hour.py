from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class WorkHourModel:
    TABLE_NAME = 'tb_xiaozu_work_hours'

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
                hours DECIMAL(4,1) NOT NULL,
                date DATE NOT NULL,
                description TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_task_id ON {cls.TABLE_NAME}(task_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql2)

    def create(self, task_id: int, user_id: int, hours: float,
               date: str, description: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'task_id': task_id,
            'user_id': user_id,
            'hours': hours,
            'date': date,
            'description': description or '',
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_task(self, task_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT wh.*, u.username
            FROM {self.TABLE_NAME} wh
            LEFT JOIN tb_xiaozu_users u ON wh.user_id = u.id
            WHERE wh.task_id = ?
            ORDER BY wh.date DESC
        """
        return self.db.fetch_all(sql, (task_id,))

    def get_by_user(self, user_id: int, team_id: int = None) -> List[Dict[str, Any]]:
        if team_id:
            sql = f"""
                SELECT wh.*, t.title as task_title
                FROM {self.TABLE_NAME} wh
                LEFT JOIN tb_xiaozu_tasks t ON wh.task_id = t.id
                WHERE wh.user_id = ? AND t.team_id = ?
                ORDER BY wh.date DESC
            """
            return self.db.fetch_all(sql, (user_id, team_id))
        else:
            sql = f"""
                SELECT wh.*, t.title as task_title
                FROM {self.TABLE_NAME} wh
                LEFT JOIN tb_xiaozu_tasks t ON wh.task_id = t.id
                WHERE wh.user_id = ?
                ORDER BY wh.date DESC
            """
            return self.db.fetch_all(sql, (user_id,))

    def get_team_work_hours_summary(self, team_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT wh.user_id, u.username, SUM(wh.hours) as total_hours, COUNT(*) as log_count
            FROM {self.TABLE_NAME} wh
            LEFT JOIN tb_xiaozu_tasks t ON wh.task_id = t.id
            LEFT JOIN tb_xiaozu_users u ON wh.user_id = u.id
            WHERE t.team_id = ?
            GROUP BY wh.user_id
            ORDER BY total_hours DESC
        """
        return self.db.fetch_all(sql, (team_id,))

    def get_daily_completion(self, team_id: int, days: int = 7) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT date, COUNT(*) as count FROM (
                SELECT date(completed_at) as date
                FROM tb_xiaozu_tasks
                WHERE team_id = ? AND status = 'done' AND completed_at >= date('now', '-' || ? || ' days')
            )
            GROUP BY date ORDER BY date ASC
        """
        return self.db.fetch_all(sql, (team_id, days))

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, task_id: int = None,
                user_id: int = None) -> Dict[str, Any]:
        conditions = {}
        if task_id:
            conditions['task_id'] = task_id
        if user_id:
            conditions['user_id'] = user_id
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')
