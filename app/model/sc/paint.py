from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ScPaintModel:
    TABLE_NAME = 'tb_sc_model_paints'

    TYPE_SOLID = 'solid'
    TYPE_METALLIC = 'metallic'
    TYPE_MATTE = 'matte'
    TYPE_PEARLESCENT = 'pearlescent'

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
                type TEXT NOT NULL DEFAULT 'solid',
                color_hex TEXT NOT NULL,
                price INTEGER DEFAULT 0,
                user_id INTEGER NOT NULL,
                is_public INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_public ON {cls.TABLE_NAME}(is_public)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)

    def create(self, name: str, type: str, color_hex: str, price: int, user_id: int, is_public: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'type': type,
            'color_hex': color_hex,
            'price': price,
            'user_id': user_id,
            'is_public': is_public,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='id DESC')

    def get_public_paints(self, type: str = None) -> List[Dict[str, Any]]:
        conditions = {'is_public': 1}
        if type:
            conditions['type'] = type
        return self.query.find_all(conditions, order_by='id DESC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'type', 'color_hex', 'price', 'is_public'
        ]}
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_type_text(self, type: str) -> str:
        type_map = {
            self.TYPE_SOLID: '纯色',
            self.TYPE_METALLIC: '金属漆',
            self.TYPE_MATTE: '哑光漆',
            self.TYPE_PEARLESCENT: '珠光漆'
        }
        return type_map.get(type, '未知')
