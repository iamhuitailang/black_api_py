from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameStatus:
    PLAYING = 'playing'
    VICTORY = 'victory'
    DEFEAT = 'defeat'


class GameModel:
    TABLE_NAME = 'tb_glacier_game'

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
                status TEXT DEFAULT 'playing',
                current_layer INTEGER DEFAULT 1,
                total_layers INTEGER DEFAULT 10,
                stamina REAL DEFAULT 300,
                max_stamina REAL DEFAULT 300,
                turn_count INTEGER DEFAULT 0,
                is_stamina_depleted INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

    def create(self, total_layers: int = 10, max_stamina: float = 300) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': GameStatus.PLAYING,
            'current_layer': 1,
            'total_layers': total_layers,
            'stamina': max_stamina,
            'max_stamina': max_stamina,
            'turn_count': 0,
            'is_stamina_depleted': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_latest(self) -> Optional[Dict[str, Any]]:
        return self.query.find_one(order_by='id DESC')

    def update_game(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        for key, value in kwargs.items():
            if value is not None:
                data[key] = value
        return self.exec.update_by_id(record_id, data)

    def set_status(self, record_id: int, status: str) -> int:
        return self.update_game(record_id, status=status)

    def next_layer(self, record_id: int, new_layer: int) -> int:
        return self.update_game(record_id, current_layer=new_layer)

    def increment_turn(self, record_id: int) -> int:
        game = self.get_by_id(record_id)
        if game:
            return self.update_game(record_id, turn_count=game['turn_count'] + 1)
        return 0
