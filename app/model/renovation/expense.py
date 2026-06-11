from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ExpenseModel:
    TABLE_NAME = 'tb_renovation_expense'

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
                room_id INTEGER NOT NULL,
                category TEXT NOT NULL,
                amount REAL NOT NULL,
                date TEXT NOT NULL,
                note TEXT DEFAULT '',
                image_url TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (room_id) REFERENCES tb_renovation_room(id)
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_room_id ON {cls.TABLE_NAME}(room_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category ON {cls.TABLE_NAME}(category)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_date ON {cls.TABLE_NAME}(date)"
        db.execute(index_sql3)

    def create(self, room_id: int, category: str, amount: float, date: str, note: str = '', image_url: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'room_id': room_id,
            'category': category,
            'amount': amount,
            'date': date,
            'note': note,
            'image_url': image_url,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='date DESC, id DESC')

    def get_by_room(self, room_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(conditions={'room_id': room_id}, order_by='date DESC, id DESC')

    def get_by_category(self, category: str) -> List[Dict[str, Any]]:
        return self.query.find_all(conditions={'category': category}, order_by='date DESC, id DESC')

    def get_by_date_range(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE date >= ? AND date <= ? ORDER BY date DESC, id DESC"
        return self.db.fetch_all(sql, (start_date, end_date))

    def get_filtered(self, room_id: int = None, category: str = None, start_date: str = None, end_date: str = None) -> List[Dict[str, Any]]:
        conditions = []
        params = []
        if room_id is not None:
            conditions.append("room_id = ?")
            params.append(room_id)
        if category is not None:
            conditions.append("category = ?")
            params.append(category)
        if start_date is not None:
            conditions.append("date >= ?")
            params.append(start_date)
        if end_date is not None:
            conditions.append("date <= ?")
            params.append(end_date)

        where_clause = " AND ".join(conditions) if conditions else "1=1"
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE {where_clause} ORDER BY date DESC, id DESC"
        return self.db.fetch_all(sql, tuple(params) if params else None)

    def update(self, record_id: int, room_id: int = None, category: str = None, amount: float = None, date: str = None, note: str = None, image_url: str = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        if room_id is not None:
            data['room_id'] = room_id
        if category is not None:
            data['category'] = category
        if amount is not None:
            data['amount'] = amount
        if date is not None:
            data['date'] = date
        if note is not None:
            data['note'] = note
        if image_url is not None:
            data['image_url'] = image_url
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def sum_by_room(self) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT room_id, SUM(amount) as total_amount
            FROM {self.TABLE_NAME}
            GROUP BY room_id
        """
        return self.db.fetch_all(sql)

    def sum_by_category(self) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT category, SUM(amount) as total_amount
            FROM {self.TABLE_NAME}
            GROUP BY category
        """
        return self.db.fetch_all(sql)

    def total_amount(self) -> float:
        sql = f"SELECT SUM(amount) as total FROM {self.TABLE_NAME}"
        result = self.db.fetch_one(sql)
        return result['total'] if result and result['total'] else 0
