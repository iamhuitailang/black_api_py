from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class UpgradeLogModel:
    TABLE_NAME = 'tb_racing_upgrade_log'

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
                vehicle_id INTEGER NOT NULL,
                upgrade_type TEXT NOT NULL,
                cost INTEGER NOT NULL,
                old_value INTEGER,
                new_value INTEGER,
                before_track INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vehicle_id) REFERENCES tb_racing_vehicle(id)
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_vehicle ON {cls.TABLE_NAME}(vehicle_id)"
        db.execute(index_sql)

    def log(self, vehicle_id: int, upgrade_type: str, cost: int,
            old_value: int, new_value: int, before_track: int) -> int:
        data = {
            'vehicle_id': vehicle_id,
            'upgrade_type': upgrade_type,
            'cost': cost,
            'old_value': old_value,
            'new_value': new_value,
            'before_track': before_track,
            'created_at': datetime.now().isoformat()
        }
        return self.exec.insert(data)

    def get_by_vehicle(self, vehicle_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'vehicle_id': vehicle_id},
            order_by='id ASC'
        )
