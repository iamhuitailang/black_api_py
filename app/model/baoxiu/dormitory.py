from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class DormitoryModel:
    TABLE_NAME = 'tb_baoxiu_dormitory'

    STATUS_ACTIVE = 0
    STATUS_INACTIVE = 1

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
                address TEXT DEFAULT '',
                floors INTEGER DEFAULT 6,
                rooms_per_floor INTEGER DEFAULT 10,
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_name ON {cls.TABLE_NAME}(name)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql2)

    def create(self, name: str, address: str = '', floors: int = 6,
               rooms_per_floor: int = 10) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'address': address,
            'floors': floors,
            'rooms_per_floor': rooms_per_floor,
            'status': self.STATUS_ACTIVE,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'name': name})

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'address', 'floors', 'rooms_per_floor', 'status'
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

        where_clauses.append("(name LIKE ? OR address LIKE ?)")
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

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_ACTIVE: '启用',
            self.STATUS_INACTIVE: '停用'
        }
        return status_map.get(status, '未知')

    @classmethod
    def init_default_dormitories(cls):
        dormitory_model = cls()
        existing = dormitory_model.query.count()
        if existing == 0:
            dormitories = [
                {'name': '1号宿舍楼', 'address': '校园东区', 'floors': 6, 'rooms_per_floor': 10},
                {'name': '2号宿舍楼', 'address': '校园东区', 'floors': 6, 'rooms_per_floor': 10},
                {'name': '3号宿舍楼', 'address': '校园西区', 'floors': 6, 'rooms_per_floor': 12},
                {'name': '4号宿舍楼', 'address': '校园西区', 'floors': 6, 'rooms_per_floor': 12},
                {'name': '5号宿舍楼', 'address': '校园南区', 'floors': 6, 'rooms_per_floor': 10},
                {'name': '6号宿舍楼', 'address': '校园南区', 'floors': 6, 'rooms_per_floor': 10},
            ]
            for d in dormitories:
                dormitory_model.create(**d)
            print("  - Created default dormitories")
