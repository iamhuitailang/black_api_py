from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ForeignTribeModel:
    TABLE_NAME = 'tb_foreign_tribe'

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
                name TEXT NOT NULL,
                era TEXT NOT NULL DEFAULT 'stone',
                strength INTEGER NOT NULL DEFAULT 10,
                attitude TEXT NOT NULL DEFAULT 'neutral',
                specialty_resource TEXT NOT NULL DEFAULT 'wood',
                trade_available INTEGER NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

    def create(self, name: str, era: str = 'stone', strength: int = 10,
               attitude: str = 'neutral', specialty_resource: str = 'wood',
               trade_available: int = 1) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'era': era,
            'strength': strength,
            'attitude': attitude,
            'specialty_resource': specialty_resource,
            'trade_available': trade_available,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id ASC')

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        kwargs['updated_at'] = now
        return self.exec.update_by_id(record_id, kwargs)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_all(self) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME}"
        return self.exec.execute_raw(sql)

    def create_many(self, tribes: List[Dict[str, Any]]) -> int:
        if not tribes:
            return 0
        now = datetime.now().isoformat()
        data_list = []
        for t in tribes:
            data_list.append({
                'name': t.get('name', '未知部落'),
                'era': t.get('era', 'stone'),
                'strength': t.get('strength', 10),
                'attitude': t.get('attitude', 'neutral'),
                'specialty_resource': t.get('specialty_resource', 'wood'),
                'trade_available': t.get('trade_available', 1),
                'created_at': now,
                'updated_at': now
            })
        return self.exec.insert_many(data_list)
