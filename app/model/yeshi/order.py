from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class OrderModel:
    TABLE_NAME = 'tb_yeshi_model_order'
    
    STATUS_PENDING = 'pending'
    STATUS_COOKING = 'cooking'
    STATUS_COMPLETED = 'completed'
    STATUS_FAILED = 'failed'
    STATUS_CANCELLED = 'cancelled'
    
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
                game_user_id INTEGER NOT NULL,
                guest_id INTEGER,
                guest_name TEXT,
                food_id INTEGER NOT NULL,
                food_name TEXT NOT NULL,
                food_icon TEXT,
                special_request TEXT,
                base_price INTEGER DEFAULT 0,
                final_price INTEGER DEFAULT 0,
                cook_time INTEGER DEFAULT 0,
                difficulty INTEGER DEFAULT 1,
                status TEXT DEFAULT 'pending',
                quality INTEGER DEFAULT 0,
                time_spent INTEGER DEFAULT 0,
                customer_satisfaction INTEGER DEFAULT 0,
                experience_earned INTEGER DEFAULT 0,
                gold_earned INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(game_user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql2)

    def create(self, game_user_id: int, food_id: int, food_name: str, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {
            'game_user_id': game_user_id,
            'food_id': food_id,
            'food_name': food_name,
            'status': self.STATUS_PENDING,
            'created_at': now,
            'updated_at': now
        }
        data.update(kwargs)
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, game_user_id: int, status: str = None) -> List[Dict[str, Any]]:
        conditions = {'game_user_id': game_user_id}
        if status:
            conditions['status'] = status
        return self.query.find_all(conditions, order_by='created_at DESC')

    def get_pending_orders(self, game_user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE game_user_id = ? AND status IN ('pending', 'cooking')
            ORDER BY created_at ASC
        """
        return self.db.fetch_all(sql, (game_user_id,))

    def start_cooking(self, order_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_COOKING,
            'started_at': now,
            'updated_at': now
        }
        return self.exec.update_by_id(order_id, data)

    def complete_order(self, order_id: int, success: bool = True, quality: int = 80, time_spent: int = 0) -> Dict[str, Any]:
        order = self.get_by_id(order_id)
        if not order:
            return {}
        
        now = datetime.now().isoformat()
        base_price = order.get('base_price', 0)
        
        if success:
            satisfaction = min(100, max(0, quality - time_spent * 2))
            gold_earned = int(base_price * (0.8 + satisfaction / 200))
            exp_earned = int(order.get('difficulty', 1) * 10 * (satisfaction / 100))
            
            data = {
                'status': self.STATUS_COMPLETED,
                'quality': quality,
                'time_spent': time_spent,
                'customer_satisfaction': satisfaction,
                'final_price': gold_earned,
                'experience_earned': exp_earned,
                'gold_earned': gold_earned,
                'completed_at': now,
                'updated_at': now
            }
            self.exec.update_by_id(order_id, data)
            
            return {
                'success': True,
                'gold_earned': gold_earned,
                'experience_earned': exp_earned,
                'satisfaction': satisfaction
            }
        else:
            data = {
                'status': self.STATUS_FAILED,
                'quality': 0,
                'time_spent': time_spent,
                'customer_satisfaction': 0,
                'final_price': 0,
                'experience_earned': 0,
                'gold_earned': 0,
                'completed_at': now,
                'updated_at': now
            }
            self.exec.update_by_id(order_id, data)
            
            return {
                'success': False,
                'gold_earned': 0,
                'experience_earned': 0,
                'satisfaction': 0
            }

    def cancel_order(self, order_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_CANCELLED,
            'updated_at': now
        }
        return self.exec.update_by_id(order_id, data)

    def get_user_order_stats(self, game_user_id: int) -> Dict[str, Any]:
        sql = f"""
            SELECT 
                COUNT(*) as total_orders,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_orders,
                SUM(gold_earned) as total_gold_earned,
                SUM(experience_earned) as total_exp_earned,
                AVG(customer_satisfaction) as avg_satisfaction
            FROM {self.TABLE_NAME} 
            WHERE game_user_id = ?
        """
        result = self.db.fetch_one(sql, (game_user_id,))
        return result or {}

    def get_recent_orders(self, game_user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        return self.query.find_all(
            {'game_user_id': game_user_id},
            order_by='created_at DESC',
            limit=limit
        )

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['updated_at'] = now
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
