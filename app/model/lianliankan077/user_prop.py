from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class LlkUserPropModel:
    TABLE_NAME = 'tb_lianliankan077_model_user_prop'

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
                prop_id INTEGER NOT NULL,
                quantity INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE UNIQUE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_prop ON {cls.TABLE_NAME}(user_id, prop_id)"
        db.execute(index_sql2)

    def get_by_user_and_prop(self, user_id: int, prop_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'prop_id': prop_id})

    def add_prop(self, user_id: int, prop_id: int, quantity: int = 1) -> int:
        existing = self.get_by_user_and_prop(user_id, prop_id)
        now = datetime.now().isoformat()

        if existing:
            new_quantity = existing.get('quantity', 0) + quantity
            data = {
                'quantity': new_quantity,
                'updated_at': now
            }
            return self.exec.update_by_id(existing.get('id'), data)
        else:
            data = {
                'user_id': user_id,
                'prop_id': prop_id,
                'quantity': quantity,
                'created_at': now,
                'updated_at': now
            }
            return self.exec.insert(data)

    def use_prop(self, user_id: int, prop_id: int, quantity: int = 1) -> Dict[str, Any]:
        existing = self.get_by_user_and_prop(user_id, prop_id)
        if not existing:
            return {'success': False, 'msg': '没有该道具'}

        current_quantity = existing.get('quantity', 0)
        if current_quantity < quantity:
            return {'success': False, 'msg': '道具数量不足'}

        now = datetime.now().isoformat()
        new_quantity = current_quantity - quantity

        if new_quantity <= 0:
            self.exec.delete_by_id(existing.get('id'))
        else:
            data = {
                'quantity': new_quantity,
                'updated_at': now
            }
            self.exec.update_by_id(existing.get('id'), data)

        return {'success': True, 'remaining': new_quantity}

    def get_user_props(self, user_id: int) -> list:
        return self.query.find_all(
            conditions={'user_id': user_id},
            order_by='id ASC'
        )

    def get_user_prop_detail(self, user_id: int) -> list:
        sql = f"""
            SELECT up.id, up.user_id, up.prop_id, up.quantity,
                   p.name as prop_name, p.icon as prop_icon,
                   p.description as prop_description, p.effect_type, p.effect_value, p.price
            FROM {self.TABLE_NAME} up
            LEFT JOIN tb_lianliankan077_model_prop p ON up.prop_id = p.id
            WHERE up.user_id = ? AND up.quantity > 0
            ORDER BY p.sort_order ASC
        """
        return self.db.fetch_all(sql, (user_id,))

    def delete_by_user(self, user_id: int) -> int:
        return self.exec.delete({'user_id': user_id})
