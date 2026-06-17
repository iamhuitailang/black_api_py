from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ItemModel:
    TABLE_NAME = 'manor_item'

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
                item_id TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                item_type TEXT NOT NULL,
                location TEXT NOT NULL,
                collected INTEGER NOT NULL DEFAULT 0,
                game_state_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_item_id ON {cls.TABLE_NAME}(item_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_location ON {cls.TABLE_NAME}(location)"
        db.execute(index_sql2)

    def create(self, item_data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data = {
            'item_id': item_data['item_id'],
            'name': item_data['name'],
            'description': item_data['description'],
            'item_type': item_data['item_type'],
            'location': item_data['location'],
            'collected': item_data.get('collected', 0),
            'game_state_id': item_data.get('game_state_id'),
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_item_id(self, item_id: str) -> Optional[Dict[str, Any]]:
        return self.query.find_by_field('item_id', item_id)

    def get_by_location(self, location: str) -> List[Dict[str, Any]]:
        return self.query.find_all_by_field('location', location)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id ASC')

    def update(self, item_id: str, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['updated_at'] = now
        return self.exec.update(data, conditions={'item_id': item_id})

    def delete(self, item_id: str) -> int:
        record = self.get_by_item_id(item_id)
        if record:
            return self.exec.delete_by_id(record['id'])
        return 0
