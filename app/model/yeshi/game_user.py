from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameUserModel:
    TABLE_NAME = 'tb_yeshi_model_game_user'
    
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
                username TEXT NOT NULL,
                level INTEGER DEFAULT 1,
                experience INTEGER DEFAULT 0,
                gold INTEGER DEFAULT 100,
                reputation INTEGER DEFAULT 0,
                stall_level INTEGER DEFAULT 1,
                cooking_speed INTEGER DEFAULT 1,
                max_customers INTEGER DEFAULT 3,
                total_orders INTEGER DEFAULT 0,
                total_earnings INTEGER DEFAULT 0,
                current_weather TEXT DEFAULT 'sunny',
                last_login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)

    def create(self, user_id: int, username: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'username': username,
            'level': 1,
            'experience': 0,
            'gold': 100,
            'reputation': 0,
            'stall_level': 1,
            'cooking_speed': 1,
            'max_customers': 3,
            'total_orders': 0,
            'total_earnings': 0,
            'current_weather': 'sunny',
            'last_login_time': now,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_user_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id})

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update_gold(self, game_user_id: int, gold: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'gold': gold,
            'updated_at': now
        }
        return self.exec.update_by_id(game_user_id, data)

    def add_gold(self, game_user_id: int, amount: int) -> int:
        user = self.get_by_id(game_user_id)
        if not user:
            return 0
        new_gold = user.get('gold', 0) + amount
        return self.update_gold(game_user_id, new_gold)

    def add_experience(self, game_user_id: int, exp: int) -> Dict[str, Any]:
        user = self.get_by_id(game_user_id)
        if not user:
            return {'leveled_up': False, 'new_level': 1}
        
        current_exp = user.get('experience', 0) + exp
        current_level = user.get('level', 1)
        exp_needed = current_level * 100
        leveled_up = False
        
        while current_exp >= exp_needed:
            current_exp -= exp_needed
            current_level += 1
            exp_needed = current_level * 100
            leveled_up = True
        
        now = datetime.now().isoformat()
        data = {
            'experience': current_exp,
            'level': current_level,
            'max_customers': 3 + current_level,
            'updated_at': now
        }
        self.exec.update_by_id(game_user_id, data)
        
        return {
            'leveled_up': leveled_up,
            'new_level': current_level,
            'new_exp': current_exp
        }

    def add_reputation(self, game_user_id: int, amount: int) -> int:
        user = self.get_by_id(game_user_id)
        if not user:
            return 0
        new_rep = max(0, user.get('reputation', 0) + amount)
        now = datetime.now().isoformat()
        data = {
            'reputation': new_rep,
            'updated_at': now
        }
        self.exec.update_by_id(game_user_id, data)
        return new_rep

    def update_stall_level(self, game_user_id: int, level: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'stall_level': level,
            'updated_at': now
        }
        return self.exec.update_by_id(game_user_id, data)

    def update_cooking_speed(self, game_user_id: int, speed: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'cooking_speed': speed,
            'updated_at': now
        }
        return self.exec.update_by_id(game_user_id, data)

    def record_order(self, game_user_id: int, earnings: int) -> int:
        user = self.get_by_id(game_user_id)
        if not user:
            return 0
        now = datetime.now().isoformat()
        data = {
            'total_orders': user.get('total_orders', 0) + 1,
            'total_earnings': user.get('total_earnings', 0) + earnings,
            'updated_at': now
        }
        return self.exec.update_by_id(game_user_id, data)

    def update_weather(self, game_user_id: int, weather: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'current_weather': weather,
            'updated_at': now
        }
        return self.exec.update_by_id(game_user_id, data)

    def update_last_login(self, game_user_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'last_login_time': now,
            'updated_at': now
        }
        return self.exec.update_by_id(game_user_id, data)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='gold DESC')

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
