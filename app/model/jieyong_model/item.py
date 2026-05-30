from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ItemModel:
    TABLE_NAME = 'tb_jieyong_model_item'

    STATUS_AVAILABLE = 0
    STATUS_UNAVAILABLE = 1

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
                category_id INTEGER NOT NULL DEFAULT 0,
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                rules TEXT DEFAULT '',
                total_quantity INTEGER DEFAULT 0,
                available_quantity INTEGER DEFAULT 0,
                image TEXT DEFAULT '',
                location TEXT DEFAULT '',
                max_borrow_days INTEGER DEFAULT 7,
                status INTEGER DEFAULT 0,
                borrow_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category ON {cls.TABLE_NAME}(category_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_available ON {cls.TABLE_NAME}(available_quantity)"
        db.execute(index_sql3)

    @classmethod
    def init_default_items(cls):
        model = cls()
        default_items = [
            {'category_id': 1, 'name': '笔记本电脑', 'description': 'ThinkPad X1 Carbon，用于临时办公', 'rules': '使用期间请妥善保管，损坏需照价赔偿', 'total_quantity': 5, 'max_borrow_days': 7, 'location': '行政办公室'},
            {'category_id': 1, 'name': '投影仪', 'description': '便携投影仪，支持HDMI输入', 'rules': '使用后请及时归还，避免影响他人使用', 'total_quantity': 3, 'max_borrow_days': 3, 'location': '会议室'},
            {'category_id': 2, 'name': '文件夹套装', 'description': 'A4文件夹，含10个彩色文件夹', 'rules': '使用后请清理干净归还', 'total_quantity': 20, 'max_borrow_days': 30, 'location': '办公用品柜'},
            {'category_id': 3, 'name': '篮球', 'description': '标准7号篮球', 'rules': '仅限室内场馆使用，请勿在水泥地使用', 'total_quantity': 10, 'max_borrow_days': 1, 'location': '器材室'},
            {'category_id': 3, 'name': '羽毛球拍', 'description': '尤尼克斯羽毛球拍，含3个羽毛球', 'rules': '使用后请擦拭干净，羽毛球损坏无需赔偿', 'total_quantity': 8, 'max_borrow_days': 2, 'location': '器材室'},
            {'category_id': 4, 'name': 'Python编程从入门到实践', 'description': '经典Python入门教程', 'rules': '请勿涂写、折页，损坏需赔偿', 'total_quantity': 3, 'max_borrow_days': 30, 'location': '图书角'},
            {'category_id': 5, 'name': '工具箱套装', 'description': '含螺丝刀、扳手、钳子等常用工具', 'rules': '请清点后归还，缺失需赔偿', 'total_quantity': 5, 'max_borrow_days': 7, 'location': '维修间'},
        ]
        for item in default_items:
            existing = model.query.find_one({'name': item['name']})
            if not existing:
                model.create(**item)
                print(f"  - Created default item: {item['name']}")

    def create(self, category_id: int, name: str, description: str = '', rules: str = '',
               total_quantity: int = 0, image: str = '', location: str = '',
               max_borrow_days: int = 7, status: int = STATUS_AVAILABLE) -> int:
        now = datetime.now().isoformat()
        data = {
            'category_id': category_id,
            'name': name,
            'description': description,
            'rules': rules,
            'total_quantity': total_quantity,
            'available_quantity': total_quantity,
            'image': image,
            'location': location,
            'max_borrow_days': max_borrow_days,
            'status': status,
            'borrow_count': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, category_id: int = None,
                status: int = None, keyword: str = None, only_available: bool = False) -> Dict[str, Any]:
        conditions = {}
        if category_id:
            conditions['category_id'] = category_id
        if status is not None:
            conditions['status'] = status
        if only_available:
            return self.query.paginate(page, page_size, conditions, order_by='borrow_count DESC, id DESC')

        if keyword:
            return self.search(keyword, page, page_size, category_id, status)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               category_id: int = None, status: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if category_id:
            where_clauses.append("category_id = ?")
            params.append(category_id)

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        where_clauses.append("(name LIKE ? OR description LIKE ? OR rules LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern, like_pattern])

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY borrow_count DESC, id DESC 
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

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'category_id', 'name', 'description', 'rules', 'total_quantity',
            'image', 'location', 'max_borrow_days', 'status'
        ]}
        
        item = self.get_by_id(record_id)
        if item and 'total_quantity' in update_data:
            old_total = item.get('total_quantity', 0)
            new_total = update_data['total_quantity']
            old_available = item.get('available_quantity', 0)
            diff = new_total - old_total
            update_data['available_quantity'] = max(0, old_available + diff)
        
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def update_quantity(self, record_id: int, quantity_change: int) -> int:
        item = self.get_by_id(record_id)
        if not item:
            return 0
        
        new_available = item.get('available_quantity', 0) + quantity_change
        new_available = max(0, min(item.get('total_quantity', 0), new_available))
        
        now = datetime.now().isoformat()
        data = {
            'available_quantity': new_available,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def increment_borrow_count(self, record_id: int) -> int:
        item = self.get_by_id(record_id)
        if not item:
            return 0
        
        now = datetime.now().isoformat()
        data = {
            'borrow_count': item.get('borrow_count', 0) + 1,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_AVAILABLE: '可借用',
            self.STATUS_UNAVAILABLE: '不可借用'
        }
        return status_map.get(status, '未知')

    def to_dict(self, item: Dict[str, Any], include_category: bool = True) -> Dict[str, Any]:
        result = {
            'id': item.get('id'),
            'category_id': item.get('category_id'),
            'name': item.get('name'),
            'description': item.get('description'),
            'rules': item.get('rules'),
            'total_quantity': item.get('total_quantity'),
            'available_quantity': item.get('available_quantity'),
            'image': item.get('image'),
            'location': item.get('location'),
            'max_borrow_days': item.get('max_borrow_days'),
            'status': item.get('status'),
            'status_text': self.get_status_text(item.get('status')),
            'borrow_count': item.get('borrow_count'),
            'created_at': item.get('created_at')
        }
        
        if include_category and item.get('category_id'):
            from app.model.jieyong_model.category import CategoryModel
            category_model = CategoryModel()
            category = category_model.get_by_id(item.get('category_id'))
            if category:
                result['category_name'] = category.get('name')
        
        return result

    def get_hot_items(self, limit: int = 10) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE status = ? AND available_quantity > 0
            ORDER BY borrow_count DESC 
            LIMIT ?
        """
        items = self.db.fetch_all(sql, (self.STATUS_AVAILABLE, limit))
        return [self.to_dict(item) for item in items]

    def check_availability(self, item_id: int, quantity: int) -> bool:
        item = self.get_by_id(item_id)
        if not item:
            return False
        if item.get('status') != self.STATUS_AVAILABLE:
            return False
        return item.get('available_quantity', 0) >= quantity
