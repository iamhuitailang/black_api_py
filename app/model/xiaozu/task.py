from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TaskModel:
    TABLE_NAME = 'tb_xiaozu_tasks'

    PRIORITY_HIGH = 'high'
    PRIORITY_MEDIUM = 'medium'
    PRIORITY_LOW = 'low'

    STATUS_TODO = 'todo'
    STATUS_IN_PROGRESS = 'in_progress'
    STATUS_DONE = 'done'
    STATUS_OVERDUE = 'overdue'

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
                team_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT DEFAULT '',
                priority TEXT DEFAULT 'medium',
                status TEXT DEFAULT 'todo',
                assignee_id INTEGER,
                estimated_hours DECIMAL(5,1) DEFAULT 0,
                actual_hours DECIMAL(5,1) DEFAULT 0,
                start_date DATE,
                due_date DATE,
                completed_at TIMESTAMP,
                created_by INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_team_id ON {cls.TABLE_NAME}(team_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_assignee_id ON {cls.TABLE_NAME}(assignee_id)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql3)
        index_sql4 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_priority ON {cls.TABLE_NAME}(priority)"
        db.execute(index_sql4)

    def create(self, team_id: int, title: str, description: str, priority: str,
               assignee_id: int, estimated_hours: float, start_date: str,
               due_date: str, created_by: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'team_id': team_id,
            'title': title,
            'description': description or '',
            'priority': priority or self.PRIORITY_MEDIUM,
            'status': self.STATUS_TODO,
            'assignee_id': assignee_id or None,
            'estimated_hours': estimated_hours or 0,
            'actual_hours': 0,
            'start_date': start_date or None,
            'due_date': due_date or None,
            'completed_at': None,
            'created_by': created_by,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_team(self, team_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'team_id': team_id}, order_by='id DESC')

    def get_by_assignee(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'assignee_id': user_id}, order_by='id DESC')

    def update(self, task_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'title', 'description', 'priority', 'status', 'assignee_id',
            'estimated_hours', 'actual_hours', 'start_date', 'due_date', 'completed_at'
        ]}
        return self.exec.update_by_id(task_id, update_data)

    def update_status(self, task_id: int, status: str) -> int:
        data = {'status': status}
        if status == self.STATUS_DONE:
            data['completed_at'] = datetime.now().isoformat()
        return self.exec.update_by_id(task_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_kanban_data(self, team_id: int) -> Dict[str, List[Dict[str, Any]]]:
        result = {}
        for status in [self.STATUS_TODO, self.STATUS_IN_PROGRESS, self.STATUS_DONE]:
            tasks = self.query.find_all(
                {'team_id': team_id, 'status': status},
                order_by='priority DESC, id DESC'
            )
            result[status] = tasks
        return result

    def get_all(self, page: int = 1, page_size: int = 10, team_id: int = None,
                status: str = None, priority: str = None, assignee_id: int = None,
                keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if team_id:
            conditions['team_id'] = team_id
        if status:
            conditions['status'] = status
        if priority:
            conditions['priority'] = priority
        if assignee_id:
            conditions['assignee_id'] = assignee_id

        if keyword:
            return self.search(keyword, page, page_size, team_id, status, priority, assignee_id)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               team_id: int = None, status: str = None, priority: str = None,
               assignee_id: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["(title LIKE ? OR description LIKE ?)"]
        like_pattern = f"%{keyword}%"
        params = [like_pattern, like_pattern]

        if team_id:
            where_clauses.append("team_id = ?")
            params.append(team_id)
        if status:
            where_clauses.append("status = ?")
            params.append(status)
        if priority:
            where_clauses.append("priority = ?")
            params.append(priority)
        if assignee_id:
            where_clauses.append("assignee_id = ?")
            params.append(assignee_id)

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE {' AND '.join(where_clauses)}
            ORDER BY id DESC
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, tuple(params))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_statistics(self, team_id: int) -> Dict[str, Any]:
        stats = {}
        stats['total'] = self.query.count({'team_id': team_id})
        stats['todo'] = self.query.count({'team_id': team_id, 'status': self.STATUS_TODO})
        stats['in_progress'] = self.query.count({'team_id': team_id, 'status': self.STATUS_IN_PROGRESS})
        stats['done'] = self.query.count({'team_id': team_id, 'status': self.STATUS_DONE})

        today = datetime.now().date().isoformat()
        due_soon_sql = f"""
            SELECT COUNT(*) as total FROM {self.TABLE_NAME}
            WHERE team_id = ? AND status != 'done' AND due_date IS NOT NULL AND due_date <= date('now', '+3 days')
        """
        result = self.db.fetch_one(due_soon_sql, (team_id,))
        stats['due_soon'] = result['total'] if result else 0

        priority_sql = f"""
            SELECT priority, COUNT(*) as count FROM {self.TABLE_NAME}
            WHERE team_id = ? AND status != 'done' GROUP BY priority
        """
        priority_result = self.db.fetch_all(priority_sql, (team_id,))
        stats['priority_distribution'] = {r['priority']: r['count'] for r in priority_result}

        return stats

    def get_upcoming_due(self, team_id: int, days: int = 3) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE team_id = ? AND status != 'done' AND due_date IS NOT NULL
              AND due_date <= date('now', '+' || ? || ' days')
            ORDER BY due_date ASC
        """
        return self.db.fetch_all(sql, (team_id, days))
