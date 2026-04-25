from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class VarietyModel:
    TABLE_NAME = 'tb_ims_variety'

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
                image_url TEXT DEFAULT '',
                description TEXT DEFAULT '',
                flowering_period TEXT DEFAULT '',
                care_instructions TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_name = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_name ON {cls.TABLE_NAME}(name)"
        db.execute(index_name)

    def create(self, name: str, image_url: str = '', description: str = '',
               flowering_period: str = '', care_instructions: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'image_url': image_url,
            'description': description,
            'flowering_period': flowering_period,
            'care_instructions': care_instructions,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one(conditions={'name': name})

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id DESC')

    def update(self, record_id: int, name: str = None, image_url: str = None,
               description: str = None, flowering_period: str = None,
               care_instructions: str = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}

        if name is not None:
            data['name'] = name
        if image_url is not None:
            data['image_url'] = image_url
        if description is not None:
            data['description'] = description
        if flowering_period is not None:
            data['flowering_period'] = flowering_period
        if care_instructions is not None:
            data['care_instructions'] = care_instructions

        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()

    def paginate(self, page: int = 1, page_size: int = 10,
                 keyword: str = None) -> Dict[str, Any]:
        if keyword:
            keyword_param = f"%{keyword}%"
            sql = f"""
                SELECT * FROM {self.TABLE_NAME} 
                WHERE name LIKE ? OR description LIKE ?
                ORDER BY id DESC
                LIMIT {page_size} OFFSET {(page - 1) * page_size}
            """
            count_sql = f"""
                SELECT COUNT(*) as total FROM {self.TABLE_NAME} 
                WHERE name LIKE ? OR description LIKE ?
            """
            params = (keyword_param, keyword_param)
            total = self.db.fetch_one(count_sql, params)
            total_count = total['total'] if total else 0
            items = self.db.fetch_all(sql, params)

            return {
                'items': items,
                'total': total_count,
                'page': page,
                'page_size': page_size,
                'total_pages': (total_count + page_size - 1) // page_size
            }

        return self.query.paginate(page, page_size, order_by='id DESC')
