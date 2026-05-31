from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ServiceModel:
    TABLE_NAME = 'tb_chongwu09_model_service'

    TYPE_DAYCARE = 'daycare'
    TYPE_BOARDING = 'boarding'
    TYPE_GROOMING = 'grooming'
    TYPE_WALKING = 'walking'
    TYPE_VET = 'vet'

    STATUS_ACTIVE = 0
    STATUS_DISABLED = 1

    SERVICE_TYPES = [
        {'code': TYPE_DAYCARE, 'name': '日间寄养'},
        {'code': TYPE_BOARDING, 'name': '长期寄养'},
        {'code': TYPE_GROOMING, 'name': '美容洗护'},
        {'code': TYPE_WALKING, 'name': '遛宠服务'},
        {'code': TYPE_VET, 'name': '医疗陪护'},
    ]

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
                title TEXT NOT NULL,
                type TEXT NOT NULL,
                description TEXT DEFAULT '',
                price REAL NOT NULL DEFAULT 0,
                price_unit TEXT DEFAULT '天',
                cover_image TEXT DEFAULT '',
                capacity INTEGER DEFAULT 10,
                current_booked INTEGER DEFAULT 0,
                address TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, title: str, service_type: str, description: str, price: float,
               price_unit: str = '天', cover_image: str = '', capacity: int = 10,
               address: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'title': title,
            'type': service_type,
            'description': description,
            'price': price,
            'price_unit': price_unit,
            'cover_image': cover_image,
            'capacity': capacity,
            'current_booked': 0,
            'address': address,
            'status': self.STATUS_ACTIVE,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, service_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'title', 'type', 'description', 'price', 'price_unit',
            'cover_image', 'capacity', 'address', 'status'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(service_id, update_data)

    def update_booked(self, service_id: int, delta: int) -> int:
        service = self.get_by_id(service_id)
        if not service:
            return 0
        new_booked = max(0, service.get('current_booked', 0) + delta)
        now = datetime.now().isoformat()
        data = {'current_booked': new_booked, 'updated_at': now}
        return self.exec.update_by_id(service_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_list(self, page: int = 1, page_size: int = 10, service_type: str = None,
                 status: int = None, keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if service_type:
            conditions['type'] = service_type
        if status is not None:
            conditions['status'] = status
        if keyword:
            return self.search(keyword, page, page_size, service_type, status)
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               service_type: str = None, status: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size
        where_clauses = ["1=1"]
        params = []
        if service_type:
            where_clauses.append("type = ?")
            params.append(service_type)
        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)
        where_clauses.append("(title LIKE ? OR description LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern])
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

    def get_type_name(self, service_type: str) -> str:
        for t in self.SERVICE_TYPES:
            if t['code'] == service_type:
                return t['name']
        return '其他'

    def to_dict(self, service: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': service.get('id'),
            'title': service.get('title'),
            'type': service.get('type'),
            'type_name': self.get_type_name(service.get('type')),
            'description': service.get('description'),
            'price': service.get('price'),
            'price_unit': service.get('price_unit'),
            'cover_image': service.get('cover_image'),
            'capacity': service.get('capacity'),
            'current_booked': service.get('current_booked'),
            'address': service.get('address'),
            'status': service.get('status'),
            'created_at': service.get('created_at'),
            'updated_at': service.get('updated_at')
        }
