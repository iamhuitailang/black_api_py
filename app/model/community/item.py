import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ItemModel:
    TABLE_NAME = 'tb_community_item'

    CATEGORY_TOOL = 'tool'
    CATEGORY_OUTDOOR = 'outdoor'
    CATEGORY_KITCHEN = 'kitchen'
    CATEGORY_ELECTRONIC = 'electronic'
    CATEGORY_SPORT = 'sport'
    CATEGORY_OTHER = 'other'

    CONDITION_NEW = 'new'
    CONDITION_LIKE_NEW = 'like_new'
    CONDITION_USABLE = 'usable'

    STATUS_AVAILABLE = 'available'
    STATUS_BORROWED = 'borrowed'
    STATUS_UNAVAILABLE = 'unavailable'

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
                owner_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                description TEXT,
                condition TEXT NOT NULL,
                borrow_rule TEXT,
                available_times TEXT,
                image_url TEXT,
                status TEXT DEFAULT 'available',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        db.execute(f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_owner_id ON {cls.TABLE_NAME}(owner_id)")
        db.execute(f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category ON {cls.TABLE_NAME}(category)")
        db.execute(f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)")

    def create(self, owner_id: int, name: str, category: str, description: str,
               condition: str, borrow_rule: str, available_times: list,
               image_url: str = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'owner_id': owner_id,
            'name': name,
            'category': category,
            'description': description,
            'condition': condition,
            'borrow_rule': borrow_rule,
            'available_times': json.dumps(available_times, ensure_ascii=False),
            'image_url': image_url,
            'status': self.STATUS_AVAILABLE,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        item = self.query.find_by_id(record_id)
        if item and item.get('available_times'):
            try:
                item['available_times'] = json.loads(item['available_times'])
            except (json.JSONDecodeError, TypeError):
                item['available_times'] = []
        return item

    def get_list(self, category: str = None, condition: str = None, status: str = None,
                 owner_id: int = None, keyword: str = None,
                 page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        conditions = {}
        if category:
            conditions['category'] = category
        if condition:
            conditions['condition'] = condition
        if status:
            conditions['status'] = status
        if owner_id:
            conditions['owner_id'] = owner_id

        if keyword:
            offset = (page - 1) * page_size
            where_parts = []
            params = []
            if conditions:
                for k, v in conditions.items():
                    where_parts.append(f"{k} = ?")
                    params.append(v)
            where_parts.append("(name LIKE ? OR description LIKE ?)")
            params.extend([f"%{keyword}%", f"%{keyword}%"])

            where_sql = " WHERE " + " AND ".join(where_parts)
            count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME}" + where_sql
            total = self.db.fetch_one(count_sql, tuple(params))['total']

            list_sql = f"SELECT * FROM {self.TABLE_NAME}" + where_sql + " ORDER BY id DESC LIMIT ? OFFSET ?"
            params.extend([page_size, offset])
            items = self.db.fetch_all(list_sql, tuple(params))
        else:
            result = self.query.paginate(page, page_size, conditions, order_by='id DESC')
            total = result['total']
            items = result['items']

        for item in items:
            if item.get('available_times'):
                try:
                    item['available_times'] = json.loads(item['available_times'])
                except (json.JSONDecodeError, TypeError):
                    item['available_times'] = []

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size
        }

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        allowed_fields = ['name', 'category', 'description', 'condition',
                          'borrow_rule', 'image_url', 'status']
        for field in allowed_fields:
            if field in kwargs:
                data[field] = kwargs[field]
        if 'available_times' in kwargs:
            data['available_times'] = json.dumps(kwargs['available_times'], ensure_ascii=False)
        return self.exec.update_by_id(record_id, data)

    def update_status(self, record_id: int, status: str) -> int:
        return self.update(record_id, status=status)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
