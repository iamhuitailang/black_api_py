from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameRecordModel:
    TABLE_NAME = 'dragon_game_record'

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
                player_name TEXT NOT NULL DEFAULT 'Player',
                wave_reached INTEGER NOT NULL DEFAULT 0,
                enemies_killed INTEGER NOT NULL DEFAULT 0,
                score INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'playing',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_player_name ON {cls.TABLE_NAME}(player_name)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_wave_reached ON {cls.TABLE_NAME}(wave_reached)"
        db.execute(index_sql2)

    def create(self, player_name: str = 'Player', wave_reached: int = 0,
               enemies_killed: int = 0, score: int = 0, status: str = 'playing') -> int:
        now = datetime.now().isoformat()
        data = {
            'player_name': player_name,
            'wave_reached': wave_reached,
            'enemies_killed': enemies_killed,
            'score': score,
            'status': status,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_player(self, player_name: str) -> List[Dict[str, Any]]:
        return self.query.find_all(where={'player_name': player_name}, order_by='id DESC', limit=10)

    def get_latest(self, player_name: str = None) -> Optional[Dict[str, Any]]:
        if player_name:
            return self.query.find_one(where={'player_name': player_name}, order_by='id DESC')
        return self.query.find_one(order_by='id DESC')

    def get_top_scores(self, limit: int = 10) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='score DESC', limit=limit)

    def get_all(self, limit: int = 100) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id DESC', limit=limit)

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = dict(kwargs)
        data['updated_at'] = now
        return self.exec.update_by_id(record_id, data)

    def update_progress(self, record_id: int, wave_reached: int, enemies_killed: int, score: int, status: str = 'playing') -> int:
        return self.update(record_id, wave_reached=wave_reached, enemies_killed=enemies_killed, score=score, status=status)

    def finish_game(self, record_id: int, wave_reached: int, enemies_killed: int, score: int) -> int:
        return self.update(record_id, wave_reached=wave_reached, enemies_killed=enemies_killed, score=score, status='finished')

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()

    def paginate(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='id DESC')
