from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameSessionModel:
    TABLE_NAME = 'tb_yeshi_model_game_session'
    
    STATUS_ACTIVE = 'active'
    STATUS_PAUSED = 'paused'
    STATUS_ENDED = 'ended'
    
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
                session_name TEXT,
                status TEXT DEFAULT 'active',
                start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                end_time TIMESTAMP,
                duration_seconds INTEGER DEFAULT 0,
                orders_completed INTEGER DEFAULT 0,
                orders_failed INTEGER DEFAULT 0,
                gold_earned INTEGER DEFAULT 0,
                exp_earned INTEGER DEFAULT 0,
                peak_customers INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(game_user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql2)

    def create(self, game_user_id: int, session_name: str = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'game_user_id': game_user_id,
            'session_name': session_name or f"营业_{datetime.now().strftime('%Y%m%d_%H%M')}",
            'status': self.STATUS_ACTIVE,
            'start_time': now,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_active_session(self, game_user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({
            'game_user_id': game_user_id,
            'status': self.STATUS_ACTIVE
        })

    def get_recent_sessions(self, game_user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        return self.query.find_all(
            {'game_user_id': game_user_id},
            order_by='start_time DESC',
            limit=limit
        )

    def pause_session(self, session_id: int) -> int:
        now = datetime.now().isoformat()
        session = self.get_by_id(session_id)
        if not session or session.get('status') != self.STATUS_ACTIVE:
            return 0
        
        start_time = datetime.fromisoformat(session.get('start_time', now))
        duration = int((datetime.now() - start_time).total_seconds())
        
        data = {
            'status': self.STATUS_PAUSED,
            'duration_seconds': duration,
            'updated_at': now
        }
        return self.exec.update_by_id(session_id, data)

    def resume_session(self, session_id: int) -> int:
        now = datetime.now().isoformat()
        session = self.get_by_id(session_id)
        if not session or session.get('status') != self.STATUS_PAUSED:
            return 0
        
        data = {
            'status': self.STATUS_ACTIVE,
            'start_time': now,
            'updated_at': now
        }
        return self.exec.update_by_id(session_id, data)

    def end_session(self, session_id: int) -> Dict[str, Any]:
        now = datetime.now().isoformat()
        session = self.get_by_id(session_id)
        if not session:
            return {}
        
        start_time = datetime.fromisoformat(session.get('start_time', now))
        duration = int((datetime.now() - start_time).total_seconds()) + session.get('duration_seconds', 0)
        
        data = {
            'status': self.STATUS_ENDED,
            'end_time': now,
            'duration_seconds': duration,
            'updated_at': now
        }
        self.exec.update_by_id(session_id, data)
        
        session.update(data)
        return session

    def add_order_completed(self, session_id: int, gold: int, exp: int) -> int:
        session = self.get_by_id(session_id)
        if not session:
            return 0
        
        data = {
            'orders_completed': session.get('orders_completed', 0) + 1,
            'gold_earned': session.get('gold_earned', 0) + gold,
            'exp_earned': session.get('exp_earned', 0) + exp,
            'updated_at': datetime.now().isoformat()
        }
        return self.exec.update_by_id(session_id, data)

    def add_order_failed(self, session_id: int) -> int:
        session = self.get_by_id(session_id)
        if not session:
            return 0
        
        data = {
            'orders_failed': session.get('orders_failed', 0) + 1,
            'updated_at': datetime.now().isoformat()
        }
        return self.exec.update_by_id(session_id, data)

    def update_peak_customers(self, session_id: int, current_count: int) -> int:
        session = self.get_by_id(session_id)
        if not session:
            return 0
        
        if current_count > session.get('peak_customers', 0):
            data = {
                'peak_customers': current_count,
                'updated_at': datetime.now().isoformat()
            }
            return self.exec.update_by_id(session_id, data)
        return 0

    def get_user_stats(self, game_user_id: int) -> Dict[str, Any]:
        sql = f"""
            SELECT 
                COUNT(*) as total_sessions,
                SUM(duration_seconds) as total_duration,
                SUM(orders_completed) as total_orders,
                SUM(orders_failed) as total_failed,
                SUM(gold_earned) as total_gold,
                SUM(exp_earned) as total_exp,
                MAX(peak_customers) as max_peak_customers
            FROM {self.TABLE_NAME} 
            WHERE game_user_id = ? AND status = 'ended'
        """
        result = self.db.fetch_one(sql, (game_user_id,))
        return result or {}

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['updated_at'] = now
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
