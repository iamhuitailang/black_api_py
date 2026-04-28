from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class PriceModel:
    TABLE_NAME = 'tb_dj_price'

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
                market_id INTEGER NOT NULL,
                item_name TEXT NOT NULL,
                category_id INTEGER,
                category_name TEXT,
                min_price REAL,
                max_price REAL,
                unit TEXT DEFAULT '斤',
                user_id INTEGER,
                report_status INTEGER DEFAULT 0,
                auditor_id INTEGER,
                audit_time TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql1 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_market_id ON {cls.TABLE_NAME}(market_id)"
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_report_status ON {cls.TABLE_NAME}(report_status)"
        db.execute(index_sql1)
        db.execute(index_sql2)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        insert_data = {
            'market_id': data.get('market_id'),
            'item_name': data.get('item_name'),
            'category_id': data.get('category_id'),
            'category_name': data.get('category_name'),
            'min_price': data.get('min_price'),
            'max_price': data.get('max_price'),
            'unit': data.get('unit', '斤'),
            'user_id': data.get('user_id'),
            'report_status': data.get('report_status', 0),
            'created_at': now
        }
        return self.exec.insert(insert_data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_market_id(self, market_id: int, report_status: int = 1) -> List[Dict[str, Any]]:
        conditions = {'market_id': market_id}
        if report_status is not None:
            conditions['report_status'] = report_status
        return self.query.find_all(conditions, order_by='created_at DESC')

    def get_pending_reports(self) -> List[Dict[str, Any]]:
        return self.query.find_all({'report_status': 0}, order_by='created_at ASC')

    def get_latest_by_market_and_item(self, market_id: int, item_name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one(
            {'market_id': market_id, 'item_name': item_name, 'report_status': 1},
            order_by='created_at DESC'
        )

    def get_price_trend(self, market_id: int, item_name: str, limit: int = 30) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT id, min_price, max_price, unit, created_at
            FROM {self.TABLE_NAME}
            WHERE market_id = ? AND item_name = ? AND report_status = 1
            ORDER BY created_at ASC
            LIMIT ?
        """
        return self.db.fetch_all(sql, (market_id, item_name, limit))

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        return self.exec.update_by_id(record_id, data)

    def audit_price(self, record_id: int, auditor_id: int, report_status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'report_status': report_status,
            'auditor_id': auditor_id,
            'audit_time': now
        }
        return self.update(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def paginate(self, page: int = 1, page_size: int = 10, conditions: Dict[str, Any] = None):
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def count(self, conditions: Dict[str, Any] = None) -> int:
        return self.query.count(conditions)
