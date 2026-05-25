from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class VaccineModel:
    TABLE_NAME = 'tb_chongwu_vaccine'

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
                vaccine_name TEXT NOT NULL,
                vaccine_date TEXT NOT NULL,
                next_date TEXT DEFAULT '',
                hospital TEXT DEFAULT '',
                notes TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_pet_id ON {cls.TABLE_NAME}(pet_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_date ON {cls.TABLE_NAME}(vaccine_date)"
        db.execute(index_sql)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        insert_data = {
            'pet_id': data.get('pet_id', 0),
            'vaccine_name': data.get('vaccine_name', ''),
            'vaccine_date': data.get('vaccine_date', ''),
            'next_date': data.get('next_date', ''),
            'hospital': data.get('hospital', ''),
            'notes': data.get('notes', ''),
            'created_at': now,
            'updated_at': now,
        }
        return self.exec.insert(insert_data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all_by_pet_id(self, pet_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        conditions = {'pet_id': pet_id}
        return self.query.paginate(page, page_size, conditions, order_by='vaccine_date DESC, id DESC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'vaccine_name', 'vaccine_date', 'next_date', 'hospital', 'notes'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_dict(self, vaccine: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': vaccine.get('id'),
            'pet_id': vaccine.get('pet_id'),
            'vaccine_name': vaccine.get('vaccine_name'),
            'vaccine_date': vaccine.get('vaccine_date'),
            'next_date': vaccine.get('next_date'),
            'hospital': vaccine.get('hospital'),
            'notes': vaccine.get('notes'),
            'created_at': vaccine.get('created_at'),
            'updated_at': vaccine.get('updated_at'),
        }