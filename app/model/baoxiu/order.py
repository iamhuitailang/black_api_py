from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class OrderModel:
    TABLE_NAME = 'tb_baoxiu_order'

    STATUS_PENDING = 0
    STATUS_ASSIGNED = 1
    STATUS_PROCESSING = 2
    STATUS_COMPLETED = 3
    STATUS_CANCELLED = 4

    URGENCY_LOW = 0
    URGENCY_NORMAL = 1
    URGENCY_HIGH = 2
    URGENCY_URGENT = 3

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
                order_no TEXT NOT NULL UNIQUE,
                student_id INTEGER NOT NULL,
                repairman_id INTEGER DEFAULT 0,
                title TEXT NOT NULL,
                description TEXT DEFAULT '',
                category TEXT DEFAULT '',
                urgency INTEGER DEFAULT 1,
                status INTEGER DEFAULT 0,
                dormitory_id INTEGER DEFAULT 0,
                room_number TEXT DEFAULT '',
                contact_name TEXT DEFAULT '',
                contact_phone TEXT DEFAULT '',
                images TEXT DEFAULT '',
                assigned_at TIMESTAMP DEFAULT '',
                completed_at TIMESTAMP DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_order_no ON {cls.TABLE_NAME}(order_no)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_student_id ON {cls.TABLE_NAME}(student_id)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_repairman_id ON {cls.TABLE_NAME}(repairman_id)"
        db.execute(index_sql3)
        index_sql4 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql4)
        index_sql5 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_dormitory_id ON {cls.TABLE_NAME}(dormitory_id)"
        db.execute(index_sql5)
        index_sql6 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_urgency ON {cls.TABLE_NAME}(urgency)"
        db.execute(index_sql6)

    def _generate_order_no(self) -> str:
        now = datetime.now()
        return f"BX{now.strftime('%Y%m%d%H%M%S')}{now.microsecond // 1000:03d}"

    def create(self, student_id: int, title: str, description: str = '',
               category: str = '', urgency: int = 1,
               dormitory_id: int = 0, room_number: str = '',
               contact_name: str = '', contact_phone: str = '',
               images: str = '') -> int:
        now = datetime.now().isoformat()
        order_no = self._generate_order_no()
        data = {
            'order_no': order_no,
            'student_id': student_id,
            'repairman_id': 0,
            'title': title,
            'description': description,
            'category': category,
            'urgency': urgency,
            'status': self.STATUS_PENDING,
            'dormitory_id': dormitory_id,
            'room_number': room_number,
            'contact_name': contact_name,
            'contact_phone': contact_phone,
            'images': images,
            'assigned_at': '',
            'completed_at': '',
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_order_no(self, order_no: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'order_no': order_no})

    def assign_repairman(self, order_id: int, repairman_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'repairman_id': repairman_id,
            'status': self.STATUS_ASSIGNED,
            'assigned_at': now,
            'updated_at': now
        }
        return self.exec.update_by_id(order_id, data)

    def start_processing(self, order_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_PROCESSING,
            'updated_at': now
        }
        return self.exec.update_by_id(order_id, data)

    def complete(self, order_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_COMPLETED,
            'completed_at': now,
            'updated_at': now
        }
        return self.exec.update_by_id(order_id, data)

    def cancel(self, order_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_CANCELLED,
            'updated_at': now
        }
        return self.exec.update_by_id(order_id, data)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'title', 'description', 'category', 'urgency',
            'dormitory_id', 'room_number', 'contact_name', 'contact_phone', 'images'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10,
                student_id: int = None, repairman_id: int = None,
                status: int = None, dormitory_id: int = None,
                category: str = None, urgency: int = None,
                keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if student_id:
            conditions['student_id'] = student_id
        if repairman_id:
            conditions['repairman_id'] = repairman_id
        if status is not None:
            conditions['status'] = status
        if dormitory_id:
            conditions['dormitory_id'] = dormitory_id
        if category:
            conditions['category'] = category
        if urgency is not None:
            conditions['urgency'] = urgency

        if keyword:
            return self.search(keyword, page, page_size, student_id, repairman_id,
                               status, dormitory_id, category, urgency)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               student_id: int = None, repairman_id: int = None,
               status: int = None, dormitory_id: int = None,
               category: str = None, urgency: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if student_id:
            where_clauses.append("student_id = ?")
            params.append(student_id)
        if repairman_id:
            where_clauses.append("repairman_id = ?")
            params.append(repairman_id)
        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)
        if dormitory_id:
            where_clauses.append("dormitory_id = ?")
            params.append(dormitory_id)
        if category:
            where_clauses.append("category = ?")
            params.append(category)
        if urgency is not None:
            where_clauses.append("urgency = ?")
            params.append(urgency)

        where_clauses.append("(title LIKE ? OR description LIKE ? OR order_no LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern, like_pattern])

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

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_PENDING: '待分配',
            self.STATUS_ASSIGNED: '已分配',
            self.STATUS_PROCESSING: '维修中',
            self.STATUS_COMPLETED: '已完成',
            self.STATUS_CANCELLED: '已取消'
        }
        return status_map.get(status, '未知')

    def get_urgency_text(self, urgency: int) -> str:
        urgency_map = {
            self.URGENCY_LOW: '低',
            self.URGENCY_NORMAL: '普通',
            self.URGENCY_HIGH: '高',
            self.URGENCY_URGENT: '紧急'
        }
        return urgency_map.get(urgency, '普通')

    def get_statistics(self, student_id: int = None, repairman_id: int = None) -> Dict[str, Any]:
        base_where = {}
        if student_id:
            base_where['student_id'] = student_id
        if repairman_id:
            base_where['repairman_id'] = repairman_id

        total = self.query.count(base_where if base_where else None)
        
        pending_where = dict(base_where) if base_where else {}
        pending_where['status'] = self.STATUS_PENDING
        pending = self.query.count(pending_where)
        
        processing_where = dict(base_where) if base_where else {}
        processing_where['status'] = self.STATUS_PROCESSING
        processing = self.query.count(processing_where)
        
        completed_where = dict(base_where) if base_where else {}
        completed_where['status'] = self.STATUS_COMPLETED
        completed = self.query.count(completed_where)
        
        cancelled_where = dict(base_where) if base_where else {}
        cancelled_where['status'] = self.STATUS_CANCELLED
        cancelled = self.query.count(cancelled_where)

        today_conditions = [f"DATE(created_at) = DATE('now')"]
        today_params = []
        if student_id:
            today_conditions.append("student_id = ?")
            today_params.append(student_id)
        if repairman_id:
            today_conditions.append("repairman_id = ?")
            today_params.append(repairman_id)
            
        today_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(today_conditions)}"
        today_result = self.db.fetch_one(today_sql, tuple(today_params) if today_params else None)
        today_count = today_result['total'] if today_result else 0

        category_conditions = ["category != '' AND category IS NOT NULL"]
        category_params = []
        if student_id:
            category_conditions.append("student_id = ?")
            category_params.append(student_id)
        if repairman_id:
            category_conditions.append("repairman_id = ?")
            category_params.append(repairman_id)
            
        category_sql = f"""
            SELECT category, COUNT(*) as count 
            FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(category_conditions)}
            GROUP BY category
        """
        category_list = self.db.fetch_all(category_sql, tuple(category_params) if category_params else None)

        return {
            'total': total,
            'pending': pending,
            'processing': processing,
            'completed': completed,
            'cancelled': cancelled,
            'today_count': today_count,
            'category_stats': category_list
        }
