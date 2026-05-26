from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TodoProjectModel:
    TABLE_NAME = 'tb_todo_projects'

    STATUS_ACTIVE = 0
    STATUS_ARCHIVED = 1

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
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                color TEXT DEFAULT '#409EFF',
                icon TEXT DEFAULT '',
                sort_order INTEGER DEFAULT 0,
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql2)

    def create(self, user_id: int, name: str, description: str = '',
               color: str = '#409EFF', icon: str = '', sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'name': name,
            'description': description,
            'color': color,
            'icon': icon,
            'sort_order': sort_order,
            'status': self.STATUS_ACTIVE,
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
        return self.query.find_all(conditions, order_by='sort_order ASC, id DESC')

    def get_list(self, user_id: int, page: int = 1, page_size: int = 10,
                  status: int = None, keyword: str = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if status is not None:
            conditions['status'] = status

        if keyword:
            return self.search(user_id, keyword, page, page_size, status)

        return self.query.paginate(page, page_size, conditions, order_by='sort_order ASC, id DESC')

    def search(self, user_id: int, keyword: str, page: int = 1, page_size: int = 10,
               status: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["user_id = ?"]
        params = [user_id]

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        where_clauses.append("(name LIKE ? OR description LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern])

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY sort_order ASC, id DESC 
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

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'color', 'icon', 'sort_order', 'status'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def update_status(self, record_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_ACTIVE: '进行中',
            self.STATUS_ARCHIVED: '已归档'
        }
        return status_map.get(status, '未知')

    def get_progress(self, project_id: int) -> Dict[str, Any]:
        from app.model.todo.task import TodoTaskModel
        task_model = TodoTaskModel()
        tasks = task_model.get_by_project_id(project_id)
        
        total = len(tasks)
        completed = sum(1 for t in tasks if t.get('status') == task_model.STATUS_COMPLETED)
        
        return {
            'total': total,
            'completed': completed,
            'in_progress': sum(1 for t in tasks if t.get('status') == task_model.STATUS_IN_PROGRESS),
            'pending': sum(1 for t in tasks if t.get('status') == task_model.STATUS_PENDING),
            'progress': (completed / total * 100) if total > 0 else 0
        }

    def to_dict(self, project: Dict[str, Any], include_progress: bool = True) -> Dict[str, Any]:
        result = {
            'id': project.get('id'),
            'user_id': project.get('user_id'),
            'name': project.get('name'),
            'description': project.get('description'),
            'color': project.get('color'),
            'icon': project.get('icon'),
            'sort_order': project.get('sort_order'),
            'status': project.get('status'),
            'status_text': self.get_status_text(project.get('status')),
            'created_at': project.get('created_at'),
            'updated_at': project.get('updated_at')
        }
        if include_progress:
            progress = self.get_progress(project.get('id'))
            result.update(progress)
        return result
