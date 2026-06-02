from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GamePlayerModel:
    TABLE_NAME = 'tb_dafuweng_model_game_player'

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
                game_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                player_order INTEGER DEFAULT 0,
                position INTEGER DEFAULT 0,
                money INTEGER DEFAULT 10000,
                is_bankrupt INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_id ON {cls.TABLE_NAME}(game_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_user ON {cls.TABLE_NAME}(game_id, user_id)"
        db.execute(index_sql)

    def create(self, game_id: int, user_id: int, player_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'game_id': game_id,
            'user_id': user_id,
            'player_order': player_order,
            'position': 0,
            'money': 10000,
            'is_bankrupt': 0,
            'is_active': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_game_id(self, game_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'game_id': game_id}, order_by='player_order ASC')

    def get_by_game_and_user(self, game_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'game_id': game_id, 'user_id': user_id})

    def update(self, player_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'player_order', 'position', 'money', 'is_bankrupt', 'is_active'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(player_id, update_data)

    def update_position(self, player_id: int, position: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'position': position,
            'updated_at': now
        }
        return self.exec.update_by_id(player_id, data)

    def update_money(self, player_id: int, delta: int) -> int:
        player = self.get_by_id(player_id)
        if not player:
            return 0

        new_money = max(0, player.get('money', 10000) + delta)
        now = datetime.now().isoformat()
        data = {
            'money': new_money,
            'updated_at': now
        }
        return self.exec.update_by_id(player_id, data)

    def declare_bankruptcy(self, player_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'is_bankrupt': 1,
            'is_active': 0,
            'updated_at': now
        }
        return self.exec.update_by_id(player_id, data)

    def get_active_players(self, game_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(
            {'game_id': game_id, 'is_active': 1},
            order_by='player_order ASC'
        )
