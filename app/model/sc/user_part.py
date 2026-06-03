from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ScUserPartModel:
    TABLE_NAME = 'tb_sc_model_user_parts'

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
                part_id INTEGER NOT NULL,
                quantity INTEGER DEFAULT 1,
                acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_part_id ON {cls.TABLE_NAME}(part_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_part ON {cls.TABLE_NAME}(user_id, part_id)"
        db.execute(index_sql)

    def create(self, user_id: int, part_id: int, quantity: int = 1) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'part_id': part_id,
            'quantity': quantity,
            'acquired_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        return self.query.paginate(page, page_size, conditions, order_by='acquired_at DESC')

    def get_by_user_and_part(self, user_id: int, part_id: int) -> Optional[Dict[str, Any]]:
        conditions = {
            'user_id': user_id,
            'part_id': part_id
        }
        return self.query.find_one(conditions)

    def update_quantity(self, record_id: int, quantity: int) -> int:
        data = {
            'quantity': max(0, quantity)
        }
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
