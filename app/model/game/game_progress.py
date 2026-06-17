from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameProgressModel:
    TABLE_NAME = 'game_progress'

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
                player_name TEXT NOT NULL UNIQUE,
                highest_wave INTEGER NOT NULL DEFAULT 1,
                highest_score INTEGER NOT NULL DEFAULT 0,
                total_kills INTEGER NOT NULL DEFAULT 0,
                total_games INTEGER NOT NULL DEFAULT 0,
                energy_collected INTEGER NOT NULL DEFAULT 0,
                boss_kills INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_player_name ON {cls.TABLE_NAME}(player_name)"
        db.execute(index_sql)

    def create(self, player_name: str, highest_wave: int = 1, highest_score: int = 0,
               total_kills: int = 0, total_games: int = 0, energy_collected: int = 0,
               boss_kills: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'player_name': player_name,
            'highest_wave': highest_wave,
            'highest_score': highest_score,
            'total_kills': total_kills,
            'total_games': total_games,
            'energy_collected': energy_collected,
            'boss_kills': boss_kills,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_player_name(self, player_name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one(conditions={'player_name': player_name})

    def update_progress(self, player_name: str, wave: int, score: int, kills: int,
                        energy: int, boss_killed: bool = False) -> int:
        progress = self.get_by_player_name(player_name)
        now = datetime.now().isoformat()

        if progress:
            data = {
                'highest_wave': max(progress['highest_wave'], wave),
                'highest_score': max(progress['highest_score'], score),
                'total_kills': progress['total_kills'] + kills,
                'total_games': progress['total_games'] + 1,
                'energy_collected': progress['energy_collected'] + energy,
                'boss_kills': progress['boss_kills'] + (1 if boss_killed else 0),
                'updated_at': now
            }
            return self.exec.update(data, conditions={'player_name': player_name})
        else:
            return self.create(
                player_name=player_name,
                highest_wave=wave,
                highest_score=score,
                total_kills=kills,
                total_games=1,
                energy_collected=energy,
                boss_kills=1 if boss_killed else 0
            )

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()

    def get_all(self, limit: int = 100) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='highest_score DESC', limit=limit)
