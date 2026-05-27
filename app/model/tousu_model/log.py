from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class LogModel:
    TABLE_NAME = 'tb_tousu_model_logs'

    TYPE_LOGIN = 'login'
    TYPE_LOGOUT = 'logout'
    TYPE_CREATE = 'create'
    TYPE_UPDATE = 'update'
    TYPE_DELETE = 'delete'
    TYPE_HANDLE = 'handle'
    TYPE_EXPORT = 'export'

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
                action TEXT NOT NULL,
                target_type TEXT DEFAULT '',
                target_id INTEGER DEFAULT 0,
                description TEXT DEFAULT '',
                ip_address TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_action ON {cls.TABLE_NAME}(action)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_target ON {cls.TABLE_NAME}(target_type, target_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql)

    def create(self, user_id: int, action: str, target_type: str = '', 
               target_id: int = 0, description: str = '', ip_address: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'action': action,
            'target_type': target_type,
            'target_id': target_id,
            'description': description,
            'ip_address': ip_address,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 20,
                    action: str = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if action:
            conditions['action'] = action
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_all(self, page: int = 1, page_size: int = 20,
                user_id: int = None, action: str = None, keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if user_id:
            conditions['user_id'] = user_id
        if action:
            conditions['action'] = action

        if keyword:
            return self.search(keyword, page, page_size, user_id, action)

        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 20,
               user_id: int = None, action: str = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if user_id:
            where_clauses.append("user_id = ?")
            params.append(user_id)

        if action:
            where_clauses.append("action = ?")
            params.append(action)

        where_clauses.append("description LIKE ?")
        like_pattern = f"%{keyword}%"
        params.append(like_pattern)

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY created_at DESC
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

    def delete_old_logs(self, days: int = 90) -> int:
        cutoff_date = (datetime.now() - __import__('datetime').timedelta(days=days)).isoformat()
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE created_at < ?"
        cursor = self.db.execute(sql, (cutoff_date,))
        return cursor.rowcount

    def get_action_text(self, action: str) -> str:
        action_map = {
            self.TYPE_LOGIN: '登录',
            self.TYPE_LOGOUT: '登出',
            self.TYPE_CREATE: '创建',
            self.TYPE_UPDATE: '更新',
            self.TYPE_DELETE: '删除',
            self.TYPE_HANDLE: '处理',
            self.TYPE_EXPORT: '导出'
        }
        return action_map.get(action, action)

    def to_dict(self, log: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': log.get('id'),
            'user_id': log.get('user_id'),
            'action': log.get('action'),
            'action_text': self.get_action_text(log.get('action')),
            'target_type': log.get('target_type'),
            'target_id': log.get('target_id'),
            'description': log.get('description'),
            'ip_address': log.get('ip_address'),
            'created_at': log.get('created_at')
        }