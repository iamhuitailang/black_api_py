from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class HealthModel:
    TABLE_NAME = 'tb_chongwu_health'

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
                pet_id INTEGER NOT NULL,
                vaccines TEXT DEFAULT '',
                deworming TEXT DEFAULT '',
                other_issues TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_pet_id ON {cls.TABLE_NAME}(pet_id)"
        db.execute(index_sql)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        insert_data = {
            'pet_id': data.get('pet_id', 0),
            'vaccines': data.get('vaccines', ''),
            'deworming': data.get('deworming', ''),
            'other_issues': data.get('other_issues', ''),
            'created_at': now,
            'updated_at': now,
        }
        return self.exec.insert(insert_data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_pet_id(self, pet_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'pet_id': pet_id}, order_by='id DESC')

    def get_all_by_pet_id(self, pet_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        conditions = {'pet_id': pet_id}
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'vaccines', 'deworming', 'other_issues'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_dict(self, health: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': health.get('id'),
            'pet_id': health.get('pet_id'),
            'vaccines': health.get('vaccines', '').split(','),
            'deworming': health.get('deworming', '').split(','),
            'other_issues': health.get('other_issues'),
            'created_at': health.get('created_at'),
            'updated_at': health.get('updated_at'),
        }