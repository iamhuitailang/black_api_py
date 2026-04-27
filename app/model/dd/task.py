from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TaskModel:
    TABLE_NAME = 'tb_dd_tasks'
    
    STATUS_PENDING = 0
    STATUS_ACCEPTED = 1
    STATUS_IN_PROGRESS = 2
    STATUS_COMPLETED = 3
    STATUS_CANCELLED = 4
    STATUS_EXPIRED = 5
    
    CATEGORY_RUN_ERRAND = '跑腿'
    CATEGORY_MOVING = '搬家'
    CATEGORY_HOUSEKEEPING = '家政'
    CATEGORY_REPAIR = '维修'
    CATEGORY_OTHER = '其他'
    
    CATEGORIES = [CATEGORY_RUN_ERRAND, CATEGORY_MOVING, CATEGORY_HOUSEKEEPING, CATEGORY_REPAIR, CATEGORY_OTHER]
    
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
                publisher_id INTEGER NOT NULL,
                receiver_id INTEGER,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                description TEXT DEFAULT '',
                budget REAL DEFAULT 0,
                address TEXT DEFAULT '',
                scheduled_time TIMESTAMP,
                status INTEGER DEFAULT 0,
                expire_time TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_publisher_id ON {cls.TABLE_NAME}(publisher_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_receiver_id ON {cls.TABLE_NAME}(receiver_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category ON {cls.TABLE_NAME}(category)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql)

    def create(self, publisher_id: int, title: str, category: str, description: str, 
               budget: float, address: str, scheduled_hours: int = 6) -> int:
        now = datetime.now()
        scheduled_time = (now + timedelta(hours=scheduled_hours)).isoformat()
        expire_time = (now + timedelta(hours=72)).isoformat()
        now_str = now.isoformat()
        
        data = {
            'publisher_id': publisher_id,
            'title': title,
            'category': category,
            'description': description,
            'budget': budget,
            'address': address,
            'scheduled_time': scheduled_time,
            'status': self.STATUS_PENDING,
            'expire_time': expire_time,
            'created_at': now_str,
            'updated_at': now_str
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_publisher(self, publisher_id: int, page: int = 1, page_size: int = 10, 
                         status: int = None) -> Dict[str, Any]:
        conditions = {'publisher_id': publisher_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_by_receiver(self, receiver_id: int, page: int = 1, page_size: int = 10,
                        status: int = None) -> Dict[str, Any]:
        conditions = {'receiver_id': receiver_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_pending_tasks(self, page: int = 1, page_size: int = 10, 
                          category: str = None, keyword: str = None) -> Dict[str, Any]:
        conditions = {'status': self.STATUS_PENDING}
        if category:
            conditions['category'] = category
        
        if keyword:
            return self.search_pending(keyword, page, page_size, category)
        
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def search_pending(self, keyword: str, page: int = 1, page_size: int = 10,
                       category: str = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size
        
        where_clauses = ["status = ?"]
        params = [self.STATUS_PENDING]
        
        if category:
            where_clauses.append("category = ?")
            params.append(category)
        
        where_clauses.append("(title LIKE ? OR description LIKE ? OR address LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern, like_pattern])
        
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

    def update_status(self, task_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        if status == self.STATUS_COMPLETED:
            data['completed_at'] = now
        return self.exec.update_by_id(task_id, data)

    def assign_receiver(self, task_id: int, receiver_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'receiver_id': receiver_id,
            'status': self.STATUS_ACCEPTED,
            'updated_at': now
        }
        return self.exec.update_by_id(task_id, data)

    def update(self, task_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'title', 'category', 'description', 'budget', 'address', 'scheduled_time'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(task_id, update_data)

    def cancel_task(self, task_id: int) -> int:
        return self.update_status(task_id, self.STATUS_CANCELLED)

    def check_and_expire(self) -> int:
        now = datetime.now().isoformat()
        sql = f"""
            UPDATE {self.TABLE_NAME} 
            SET status = ?, updated_at = ?
            WHERE status = ? AND expire_time < ?
        """
        cursor = self.db.execute(sql, (self.STATUS_EXPIRED, now, self.STATUS_PENDING, now))
        return cursor.rowcount

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_dict(self, task: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': task.get('id'),
            'publisher_id': task.get('publisher_id'),
            'receiver_id': task.get('receiver_id'),
            'title': task.get('title'),
            'category': task.get('category'),
            'description': task.get('description'),
            'budget': task.get('budget'),
            'address': task.get('address'),
            'scheduled_time': task.get('scheduled_time'),
            'status': task.get('status'),
            'status_text': self.get_status_text(task.get('status')),
            'expire_time': task.get('expire_time'),
            'created_at': task.get('created_at'),
            'updated_at': task.get('updated_at'),
            'completed_at': task.get('completed_at')
        }

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_PENDING: '待接单',
            self.STATUS_ACCEPTED: '已接单',
            self.STATUS_IN_PROGRESS: '进行中',
            self.STATUS_COMPLETED: '已完成',
            self.STATUS_CANCELLED: '已取消',
            self.STATUS_EXPIRED: '已过期'
        }
        return status_map.get(status, '未知')
