from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class OrderModel:
    TABLE_NAME = 'tb_maomi_model_order'

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
                order_no TEXT NOT NULL UNIQUE,
                customer_name TEXT NOT NULL,
                customer_avatar TEXT DEFAULT '',
                drink_ids TEXT DEFAULT '',
                drink_names TEXT DEFAULT '',
                total_amount INTEGER NOT NULL,
                tip_amount INTEGER DEFAULT 0,
                cat_id INTEGER DEFAULT 0,
                cat_name TEXT DEFAULT '',
                satisfaction INTEGER DEFAULT 80,
                status TEXT DEFAULT 'pending',
                is_special INTEGER DEFAULT 0,
                activity_id INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP DEFAULT ''
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_order_no ON {cls.TABLE_NAME}(order_no)"
        db.execute(index_sql3)

    def create(self, user_id: int, customer_name: str, drink_ids: str, drink_names: str,
               total_amount: int, cat_id: int = 0, cat_name: str = '', customer_avatar: str = '',
               is_special: int = 0, activity_id: int = 0) -> int:
        now = datetime.now().isoformat()
        order_no = f"ORD{datetime.now().strftime('%Y%m%d%H%M%S')}{user_id}"
        data = {
            'user_id': user_id,
            'order_no': order_no,
            'customer_name': customer_name,
            'customer_avatar': customer_avatar,
            'drink_ids': drink_ids,
            'drink_names': drink_names,
            'total_amount': total_amount,
            'tip_amount': 0,
            'cat_id': cat_id,
            'cat_name': cat_name,
            'satisfaction': 80,
            'status': 'pending',
            'is_special': is_special,
            'activity_id': activity_id,
            'created_at': now,
            'updated_at': now,
            'completed_at': ''
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_order_no(self, order_no: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'order_no': order_no})

    def get_by_user_id(self, user_id: int, limit: int = 20) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id},
                                    order_by='created_at DESC',
                                    limit=limit)

    def get_pending_orders(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id, 'status': 'pending'},
                                    order_by='created_at ASC')

    def get_completed_orders(self, user_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id, 'status': 'completed'},
                                    order_by='created_at DESC',
                                    limit=limit)

    def get_today_orders(self, user_id: int) -> List[Dict[str, Any]]:
        today = datetime.now().strftime('%Y-%m-%d')
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE user_id = ? AND created_at LIKE ? ORDER BY created_at DESC"
        return self.db.fetch_all(sql, (user_id, f"{today}%"))

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        for key, value in kwargs.items():
            if value is not None:
                data[key] = value
        return self.exec.update_by_id(record_id, data)

    def complete_order(self, record_id: int, tip_amount: int = 0, satisfaction: int = 80) -> Optional[Dict[str, Any]]:
        order = self.get_by_id(record_id)
        if not order:
            return None
        now = datetime.now().isoformat()
        self.update(record_id, status='completed', tip_amount=tip_amount,
                    satisfaction=satisfaction, completed_at=now)
        return self.get_by_id(record_id)

    def cancel_order(self, record_id: int) -> Optional[Dict[str, Any]]:
        order = self.get_by_id(record_id)
        if not order:
            return None
        self.update(record_id, status='cancelled')
        return self.get_by_id(record_id)

    def get_statistics(self, user_id: int) -> Dict[str, Any]:
        today = datetime.now().strftime('%Y-%m-%d')
        sql = f"""
            SELECT 
                COALESCE(COUNT(*), 0) as total_orders,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed_orders,
                COALESCE(SUM(CASE WHEN created_at LIKE ? THEN 1 ELSE 0 END), 0) as today_orders,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN tip_amount ELSE 0 END), 0) as total_tips,
                COALESCE(AVG(CASE WHEN status = 'completed' THEN satisfaction ELSE NULL END), 0) as avg_satisfaction
            FROM {self.TABLE_NAME} WHERE user_id = ?
        """
        result = self.db.fetch_one(sql, (f"{today}%", user_id))
        return result or {
            'total_orders': 0,
            'completed_orders': 0,
            'today_orders': 0,
            'total_income': 0,
            'total_tips': 0,
            'avg_satisfaction': 0
        }

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id DESC')

    def count(self) -> int:
        return self.query.count()
