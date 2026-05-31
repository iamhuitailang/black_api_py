from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ServiceModel:
    TABLE_NAME = 'tb_fuwu_077_model_service'

    STATUS_ONLINE = 1
    STATUS_OFFLINE = 0

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
                category TEXT DEFAULT '',
                description TEXT DEFAULT '',
                price REAL DEFAULT 0,
                unit TEXT DEFAULT '次',
                duration INTEGER DEFAULT 60,
                image TEXT DEFAULT '',
                status INTEGER DEFAULT 1,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category ON {cls.TABLE_NAME}(category)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_sort ON {cls.TABLE_NAME}(sort_order)"
        db.execute(index_sql)

    @classmethod
    def init_default_services(cls):
        db = get_db()
        sql = f"SELECT COUNT(*) as total FROM {cls.TABLE_NAME}"
        result = db.fetch_one(sql)
        if result and result['total'] == 0:
            now = datetime.now().isoformat()
            default_services = [
                ('日常保洁', '保洁服务', '专业保洁人员上门进行日常清洁服务，包括地面、厨房、卫生间等区域清洁', 99.0, '次', 120, '', 1, 1),
                ('深度保洁', '保洁服务', '全方位深度清洁，包括家电表面、家具擦拭、玻璃清洁等', 199.0, '次', 180, '', 1, 2),
                ('家电清洗', '家电服务', '专业家电清洗服务，包括空调、油烟机、洗衣机等', 149.0, '次', 90, '', 1, 3),
                ('管道疏通', '维修服务', '专业管道疏通服务，解决马桶、下水道堵塞问题', 89.0, '次', 60, '', 1, 4),
                ('家具维修', '维修服务', '家具维修保养服务，包括木门、地板、家具等维修', 129.0, '次', 90, '', 1, 5),
                ('保姆服务', '家政服务', '专业保姆上门服务，提供烹饪、陪护、保洁等综合服务', 299.0, '天', 480, '', 1, 6),
                ('月嫂服务', '母婴服务', '专业月嫂服务，提供产后护理、婴儿照料等服务', 599.0, '天', 1440, '', 1, 7),
                ('老人陪护', '陪护服务', '专业老人陪护服务，提供生活照料、康复护理等', 199.0, '天', 480, '', 1, 8),
            ]
            insert_sql = f"""
                INSERT INTO {cls.TABLE_NAME} 
                (name, category, description, price, unit, duration, image, status, sort_order, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """
            for service in default_services:
                db.execute(insert_sql, service + (now, now))

    def create(self, name: str, category: str = '', description: str = '', 
               price: float = 0, unit: str = '次', duration: int = 60, 
               image: str = '', status: int = 1, sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'category': category,
            'description': description,
            'price': price,
            'unit': unit,
            'duration': duration,
            'image': image,
            'status': status,
            'sort_order': sort_order,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'category', 'description', 'price', 'unit', 
            'duration', 'image', 'status', 'sort_order'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, category: str = None,
                status: int = None, keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if category:
            conditions['category'] = category
        if status is not None:
            conditions['status'] = status

        if keyword:
            return self.search(keyword, page, page_size, category, status)

        return self.query.paginate(page, page_size, conditions, order_by='sort_order ASC, id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               category: str = None, status: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if category:
            where_clauses.append("category = ?")
            params.append(category)

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        where_clauses.append("(name LIKE ? OR description LIKE ? OR category LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern, like_pattern])

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY sort_order ASC, id DESC 
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

    def get_categories(self) -> List[str]:
        sql = f"SELECT DISTINCT category FROM {self.TABLE_NAME} WHERE category != '' ORDER BY category"
        results = self.db.fetch_all(sql)
        return [r['category'] for r in results]

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_ONLINE: '上架',
            self.STATUS_OFFLINE: '下架'
        }
        return status_map.get(status, '未知')

    def to_dict(self, service: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': service.get('id'),
            'name': service.get('name'),
            'category': service.get('category'),
            'description': service.get('description'),
            'price': service.get('price'),
            'unit': service.get('unit'),
            'duration': service.get('duration'),
            'image': service.get('image'),
            'status': service.get('status'),
            'status_text': self.get_status_text(service.get('status')),
            'sort_order': service.get('sort_order'),
            'created_at': service.get('created_at'),
            'updated_at': service.get('updated_at')
        }
