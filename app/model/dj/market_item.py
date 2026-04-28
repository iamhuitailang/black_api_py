from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class MarketItemModel:
    TABLE_NAME = 'tb_dj_market_item'

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
                category_id INTEGER,
                category_name TEXT,
                area_desc TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_market_id ON {cls.TABLE_NAME}(market_id)"
        db.execute(index_sql)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        insert_data = {
            'market_id': data.get('market_id'),
            'category_id': data.get('category_id'),
            'category_name': data.get('category_name'),
            'area_desc': data.get('area_desc'),
            'created_at': now
        }
        return self.exec.insert(insert_data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_market_id(self, market_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all_by_field('market_id', market_id, order_by='id ASC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_market_id(self, market_id: int) -> int:
        return self.exec.delete({'market_id': market_id})

    def count(self, conditions: Dict[str, Any] = None) -> int:
        return self.query.count(conditions)
