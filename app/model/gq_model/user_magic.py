from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GqUserMagicModel:
    TABLE_NAME = 'tb_gq_model_user_magic'

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
                magic_id INTEGER NOT NULL,
                is_equipped INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE UNIQUE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id_magic_id ON {cls.TABLE_NAME}(user_id, magic_id)"
        db.execute(index_sql)

    def create(self, user_id: int, magic_id: int, is_equipped: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'magic_id': magic_id,
            'is_equipped': is_equipped,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_user_magics(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='id ASC')

    def get_equipped_magics(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id, 'is_equipped': 1}, order_by='id ASC')

    def equip_magic(self, user_id: int, magic_id: int) -> int:
        now = datetime.now().isoformat()
        data = {'is_equipped': 1, 'created_at': now}
        return self.exec.update(data, conditions={'user_id': user_id, 'magic_id': magic_id})

    def unequip_magic(self, user_id: int, magic_id: int) -> int:
        now = datetime.now().isoformat()
        data = {'is_equipped': 0, 'created_at': now}
        return self.exec.update(data, conditions={'user_id': user_id, 'magic_id': magic_id})

    def unequip_all(self, user_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET is_equipped = 0 WHERE user_id = ?"
        cursor = self.db.execute(sql, (user_id,))
        return cursor.rowcount

    def has_magic(self, user_id: int, magic_id: int) -> bool:
        return self.query.exists({'user_id': user_id, 'magic_id': magic_id})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_user(self, user_id: int) -> int:
        return self.exec.delete({'user_id': user_id})
