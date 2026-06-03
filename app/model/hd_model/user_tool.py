from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class UserToolModel:
    TABLE_NAME = 'tb_hd_model_user_tool'

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
                tool_id INTEGER NOT NULL,
                quantity INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_tool_id ON {cls.TABLE_NAME}(tool_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_tool ON {cls.TABLE_NAME}(user_id, tool_id)"
        db.execute(index_sql)

    def create(self, user_id: int, tool_id: int, quantity: int = 1) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'tool_id': tool_id,
            'quantity': quantity,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_user_tool(self, user_id: int, tool_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({
            'user_id': user_id,
            'tool_id': tool_id
        })

    def get_user_tools(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT ut.*, t.name, t.description, t.type, t.effect, t.damage, 
                   t.heal, t.duration, t.price, t.icon
            FROM {self.TABLE_NAME} ut
            LEFT JOIN tb_hd_model_tool t ON ut.tool_id = t.id
            WHERE ut.user_id = ? AND ut.quantity > 0
            ORDER BY t.type ASC, t.price ASC
        """
        return self.query.query_raw(sql, (user_id,))

    def get_all(self, page: int = 1, page_size: int = 10, user_id: int = None,
                tool_id: int = None) -> Dict[str, Any]:
        conditions = {}
        if user_id is not None:
            conditions['user_id'] = user_id
        if tool_id is not None:
            conditions['tool_id'] = tool_id
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def update(self, record_id: int, quantity: int = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        if quantity is not None:
            data['quantity'] = quantity
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()

    def add_tool(self, user_id: int, tool_id: int, quantity: int = 1) -> Optional[Dict[str, Any]]:
        if quantity <= 0:
            return None

        now = datetime.now().isoformat()
        existing = self.get_user_tool(user_id, tool_id)

        if existing:
            new_quantity = existing.get('quantity', 0) + quantity
            self.exec.update_by_id(existing['id'], {
                'quantity': new_quantity,
                'updated_at': now
            })
            return self.get_by_id(existing['id'])
        else:
            record_id = self.create(user_id, tool_id, quantity)
            return self.get_by_id(record_id)

    def use_tool(self, user_id: int, tool_id: int, quantity: int = 1) -> Optional[Dict[str, Any]]:
        if quantity <= 0:
            return None

        existing = self.get_user_tool(user_id, tool_id)
        if not existing:
            return None

        current_quantity = existing.get('quantity', 0)
        if current_quantity < quantity:
            return None

        now = datetime.now().isoformat()
        new_quantity = current_quantity - quantity

        if new_quantity <= 0:
            self.exec.delete_by_id(existing['id'])
            return None
        else:
            self.exec.update_by_id(existing['id'], {
                'quantity': new_quantity,
                'updated_at': now
            })
            return self.get_by_id(existing['id'])

    def remove_tool(self, user_id: int, tool_id: int) -> bool:
        existing = self.get_user_tool(user_id, tool_id)
        if not existing:
            return False

        self.exec.delete_by_id(existing['id'])
        return True
