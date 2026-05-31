from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class StaffModel:
    TABLE_NAME = 'tb_fuwu_077_model_staff'

    STATUS_ACTIVE = 1
    STATUS_INACTIVE = 0

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
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                id_card TEXT DEFAULT '',
                skills TEXT DEFAULT '',
                experience INTEGER DEFAULT 0,
                avatar TEXT DEFAULT '',
                rating REAL DEFAULT 5.0,
                order_count INTEGER DEFAULT 0,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_phone ON {cls.TABLE_NAME}(phone)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, name: str, phone: str, id_card: str = '', 
               skills: str = '', experience: int = 0, 
               avatar: str = '', status: int = 1) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'phone': phone,
            'id_card': id_card,
            'skills': skills,
            'experience': experience,
            'avatar': avatar,
            'rating': 5.0,
            'order_count': 0,
            'status': status,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_phone(self, phone: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'phone': phone})

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'phone', 'id_card', 'skills', 'experience', 
            'avatar', 'status'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def update_rating(self, staff_id: int, new_rating: float) -> int:
        staff = self.get_by_id(staff_id)
        if not staff:
            return 0
        
        current_rating = staff.get('rating', 5.0)
        order_count = staff.get('order_count', 0)
        
        if order_count > 0:
            updated_rating = (current_rating * order_count + new_rating) / (order_count + 1)
        else:
            updated_rating = new_rating
        
        now = datetime.now().isoformat()
        data = {
            'rating': round(updated_rating, 1),
            'order_count': order_count + 1,
            'updated_at': now
        }
        return self.exec.update_by_id(staff_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, 
                status: int = None, keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status

        if keyword:
            return self.search(keyword, page, page_size, status)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               status: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        where_clauses.append("(name LIKE ? OR phone LIKE ? OR skills LIKE ?)")
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

    def get_available_staff(self) -> List[Dict[str, Any]]:
        return self.query.find_all({'status': self.STATUS_ACTIVE}, order_by='rating DESC')

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_ACTIVE: '在职',
            self.STATUS_INACTIVE: '离职'
        }
        return status_map.get(status, '未知')

    def to_dict(self, staff: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': staff.get('id'),
            'name': staff.get('name'),
            'phone': staff.get('phone'),
            'id_card': staff.get('id_card'),
            'skills': staff.get('skills'),
            'experience': staff.get('experience'),
            'avatar': staff.get('avatar'),
            'rating': staff.get('rating'),
            'order_count': staff.get('order_count'),
            'status': staff.get('status'),
            'status_text': self.get_status_text(staff.get('status')),
            'created_at': staff.get('created_at'),
            'updated_at': staff.get('updated_at')
        }
