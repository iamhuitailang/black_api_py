from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class LogModel:
    TABLE_NAME = 'tb_baoxiu_log'

    ACTION_LOGIN = 'login'
    ACTION_LOGOUT = 'logout'
    ACTION_CREATE_ORDER = 'create_order'
    ACTION_ASSIGN_ORDER = 'assign_order'
    ACTION_PROCESS_ORDER = 'process_order'
    ACTION_COMPLETE_ORDER = 'complete_order'
    ACTION_CANCEL_ORDER = 'cancel_order'
    ACTION_UPDATE_USER = 'update_user'
    ACTION_UPDATE_DORMITORY = 'update_dormitory'

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
                user_id INTEGER DEFAULT 0,
                action TEXT NOT NULL,
                target_type TEXT DEFAULT '',
                target_id INTEGER DEFAULT 0,
                detail TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_action ON {cls.TABLE_NAME}(action)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_target ON {cls.TABLE_NAME}(target_type, target_id)"
        db.execute(index_sql3)

    def create(self, user_id: int, action: str, target_type: str = '',
               target_id: int = 0, detail: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'action': action,
            'target_type': target_type,
            'target_id': target_id,
            'detail': detail,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int, page: int = 1,
                       page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(
            page=page,
            page_size=page_size,
            conditions={'user_id': user_id},
            order_by='id DESC'
        )

    def get_all(self, page: int = 1, page_size: int = 10,
                user_id: int = None, action: str = None,
                target_type: str = None, start_date: str = None,
                end_date: str = None, keyword: str = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if user_id:
            where_clauses.append("user_id = ?")
            params.append(user_id)
        if action:
            where_clauses.append("action = ?")
            params.append(action)
        if target_type:
            where_clauses.append("target_type = ?")
            params.append(target_type)
        if start_date:
            where_clauses.append("DATE(created_at) >= ?")
            params.append(start_date)
        if end_date:
            where_clauses.append("DATE(created_at) <= ?")
            params.append(end_date)
        if keyword:
            where_clauses.append("detail LIKE ?")
            params.append(f"%{keyword}%")

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

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def clean_old_logs(self, days: int = 90) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE created_at < datetime('now', '-{days} days')"
        return self.exec.execute_raw(sql)

    def get_action_text(self, action: str) -> str:
        action_map = {
            self.ACTION_LOGIN: '登录',
            self.ACTION_LOGOUT: '登出',
            self.ACTION_CREATE_ORDER: '创建报修单',
            self.ACTION_ASSIGN_ORDER: '分配工单',
            self.ACTION_PROCESS_ORDER: '处理工单',
            self.ACTION_COMPLETE_ORDER: '完成工单',
            self.ACTION_CANCEL_ORDER: '取消工单',
            self.ACTION_UPDATE_USER: '更新用户',
            self.ACTION_UPDATE_DORMITORY: '更新宿舍楼'
        }
        return action_map.get(action, action)
