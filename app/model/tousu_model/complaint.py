from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ComplaintModel:
    TABLE_NAME = 'tb_tousu_model_complaints'

    TYPE_COMPLAINT = 'complaint'
    TYPE_SUGGESTION = 'suggestion'

    STATUS_PENDING = 0
    STATUS_ACCEPTED = 1
    STATUS_PROCESSING = 2
    STATUS_COMPLETED = 3
    STATUS_CANCELLED = 4
    STATUS_REJECTED = 5

    PRIORITY_LOW = 1
    PRIORITY_MEDIUM = 2
    PRIORITY_HIGH = 3
    PRIORITY_URGENT = 4

    IS_ANONYMOUS_YES = 1
    IS_ANONYMOUS_NO = 0

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
                type TEXT NOT NULL,
                category_id INTEGER DEFAULT 0,
                department_id INTEGER DEFAULT 0,
                title TEXT NOT NULL,
                content TEXT DEFAULT '',
                priority INTEGER DEFAULT 1,
                status INTEGER DEFAULT 0,
                is_anonymous INTEGER DEFAULT 0,
                handler_id INTEGER DEFAULT 0,
                handle_result TEXT DEFAULT '',
                expected_time TIMESTAMP,
                completed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category_id ON {cls.TABLE_NAME}(category_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_department_id ON {cls.TABLE_NAME}(department_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_priority ON {cls.TABLE_NAME}(priority)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_handler_id ON {cls.TABLE_NAME}(handler_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql)

    def create(self, user_id: int, complaint_type: str, category_id: int, department_id: int,
               title: str, content: str, priority: int = 1, is_anonymous: int = 0,
               expected_time: str = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'type': complaint_type,
            'category_id': category_id,
            'department_id': department_id,
            'title': title,
            'content': content,
            'priority': priority,
            'status': self.STATUS_PENDING,
            'is_anonymous': is_anonymous,
            'handler_id': 0,
            'handle_result': '',
            'expected_time': expected_time,
            'completed_at': None,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update_status(self, complaint_id: int, status: int, handler_id: int = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        if handler_id is not None:
            data['handler_id'] = handler_id
        if status == self.STATUS_COMPLETED:
            data['completed_at'] = now
        return self.exec.update_by_id(complaint_id, data)

    def update_handle_result(self, complaint_id: int, handle_result: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'handle_result': handle_result,
            'updated_at': now
        }
        return self.exec.update_by_id(complaint_id, data)

    def update(self, complaint_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'category_id', 'department_id', 'title', 'content', 'priority', 'is_anonymous', 'expected_time'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(complaint_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10,
                    complaint_type: str = None, status: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if complaint_type:
            conditions['type'] = complaint_type
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_by_department(self, department_id: int, page: int = 1, page_size: int = 10,
                          status: int = None, complaint_type: str = None) -> Dict[str, Any]:
        conditions = {'department_id': department_id}
        if status is not None:
            conditions['status'] = status
        if complaint_type:
            conditions['type'] = complaint_type
        return self.query.paginate(page, page_size, conditions, order_by='priority DESC, created_at DESC')

    def get_by_handler(self, handler_id: int, page: int = 1, page_size: int = 10,
                       status: int = None) -> Dict[str, Any]:
        conditions = {'handler_id': handler_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_list(self, page: int = 1, page_size: int = 10,
                 complaint_type: str = None, category_id: int = None,
                 department_id: int = None, status: int = None,
                 priority: int = None, keyword: str = None,
                 order_by: str = 'created_at DESC') -> Dict[str, Any]:
        conditions = {}
        if complaint_type:
            conditions['type'] = complaint_type
        if category_id:
            conditions['category_id'] = category_id
        if department_id:
            conditions['department_id'] = department_id
        if status is not None:
            conditions['status'] = status
        if priority:
            conditions['priority'] = priority

        if keyword:
            return self.search(keyword, page, page_size, complaint_type, category_id, department_id, status, priority, order_by)

        return self.query.paginate(page, page_size, conditions, order_by=order_by)

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               complaint_type: str = None, category_id: int = None,
               department_id: int = None, status: int = None,
               priority: int = None, order_by: str = 'created_at DESC') -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if complaint_type:
            where_clauses.append("type = ?")
            params.append(complaint_type)

        if category_id:
            where_clauses.append("category_id = ?")
            params.append(category_id)

        if department_id:
            where_clauses.append("department_id = ?")
            params.append(department_id)

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        if priority:
            where_clauses.append("priority = ?")
            params.append(priority)

        where_clauses.append("(title LIKE ? OR content LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern])

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

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_PENDING: '待处理',
            self.STATUS_ACCEPTED: '已受理',
            self.STATUS_PROCESSING: '处理中',
            self.STATUS_COMPLETED: '已完成',
            self.STATUS_CANCELLED: '已撤回',
            self.STATUS_REJECTED: '已驳回'
        }
        return status_map.get(status, '未知')

    def get_type_text(self, complaint_type: str) -> str:
        type_map = {
            self.TYPE_COMPLAINT: '投诉',
            self.TYPE_SUGGESTION: '建议'
        }
        return type_map.get(complaint_type, '未知')

    def get_priority_text(self, priority: int) -> str:
        priority_map = {
            self.PRIORITY_LOW: '低',
            self.PRIORITY_MEDIUM: '中',
            self.PRIORITY_HIGH: '高',
            self.PRIORITY_URGENT: '紧急'
        }
        return priority_map.get(priority, '未知')

    def to_dict(self, complaint: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': complaint.get('id'),
            'user_id': complaint.get('user_id'),
            'type': complaint.get('type'),
            'type_text': self.get_type_text(complaint.get('type')),
            'category_id': complaint.get('category_id'),
            'department_id': complaint.get('department_id'),
            'title': complaint.get('title'),
            'content': complaint.get('content'),
            'priority': complaint.get('priority'),
            'priority_text': self.get_priority_text(complaint.get('priority')),
            'status': complaint.get('status'),
            'status_text': self.get_status_text(complaint.get('status')),
            'is_anonymous': complaint.get('is_anonymous'),
            'handler_id': complaint.get('handler_id'),
            'handle_result': complaint.get('handle_result'),
            'expected_time': complaint.get('expected_time'),
            'completed_at': complaint.get('completed_at'),
            'created_at': complaint.get('created_at'),
            'updated_at': complaint.get('updated_at')
        }

    def get_statistics(self) -> Dict[str, Any]:
        sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME}"
        total_result = self.db.fetch_one(sql)
        total = total_result['total'] if total_result else 0

        sql = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME} WHERE status = ?"
        pending_result = self.db.fetch_one(sql, (self.STATUS_PENDING,))
        pending = pending_result['count'] if pending_result else 0

        sql = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME} WHERE status = ?"
        processing_result = self.db.fetch_one(sql, (self.STATUS_PROCESSING,))
        processing = processing_result['count'] if processing_result else 0

        sql = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME} WHERE status = ?"
        completed_result = self.db.fetch_one(sql, (self.STATUS_COMPLETED,))
        completed = completed_result['count'] if completed_result else 0

        complete_rate = (completed / total * 100) if total > 0 else 0

        sql = f"SELECT type, COUNT(*) as count FROM {self.TABLE_NAME} GROUP BY type"
        type_stats = self.db.fetch_all(sql)

        sql = f"SELECT status, COUNT(*) as count FROM {self.TABLE_NAME} GROUP BY status"
        status_stats = self.db.fetch_all(sql)

        sql = f"SELECT department_id, COUNT(*) as count FROM {self.TABLE_NAME} GROUP BY department_id"
        department_stats = self.db.fetch_all(sql)

        return {
            'total': total,
            'pending': pending,
            'processing': processing,
            'completed': completed,
            'complete_rate': round(complete_rate, 2),
            'type_stats': type_stats,
            'status_stats': status_stats,
            'department_stats': department_stats
        }