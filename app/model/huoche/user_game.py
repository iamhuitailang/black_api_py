from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class UserGameModel:
    TABLE_NAME = 'tb_huoche_user_game'
    
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
                level INTEGER DEFAULT 1,
                experience INTEGER DEFAULT 0,
                coins INTEGER DEFAULT 1000,
                total_distance REAL DEFAULT 0,
                total_passengers INTEGER DEFAULT 0,
                total_cargo REAL DEFAULT 0,
                total_games INTEGER DEFAULT 0,
                perfect_games INTEGER DEFAULT 0,
                current_train_id INTEGER,
                current_route_id INTEGER,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES tb_auth_user(id),
                FOREIGN KEY (current_train_id) REFERENCES tb_huoche_train(id),
                FOREIGN KEY (current_route_id) REFERENCES tb_huoche_route(id)
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)

    def create(self, user_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'level': 1,
            'experience': 0,
            'coins': 1000,
            'total_distance': 0,
            'total_passengers': 0,
            'total_cargo': 0,
            'total_games': 0,
            'perfect_games': 0,
            'status': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_user_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id})

    def get_or_create(self, user_id: int) -> Dict[str, Any]:
        user_game = self.get_by_user_id(user_id)
        if not user_game:
            self.create(user_id)
            user_game = self.get_by_user_id(user_id)
        return user_game

    def add_experience(self, user_id: int, exp: int) -> Dict[str, Any]:
        user_game = self.get_by_user_id(user_id)
        if user_game:
            new_exp = user_game.get('experience', 0) + exp
            new_level = self._calculate_level(new_exp)
            now = datetime.now().isoformat()
            self.exec.update_by_id(user_game['id'], {
                'experience': new_exp,
                'level': new_level,
                'updated_at': now
            })
            return {
                'new_experience': new_exp,
                'new_level': new_level,
                'leveled_up': new_level > user_game.get('level', 1)
            }
        return {}

    def _calculate_level(self, experience: int) -> int:
        level = 1
        exp_needed = 100
        while experience >= exp_needed:
            level += 1
            exp_needed = level * level * 100
        return level

    def add_coins(self, user_id: int, coins: int) -> int:
        user_game = self.get_by_user_id(user_id)
        if user_game:
            new_coins = user_game.get('coins', 0) + coins
            now = datetime.now().isoformat()
            self.exec.update_by_id(user_game['id'], {'coins': new_coins, 'updated_at': now})
            return new_coins
        return 0

    def spend_coins(self, user_id: int, coins: int) -> bool:
        user_game = self.get_by_user_id(user_id)
        if user_game and user_game.get('coins', 0) >= coins:
            new_coins = user_game.get('coins', 0) - coins
            now = datetime.now().isoformat()
            self.exec.update_by_id(user_game['id'], {'coins': new_coins, 'updated_at': now})
            return True
        return False

    def add_stats(self, user_id: int, distance: float = 0, passengers: int = 0, 
                  cargo: float = 0, is_perfect: bool = False) -> int:
        user_game = self.get_by_user_id(user_id)
        if user_game:
            now = datetime.now().isoformat()
            data = {
                'total_distance': user_game.get('total_distance', 0) + distance,
                'total_passengers': user_game.get('total_passengers', 0) + passengers,
                'total_cargo': user_game.get('total_cargo', 0) + cargo,
                'total_games': user_game.get('total_games', 0) + 1,
                'updated_at': now
            }
            if is_perfect:
                data['perfect_games'] = user_game.get('perfect_games', 0) + 1
            return self.exec.update_by_id(user_game['id'], data)
        return 0

    def set_current_train(self, user_id: int, train_id: int) -> int:
        user_game = self.get_by_user_id(user_id)
        if user_game:
            now = datetime.now().isoformat()
            return self.exec.update_by_id(user_game['id'], {'current_train_id': train_id, 'updated_at': now})
        return 0

    def set_current_route(self, user_id: int, route_id: int) -> int:
        user_game = self.get_by_user_id(user_id)
        if user_game:
            now = datetime.now().isoformat()
            return self.exec.update_by_id(user_game['id'], {'current_route_id': route_id, 'updated_at': now})
        return 0

    def update(self, user_id: int, data: Dict[str, Any]) -> int:
        user_game = self.get_by_user_id(user_id)
        if user_game:
            now = datetime.now().isoformat()
            data['updated_at'] = now
            return self.exec.update_by_id(user_game['id'], data)
        return 0
