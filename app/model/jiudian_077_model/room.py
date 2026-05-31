from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class RoomModel:
    TABLE_NAME = 'tb_jiudian_077_model_room'

    STATUS_AVAILABLE = 0
    STATUS_OCCUPIED = 1
    STATUS_MAINTENANCE = 2
    STATUS_CLEANING = 3

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
                room_number TEXT NOT NULL UNIQUE,
                type TEXT NOT NULL,
                floor INTEGER DEFAULT 0,
                price REAL NOT NULL,
                area REAL DEFAULT 0,
                bed_count INTEGER DEFAULT 1,
                max_guests INTEGER DEFAULT 2,
                facilities TEXT DEFAULT '',
                description TEXT DEFAULT '',
                images TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_room_number ON {cls.TABLE_NAME}(room_number)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_price ON {cls.TABLE_NAME}(price)"
        db.execute(index_sql)

    def create(self, room_number: str, type: str, floor: int, price: float,
               area: float = 0, bed_count: int = 1, max_guests: int = 2,
               facilities: str = '', description: str = '', images: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'room_number': room_number,
            'type': type,
            'floor': floor,
            'price': price,
            'area': area,
            'bed_count': bed_count,
            'max_guests': max_guests,
            'facilities': facilities,
            'description': description,
            'images': images,
            'status': self.STATUS_AVAILABLE,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_room_number(self, room_number: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'room_number': room_number})

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'room_number', 'type', 'floor', 'price', 'area', 'bed_count',
            'max_guests', 'facilities', 'description', 'images', 'status'
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

    def count(self) -> int:
        return self.query.count()

    def get_all(self, page: int = 1, page_size: int = 10, type: str = None,
                status: int = None, min_price: float = None, max_price: float = None,
                keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if type:
            conditions['type'] = type
        if status is not None:
            conditions['status'] = status

        if keyword or min_price is not None or max_price is not None:
            return self.search(keyword or '', page, page_size, type, status, min_price, max_price)

        return self.query.paginate(page, page_size, conditions, order_by='room_number ASC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               type: str = None, status: int = None,
               min_price: float = None, max_price: float = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if type:
            where_clauses.append("type = ?")
            params.append(type)

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        if min_price is not None:
            where_clauses.append("price >= ?")
            params.append(min_price)

        if max_price is not None:
            where_clauses.append("price <= ?")
            params.append(max_price)

        if keyword:
            where_clauses.append("(room_number LIKE ? OR type LIKE ? OR description LIKE ? OR facilities LIKE ?)")
            like_pattern = f"%{keyword}%"
            params.extend([like_pattern, like_pattern, like_pattern, like_pattern])

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY room_number ASC 
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

    def get_available_rooms(self, check_in_date: str = None, check_out_date: str = None,
                            page: int = 1, page_size: int = 10, type: str = None,
                            min_price: float = None, max_price: float = None,
                            keyword: str = None) -> Dict[str, Any]:
        from app.model.jiudian_077_model import BookingModel
        booking_model = BookingModel()

        base_result = self.search(keyword or '', page, page_size, type, self.STATUS_AVAILABLE,
                                  min_price, max_price)

        if check_in_date and check_out_date:
            booked_room_ids = booking_model.get_booked_room_ids(check_in_date, check_out_date)
            if booked_room_ids:
                filtered_items = [
                    item for item in base_result.get('items', [])
                    if item.get('id') not in booked_room_ids
                ]
                base_result['items'] = filtered_items
                base_result['total'] = len(filtered_items)
                base_result['total_pages'] = (len(filtered_items) + page_size - 1) // page_size

        return base_result

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_AVAILABLE: '空闲',
            self.STATUS_OCCUPIED: '已入住',
            self.STATUS_MAINTENANCE: '维护中',
            self.STATUS_CLEANING: '清洁中'
        }
        return status_map.get(status, '未知')

    def get_type_text(self, type: str) -> str:
        type_map = {
            'single': '单人间',
            'double': '双人间',
            'twin': '标准间',
            'suite': '套房',
            'family': '家庭房',
            'deluxe': '豪华间'
        }
        return type_map.get(type, type)

    def to_public_dict(self, room: Dict[str, Any]) -> Dict[str, Any]:
        images = room.get('images', '')
        image_list = images.split(',') if images else []
        facilities = room.get('facilities', '')
        facility_list = facilities.split(',') if facilities else []

        return {
            'id': room.get('id'),
            'room_number': room.get('room_number'),
            'type': room.get('type'),
            'type_text': self.get_type_text(room.get('type')),
            'floor': room.get('floor'),
            'price': room.get('price'),
            'area': room.get('area'),
            'bed_count': room.get('bed_count'),
            'max_guests': room.get('max_guests'),
            'facilities': facility_list,
            'description': room.get('description'),
            'images': image_list,
            'status': room.get('status'),
            'status_text': self.get_status_text(room.get('status')),
            'created_at': room.get('created_at')
        }
