from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class UserProfileModel:
    TABLE_NAME = 'tb_express_user_profile'
    
    DEFAULT_AVATARS = [
        'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=4',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=5',
    ]
    
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
                user_id INTEGER NOT NULL UNIQUE,
                nickname TEXT NOT NULL,
                avatar TEXT NOT NULL,
                reputation INTEGER DEFAULT 100,
                total_orders INTEGER DEFAULT 0,
                completed_orders INTEGER DEFAULT 0,
                balance REAL DEFAULT 0.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
    
    def get_by_user_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id})
    
    def create_profile(self, user_id: int, nickname: str = None, avatar: str = None) -> int:
        now = datetime.now().isoformat()
        if nickname is None:
            nickname = f'用户{user_id}'
        if avatar is None:
            import random
            avatar = f'https://api.dicebear.com/7.x/avataaars/svg?seed={user_id}'
        
        data = {
            'user_id': user_id,
            'nickname': nickname,
            'avatar': avatar,
            'reputation': 100,
            'total_orders': 0,
            'completed_orders': 0,
            'balance': 0.0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)
    
    def get_or_create_profile(self, user_id: int, nickname: str = None) -> Dict[str, Any]:
        profile = self.get_by_user_id(user_id)
        if profile:
            return profile
        
        self.create_profile(user_id, nickname)
        return self.get_by_user_id(user_id)
    
    def update_profile(self, user_id: int, nickname: str = None, avatar: str = None) -> int:
        existing = self.get_by_user_id(user_id)
        if not existing:
            return 0
        
        data = {}
        if nickname is not None:
            data['nickname'] = nickname
        if avatar is not None:
            data['avatar'] = avatar
        
        if not data:
            return 0
        
        data['updated_at'] = datetime.now().isoformat()
        return self.exec.update(data, {'user_id': user_id})
    
    def update_reputation(self, user_id: int, change: int) -> int:
        profile = self.get_by_user_id(user_id)
        if not profile:
            return 0
        
        new_reputation = max(0, min(100, profile.get('reputation', 100) + change))
        data = {
            'reputation': new_reputation,
            'updated_at': datetime.now().isoformat()
        }
        return self.exec.update(data, {'user_id': user_id})
    
    def update_balance(self, user_id: int, amount: float) -> int:
        profile = self.get_by_user_id(user_id)
        if not profile:
            return 0
        
        new_balance = profile.get('balance', 0.0) + amount
        data = {
            'balance': new_balance,
            'updated_at': datetime.now().isoformat()
        }
        return self.exec.update(data, {'user_id': user_id})
    
    def increment_total_orders(self, user_id: int) -> int:
        profile = self.get_by_user_id(user_id)
        if not profile:
            return 0
        
        data = {
            'total_orders': profile.get('total_orders', 0) + 1,
            'updated_at': datetime.now().isoformat()
        }
        return self.exec.update(data, {'user_id': user_id})
    
    def increment_completed_orders(self, user_id: int) -> int:
        profile = self.get_by_user_id(user_id)
        if not profile:
            return 0
        
        data = {
            'completed_orders': profile.get('completed_orders', 0) + 1,
            'updated_at': datetime.now().isoformat()
        }
        return self.exec.update(data, {'user_id': user_id})
    
    def get_rank_list(self, limit: int = 20) -> list:
        sql = f"""
            SELECT p.*, u.username 
            FROM {self.TABLE_NAME} p
            JOIN tb_auth_user u ON p.user_id = u.id
            WHERE u.status = 1
            ORDER BY p.reputation DESC, p.completed_orders DESC
            LIMIT ?
        """
        return self.db.fetch_all(sql, (limit,))
