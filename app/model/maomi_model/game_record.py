from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameRecordModel:
    TABLE_NAME = 'tb_maomi_model_game_record'

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
                record_type TEXT NOT NULL,
                record_data TEXT DEFAULT '',
                coins_change INTEGER DEFAULT 0,
                exp_change INTEGER DEFAULT 0,
                description TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(record_type)"
        db.execute(index_sql2)

    def create(self, user_id: int, record_type: str, record_data: str = '',
               coins_change: int = 0, exp_change: int = 0, description: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'record_type': record_type,
            'record_data': record_data,
            'coins_change': coins_change,
            'exp_change': exp_change,
            'description': description,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int, limit: int = 100) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id},
                                    order_by='created_at DESC',
                                    limit=limit)

    def get_by_type(self, user_id: int, record_type: str, limit: int = 50) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id, 'record_type': record_type},
                                    order_by='created_at DESC',
                                    limit=limit)

    def get_today_records(self, user_id: int) -> List[Dict[str, Any]]:
        today = datetime.now().strftime('%Y-%m-%d')
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE user_id = ? AND created_at LIKE ? ORDER BY created_at DESC"
        return self.db.fetch_all(sql, (user_id, f"{today}%"))

    def get_statistics(self, user_id: int) -> Dict[str, Any]:
        sql = f"""
            SELECT 
                record_type,
                COUNT(*) as count,
                SUM(coins_change) as total_coins,
                SUM(exp_change) as total_exp
            FROM {self.TABLE_NAME} 
            WHERE user_id = ? 
            GROUP BY record_type
            ORDER BY count DESC
        """
        result = self.db.fetch_all(sql, (user_id,))
        return result or []

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id DESC')

    def count(self) -> int:
        return self.query.count()

    def add_order_record(self, user_id: int, order_no: str, income: int, tip: int, description: str = '') -> int:
        return self.create(
            user_id=user_id,
            record_type='order',
            record_data=order_no,
            coins_change=income + tip,
            exp_change=10,
            description=description or '完成订单'
        )

    def add_purchase_record(self, user_id: int, item_name: str, cost: int, description: str = '') -> int:
        return self.create(
            user_id=user_id,
            record_type='purchase',
            record_data=item_name,
            coins_change=-cost,
            exp_change=5,
            description=description or f'购买了{item_name}'
        )

    def add_activity_record(self, user_id: int, activity_name: str, reward: int, exp: int, description: str = '') -> int:
        return self.create(
            user_id=user_id,
            record_type='activity',
            record_data=activity_name,
            coins_change=reward,
            exp_change=exp,
            description=description or f'完成活动{activity_name}'
        )

    def add_cat_record(self, user_id: int, cat_name: str, action: str, description: str = '') -> int:
        return self.create(
            user_id=user_id,
            record_type='cat',
            record_data=cat_name,
            coins_change=0,
            exp_change=5,
            description=description or f'{action}猫咪{cat_name}'
        )
