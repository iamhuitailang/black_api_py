from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ScCarPartModel:
    TABLE_NAME = 'tb_sc_model_car_parts'

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
                car_id INTEGER NOT NULL,
                part_id INTEGER NOT NULL,
                slot_type TEXT NOT NULL,
                installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_car_id ON {cls.TABLE_NAME}(car_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_part_id ON {cls.TABLE_NAME}(part_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_car_slot ON {cls.TABLE_NAME}(car_id, slot_type)"
        db.execute(index_sql)

    def create(self, car_id: int, part_id: int, slot_type: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'car_id': car_id,
            'part_id': part_id,
            'slot_type': slot_type,
            'installed_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_car_id(self, car_id: int) -> List[Dict[str, Any]]:
        conditions = {'car_id': car_id}
        return self.query.find_all(conditions, order_by='slot_type ASC')

    def get_by_car_and_slot(self, car_id: int, slot_type: str) -> Optional[Dict[str, Any]]:
        conditions = {
            'car_id': car_id,
            'slot_type': slot_type
        }
        return self.query.find_one(conditions)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'car_id', 'part_id', 'slot_type'
        ]}
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_car_id(self, car_id: int) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE car_id = ?"
        self.db.execute(sql, (car_id,))
        return self.db.changes()
