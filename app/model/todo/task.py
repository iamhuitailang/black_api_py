from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TodoTaskModel:
    TABLE_NAME = 'tb_todo_tasks'

    STATUS_PENDING = 0
    STATUS_IN_PROGRESS = 1
    STATUS_COMPLETED = 2
    STATUS_CANCELLED = 3

    PRIORITY_LOW = 0
    PRIORITY_MEDIUM = 1
    PRIORITY_HIGH = 2
    PRIORITY_URGENT = 3

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
                project_id INTEGER DEFAULT 0,
                title TEXT NOT NULL,
                description TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                priority INTEGER DEFAULT 1,
                tags TEXT DEFAULT '',
                due_date TIMESTAMP,
                completed_at TIMESTAMP,
                estimated_time INTEGER DEFAULT 0,
                actual_time INTEGER DEFAULT 0,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_project_id ON {cls.TABLE_NAME}(project_id)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql3)
        index_sql4 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_priority ON {cls.TABLE_NAME}(priority)"
        db.execute(index_sql4)
        index_sql5 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_due_date ON {cls.TABLE_NAME}(due_date)"
        db.execute(index_sql5)

    def create(self, user_id: int, title: str, description: str = '',
               project_id: int = 0, status: int = 0, priority: int = 1,
               tags: str = '', due_date: str = None, estimated_time: int = 0,
               sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'project_id': project_id,
            'title': title,
            'description': description,
            'status': status,
            'priority': priority,
            'tags': tags,
            'due_date': due_date,
            'completed_at': None,
            'estimated_time': estimated_time,
            'actual_time': 0,
            'sort_order': sort_order,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int, status: int = None) -> List[Dict[str, Any]]:
        conditions = {'user_id': user_id}
        if status is not None:
            conditions['status'] = status
        return self.query.find_all(conditions, order_by='priority DESC, due_date ASC, id DESC')

    def get_by_project_id(self, project_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'project_id': project_id}, order_by='priority DESC, due_date ASC, id DESC')

    def get_list(self, user_id: int, page: int = 1, page_size: int = 10,
                 status: int = None, priority: int = None, project_id: int = None,
                 keyword: str = None, start_date: str = None, end_date: str = None,
                 order_by: str = 'priority DESC, due_date ASC, id DESC') -> Dict[str, Any]:
        if keyword or start_date or end_date:
            return self.search(user_id, keyword, page, page_size, status, priority,
                               project_id, start_date, end_date, order_by)

        conditions = {'user_id': user_id}
        if status is not None:
            conditions['status'] = status
        if priority is not None:
            conditions['priority'] = priority
        if project_id is not None and project_id > 0:
            conditions['project_id'] = project_id

        return self.query.paginate(page, page_size, conditions, order_by=order_by)

    def search(self, user_id: int, keyword: str = None, page: int = 1, page_size: int = 10,
               status: int = None, priority: int = None, project_id: int = None,
               start_date: str = None, end_date: str = None,
               order_by: str = 'priority DESC, due_date ASC, id DESC') -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["user_id = ?"]
        params = [user_id]

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        if priority is not None:
            where_clauses.append("priority = ?")
            params.append(priority)

        if project_id is not None and project_id > 0:
            where_clauses.append("project_id = ?")
            params.append(project_id)

        if start_date:
            where_clauses.append("DATE(due_date) >= DATE(?)")
            params.append(start_date)

        if end_date:
            where_clauses.append("DATE(due_date) <= DATE(?)")
            params.append(end_date)

        if keyword:
            where_clauses.append("(title LIKE ? OR description LIKE ? OR tags LIKE ?)")
            like_pattern = f"%{keyword}%"
            params.extend([like_pattern, like_pattern, like_pattern])

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY {order_by} 
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

    def get_by_date_range(self, user_id: int, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE user_id = ? AND DATE(due_date) >= DATE(?) AND DATE(due_date) <= DATE(?)
            ORDER BY due_date ASC, priority DESC
        """
        return self.db.fetch_all(sql, (user_id, start_date, end_date))

    def get_today_tasks(self, user_id: int) -> List[Dict[str, Any]]:
        today = datetime.now().strftime('%Y-%m-%d')
        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE user_id = ? AND DATE(due_date) = DATE(?) AND status != 2
            ORDER BY priority DESC, due_date ASC
        """
        return self.db.fetch_all(sql, (user_id, today))

    def get_overdue_tasks(self, user_id: int) -> List[Dict[str, Any]]:
        today = datetime.now().strftime('%Y-%m-%d')
        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE user_id = ? AND DATE(due_date) < DATE(?) AND status != 2
            ORDER BY priority DESC, due_date ASC
        """
        return self.db.fetch_all(sql, (user_id, today))

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'title', 'description', 'project_id', 'status', 'priority',
            'tags', 'due_date', 'estimated_time', 'actual_time', 'sort_order'
        ]}
        if 'status' in update_data and update_data['status'] == self.STATUS_COMPLETED:
            update_data['completed_at'] = now
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def update_status(self, record_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        if status == self.STATUS_COMPLETED:
            data['completed_at'] = now
        return self.exec.update_by_id(record_id, data)

    def move_to_project(self, record_id: int, project_id: int) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, {
            'project_id': project_id,
            'updated_at': now
        })

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_project_id(self, project_id: int) -> int:
        return self.exec.execute_raw(
            f"DELETE FROM {self.TABLE_NAME} WHERE project_id = ?",
            (project_id,)
        )

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_PENDING: '待处理',
            self.STATUS_IN_PROGRESS: '进行中',
            self.STATUS_COMPLETED: '已完成',
            self.STATUS_CANCELLED: '已取消'
        }
        return status_map.get(status, '未知')

    def get_priority_text(self, priority: int) -> str:
        priority_map = {
            self.PRIORITY_LOW: '低',
            self.PRIORITY_MEDIUM: '中',
            self.PRIORITY_HIGH: '高',
            self.PRIORITY_URGENT: '紧急'
        }
        return priority_map.get(priority, '未知')

    def get_priority_color(self, priority: int) -> str:
        color_map = {
            self.PRIORITY_LOW: '#909399',
            self.PRIORITY_MEDIUM: '#409EFF',
            self.PRIORITY_HIGH: '#E6A23C',
            self.PRIORITY_URGENT: '#F56C6C'
        }
        return color_map.get(priority, '#909399')

    def get_statistics(self, user_id: int, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        where_clauses = ["user_id = ?"]
        params = [user_id]

        if start_date:
            where_clauses.append("DATE(created_at) >= DATE(?)")
            params.append(start_date)

        if end_date:
            where_clauses.append("DATE(created_at) <= DATE(?)")
            params.append(end_date)

        where_sql = ' AND '.join(where_clauses)

        total_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {where_sql}"
        total_result = self.db.fetch_one(total_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        completed_sql = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME} WHERE {where_sql} AND status = {self.STATUS_COMPLETED}"
        completed_result = self.db.fetch_one(completed_sql, tuple(params))
        completed = completed_result['count'] if completed_result else 0

        in_progress_sql = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME} WHERE {where_sql} AND status = {self.STATUS_IN_PROGRESS}"
        in_progress_result = self.db.fetch_one(in_progress_sql, tuple(params))
        in_progress = in_progress_result['count'] if in_progress_result else 0

        pending_sql = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME} WHERE {where_sql} AND status = {self.STATUS_PENDING}"
        pending_result = self.db.fetch_one(pending_sql, tuple(params))
        pending = pending_result['count'] if pending_result else 0

        overdue_sql = f"""
            SELECT COUNT(*) as count FROM {self.TABLE_NAME} 
            WHERE {where_sql} AND status != {self.STATUS_COMPLETED} 
            AND DATE(due_date) < DATE('{datetime.now().strftime('%Y-%m-%d')}')
        """
        overdue_result = self.db.fetch_one(overdue_sql, tuple(params))
        overdue = overdue_result['count'] if overdue_result else 0

        return {
            'total': total,
            'completed': completed,
            'in_progress': in_progress,
            'pending': pending,
            'overdue': overdue,
            'completion_rate': (completed / total * 100) if total > 0 else 0
        }

    def get_trend_data(self, user_id: int, days: int = 30) -> List[Dict[str, Any]]:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        sql = f"""
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total,
                SUM(CASE WHEN status = {self.STATUS_COMPLETED} THEN 1 ELSE 0 END) as completed
            FROM {self.TABLE_NAME} 
            WHERE user_id = ? AND DATE(created_at) >= DATE(?)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        """
        return self.db.fetch_all(sql, (user_id, start_date.strftime('%Y-%m-%d')))

    def get_tag_distribution(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT 
                tags,
                COUNT(*) as count
            FROM {self.TABLE_NAME} 
            WHERE user_id = ? AND tags != ''
            GROUP BY tags
            ORDER BY count DESC
        """
        return self.db.fetch_all(sql, (user_id,))

    def get_project_distribution(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT 
                project_id,
                COUNT(*) as total,
                SUM(CASE WHEN status = {self.STATUS_COMPLETED} THEN 1 ELSE 0 END) as completed
            FROM {self.TABLE_NAME} 
            WHERE user_id = ?
            GROUP BY project_id
            ORDER BY total DESC
        """
        return self.db.fetch_all(sql, (user_id,))

    def get_calendar_data(self, user_id: int, year: int, month: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT 
                DATE(due_date) as date,
                COUNT(*) as total,
                SUM(CASE WHEN status = {self.STATUS_COMPLETED} THEN 1 ELSE 0 END) as completed
            FROM {self.TABLE_NAME} 
            WHERE user_id = ? AND strftime('%Y', due_date) = ? AND strftime('%m', due_date) = ?
            GROUP BY DATE(due_date)
            ORDER BY date ASC
        """
        return self.db.fetch_all(sql, (user_id, str(year), f'{month:02d}'))

    def get_kanban_data(self, user_id: int, project_id: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if project_id is not None and project_id > 0:
            conditions['project_id'] = project_id

        pending_tasks = self.query.find_all(
            {**conditions, 'status': self.STATUS_PENDING},
            order_by='priority DESC, due_date ASC'
        )
        in_progress_tasks = self.query.find_all(
            {**conditions, 'status': self.STATUS_IN_PROGRESS},
            order_by='priority DESC, due_date ASC'
        )
        completed_tasks = self.query.find_all(
            {**conditions, 'status': self.STATUS_COMPLETED},
            order_by='updated_at DESC'
        )

        return {
            'pending': [self.to_dict(t) for t in pending_tasks],
            'in_progress': [self.to_dict(t) for t in in_progress_tasks],
            'completed': [self.to_dict(t) for t in completed_tasks]
        }

    def to_dict(self, task: Dict[str, Any], include_reminders: bool = False) -> Dict[str, Any]:
        result = {
            'id': task.get('id'),
            'user_id': task.get('user_id'),
            'project_id': task.get('project_id'),
            'title': task.get('title'),
            'description': task.get('description'),
            'status': task.get('status'),
            'status_text': self.get_status_text(task.get('status')),
            'priority': task.get('priority'),
            'priority_text': self.get_priority_text(task.get('priority')),
            'priority_color': self.get_priority_color(task.get('priority')),
            'tags': task.get('tags', '').split(',') if task.get('tags') else [],
            'due_date': task.get('due_date'),
            'completed_at': task.get('completed_at'),
            'estimated_time': task.get('estimated_time'),
            'actual_time': task.get('actual_time'),
            'sort_order': task.get('sort_order'),
            'created_at': task.get('created_at'),
            'updated_at': task.get('updated_at')
        }
        if include_reminders:
            from app.model.todo.reminder import TodoReminderModel
            reminder_model = TodoReminderModel()
            reminders = reminder_model.get_by_task_id(task.get('id'))
            result['reminders'] = [reminder_model.to_dict(r) for r in reminders]
        return result
