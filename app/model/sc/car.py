from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ScCarModel:
    TABLE_NAME = 'tb_sc_model_cars'

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
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                primary_color TEXT DEFAULT '#FF0000',
                secondary_color TEXT DEFAULT '#000000',
                accent_color TEXT DEFAULT '#FFFFFF',
                body_style TEXT DEFAULT 'sedan',
                total_weight INTEGER DEFAULT 0,
                total_power INTEGER DEFAULT 0,
                total_grip INTEGER DEFAULT 0,
                total_aerodynamics INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_active ON {cls.TABLE_NAME}(is_active)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_active ON {cls.TABLE_NAME}(user_id, is_active)"
        db.execute(index_sql)

    def create(self, user_id: int, name: str, description: str = '',
               primary_color: str = '#FF0000', secondary_color: str = '#000000',
               accent_color: str = '#FFFFFF', body_style: str = 'sedan') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'name': name,
            'description': description,
            'primary_color': primary_color,
            'secondary_color': secondary_color,
            'accent_color': accent_color,
            'body_style': body_style,
            'total_weight': 0,
            'total_power': 0,
            'total_grip': 0,
            'total_aerodynamics': 0,
            'is_active': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        return self.query.paginate(page, page_size, conditions, order_by='is_active DESC, updated_at DESC')

    def get_active_car(self, user_id: int) -> Optional[Dict[str, Any]]:
        conditions = {
            'user_id': user_id,
            'is_active': 1
        }
        return self.query.find_one(conditions)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'primary_color', 'secondary_color',
            'accent_color', 'body_style'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def update_stats(self, record_id: int, total_weight: int, total_power: int,
                     total_grip: int, total_aerodynamics: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'total_weight': total_weight,
            'total_power': total_power,
            'total_grip': total_grip,
            'total_aerodynamics': total_aerodynamics,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def set_active(self, record_id: int, user_id: int) -> int:
        self.db.execute(f"UPDATE {self.TABLE_NAME} SET is_active = 0 WHERE user_id = ?", (user_id,))
        now = datetime.now().isoformat()
        data = {
            'is_active': 1,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
