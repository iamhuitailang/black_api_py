import json
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ListingStatus:
    ACTIVE = 'active'
    RENTED = 'rented'
    OFFLINE = 'offline'
    EXPIRED = 'expired'


class ListingModel:
    TABLE_NAME = 'tb_rental_listings'

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
                district TEXT NOT NULL,
                address TEXT NOT NULL,
                room_type TEXT NOT NULL,
                area_sqm REAL NOT NULL DEFAULT 0,
                price_month INTEGER NOT NULL DEFAULT 0,
                deposit TEXT DEFAULT '',
                is_shared INTEGER NOT NULL DEFAULT 0,
                floor TEXT DEFAULT '',
                has_elevator INTEGER NOT NULL DEFAULT 0,
                has_parking INTEGER NOT NULL DEFAULT 0,
                description TEXT DEFAULT '',
                images TEXT DEFAULT '[]',
                contact_name TEXT NOT NULL,
                contact_phone TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sqls = [
            f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_district ON {cls.TABLE_NAME}(district)",
            f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_price_month ON {cls.TABLE_NAME}(price_month)",
            f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_room_type ON {cls.TABLE_NAME}(room_type)",
            f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)",
            f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)",
        ]
        for idx_sql in index_sqls:
            db.execute(idx_sql)

    @staticmethod
    def hash_password(password: str) -> str:
        return hashlib.sha256(password.encode('utf-8')).hexdigest()

    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        return hashlib.sha256(password.encode('utf-8')).hexdigest() == password_hash

    def create(self, title: str, district: str, address: str, room_type: str,
               area_sqm: float, price_month: int, deposit: str, is_shared: bool,
               floor: str, has_elevator: bool, has_parking: bool,
               description: str, images: List[str], contact_name: str,
               contact_phone: str, password: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'title': title,
            'district': district,
            'address': address,
            'room_type': room_type,
            'area_sqm': area_sqm,
            'price_month': price_month,
            'deposit': deposit,
            'is_shared': 1 if is_shared else 0,
            'floor': floor,
            'has_elevator': 1 if has_elevator else 0,
            'has_parking': 1 if has_parking else 0,
            'description': description,
            'images': json.dumps(images, ensure_ascii=False),
            'contact_name': contact_name,
            'contact_phone': contact_phone,
            'password_hash': self.hash_password(password),
            'status': ListingStatus.ACTIVE,
            'created_at': now,
            'refreshed_at': now,
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        row = self.query.find_by_id(record_id)
        if row:
            row = self._parse_row(row)
        return row

    def _parse_row(self, row: Dict[str, Any]) -> Dict[str, Any]:
        if 'images' in row and isinstance(row['images'], str):
            try:
                row['images'] = json.loads(row['images'])
            except (json.JSONDecodeError, TypeError):
                row['images'] = []
        row['is_shared'] = bool(row.get('is_shared', 0))
        row['has_elevator'] = bool(row.get('has_elevator', 0))
        row['has_parking'] = bool(row.get('has_parking', 0))
        return row

    def find_list(self, district: str = None, room_type: str = None,
                  min_price: int = None, max_price: int = None,
                  page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        self._auto_expire_old()

        where_clauses = ["status = 'active'"]
        params = []

        if district:
            where_clauses.append("district = ?")
            params.append(district)
        if room_type:
            where_clauses.append("room_type = ?")
            params.append(room_type)
        if min_price is not None:
            where_clauses.append("price_month >= ?")
            params.append(min_price)
        if max_price is not None:
            where_clauses.append("price_month <= ?")
            params.append(max_price)

        where_sql = " AND ".join(where_clauses)

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {where_sql}"
        count_result = self.db.fetch_one(count_sql, tuple(params) if params else None)
        total = count_result['total'] if count_result else 0

        offset = (page - 1) * page_size
        sql = f"""
            SELECT id, title, district, address, room_type, area_sqm, price_month,
                   deposit, is_shared, floor, has_elevator, has_parking,
                   images, status, created_at
            FROM {self.TABLE_NAME}
            WHERE {where_sql}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        """
        all_params = params + [page_size, offset]
        rows = self.db.fetch_all(sql, tuple(all_params))

        items = [self._parse_row(row) for row in rows]

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size,
        }

    def update_status(self, record_id: int, status: str) -> int:
        data = {'status': status}
        return self.exec.update_by_id(record_id, data)

    def refresh(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'refreshed_at': now,
            'status': ListingStatus.ACTIVE,
        }
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def _auto_expire_old(self):
        cutoff = (datetime.now() - timedelta(days=30)).isoformat()
        sql = f"""
            UPDATE {self.TABLE_NAME}
            SET status = ?
            WHERE status = ? AND refreshed_at < ?
        """
        self.db.execute(sql, (ListingStatus.EXPIRED, ListingStatus.ACTIVE, cutoff))

    def get_all_districts(self) -> List[str]:
        sql = f"SELECT DISTINCT district FROM {self.TABLE_NAME} WHERE district != '' ORDER BY district"
        rows = self.db.fetch_all(sql)
        return [row['district'] for row in rows]
