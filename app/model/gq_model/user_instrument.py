from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GqUserInstrumentModel:
    TABLE_NAME = 'tb_gq_model_user_instrument'

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
                instrument_id INTEGER NOT NULL,
                is_equipped INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE UNIQUE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id_instrument_id ON {cls.TABLE_NAME}(user_id, instrument_id)"
        db.execute(index_sql)

    def create(self, user_id: int, instrument_id: int, is_equipped: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'instrument_id': instrument_id,
            'is_equipped': is_equipped,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_user_instruments(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='id ASC')

    def get_equipped_instrument(self, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'is_equipped': 1})

    def equip_instrument(self, user_id: int, instrument_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET is_equipped = 0 WHERE user_id = ? AND is_equipped = 1"
        self.db.execute(sql, (user_id,))

        now = datetime.now().isoformat()
        data = {'is_equipped': 1, 'created_at': now}
        return self.exec.update(data, conditions={'user_id': user_id, 'instrument_id': instrument_id})

    def unequip_instrument(self, user_id: int, instrument_id: int) -> int:
        now = datetime.now().isoformat()
        data = {'is_equipped': 0, 'created_at': now}
        return self.exec.update(data, conditions={'user_id': user_id, 'instrument_id': instrument_id})

    def has_instrument(self, user_id: int, instrument_id: int) -> bool:
        return self.query.exists({'user_id': user_id, 'instrument_id': instrument_id})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_user(self, user_id: int) -> int:
        return self.exec.delete({'user_id': user_id})
