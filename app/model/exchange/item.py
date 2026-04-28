from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class ExItemModel:
    TABLE_NAME = 'tb_ex_items'
    
    STATUS_ON_SHELF = 1
    STATUS_EXCHANGED = 2
    STATUS_OFF_SHELF = 3
    
    CONDITIONS = {
        1: '全新',
        2: '几乎全新',
        3: '轻微使用',
        4: '明显使用'
    }
    
    CATEGORIES = ['数码', '图书', '家居', '服饰', '美妆', '运动', '母婴', '其他']
    
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
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                condition INTEGER DEFAULT 1,
                description TEXT DEFAULT '',
                images TEXT DEFAULT '[]',
                expect_categories TEXT DEFAULT '[]',
                city TEXT DEFAULT '',
                status INTEGER DEFAULT 1,
                view_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category ON {cls.TABLE_NAME}(category)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql3)
        index_sql4 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_city ON {cls.TABLE_NAME}(city)"
        db.execute(index_sql4)

    def create(self, user_id: int, title: str, category: str, condition: int, 
               description: str, images: List[str], expect_categories: List[str], city: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'title': title,
            'category': category,
            'condition': condition,
            'description': description,
            'images': json.dumps(images, ensure_ascii=False),
            'expect_categories': json.dumps(expect_categories, ensure_ascii=False),
            'city': city,
            'status': self.STATUS_ON_SHELF,
            'view_count': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        item = self.query.find_by_id(record_id)
        if item:
            return self._parse_json_fields(item)
        return None

    def _parse_json_fields(self, item: Dict[str, Any]) -> Dict[str, Any]:
        if 'images' in item and isinstance(item['images'], str):
            try:
                item['images'] = json.loads(item['images'])
            except:
                item['images'] = []
        if 'expect_categories' in item and isinstance(item['expect_categories'], str):
            try:
                item['expect_categories'] = json.loads(item['expect_categories'])
            except:
                item['expect_categories'] = []
        return item

    def get_list_by_user(self, user_id: int, page: int = 1, page_size: int = 20, 
                         status: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if status is not None:
            conditions['status'] = status
        
        result = self.query.paginate(page, page_size, conditions, order_by='id DESC')
        result['items'] = [self._parse_json_fields(item) for item in result.get('items', [])]
        return result

    def search(self, keyword: str = None, category: str = None, city: str = None,
               condition: int = None, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        conditions = {'status': self.STATUS_ON_SHELF}
        if category:
            conditions['category'] = category
        if city:
            conditions['city'] = city
        if condition is not None:
            conditions['condition'] = condition
        
        offset = (page - 1) * page_size
        
        where_clauses = ["status = ?"]
        params = [self.STATUS_ON_SHELF]
        
        if category:
            where_clauses.append("category = ?")
            params.append(category)
        if city:
            where_clauses.append("city = ?")
            params.append(city)
        if condition is not None:
            where_clauses.append("condition = ?")
            params.append(condition)
        if keyword:
            where_clauses.append("(title LIKE ? OR description LIKE ?)")
            params.append(f"%{keyword}%")
            params.append(f"%{keyword}%")
        
        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        count_result = self.db.fetch_one(count_sql, tuple(params))
        total = count_result['total'] if count_result else 0
        
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)} ORDER BY id DESC LIMIT ? OFFSET ?"
        params.append(page_size)
        params.append(offset)
        
        items = self.db.fetch_all(sql, tuple(params))
        items = [self._parse_json_fields(item) for item in items]
        
        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def update(self, item_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'title', 'category', 'condition', 'description', 'images', 'expect_categories', 'city'
        ]}
        if 'images' in update_data and isinstance(update_data['images'], list):
            update_data['images'] = json.dumps(update_data['images'], ensure_ascii=False)
        if 'expect_categories' in update_data and isinstance(update_data['expect_categories'], list):
            update_data['expect_categories'] = json.dumps(update_data['expect_categories'], ensure_ascii=False)
        update_data['updated_at'] = now
        return self.exec.update_by_id(item_id, update_data)

    def update_status(self, item_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(item_id, data)

    def add_view_count(self, item_id: int) -> int:
        return self.exec.execute_raw(
            f"UPDATE {self.TABLE_NAME} SET view_count = view_count + 1 WHERE id = ?",
            (item_id,)
        )

    def get_all(self, page: int = 1, page_size: int = 10, conditions: Dict[str, Any] = None) -> Dict[str, Any]:
        result = self.query.paginate(page, page_size, conditions, order_by='id DESC')
        result['items'] = [self._parse_json_fields(item) for item in result.get('items', [])]
        return result

    def to_public_dict(self, item: Dict[str, Any]) -> Dict[str, Any]:
        item = self._parse_json_fields(item)
        return {
            'id': item.get('id'),
            'user_id': item.get('user_id'),
            'title': item.get('title'),
            'category': item.get('category'),
            'condition': item.get('condition'),
            'condition_text': self.CONDITIONS.get(item.get('condition'), '未知'),
            'description': item.get('description'),
            'images': item.get('images', []),
            'expect_categories': item.get('expect_categories', []),
            'city': item.get('city'),
            'status': item.get('status'),
            'view_count': item.get('view_count'),
            'created_at': item.get('created_at'),
            'updated_at': item.get('updated_at')
        }
