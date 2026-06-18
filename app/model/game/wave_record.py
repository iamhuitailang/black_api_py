from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class WaveRecordModel:
    TABLE_NAME = 'game_wave_records'

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
                player_name TEXT NOT NULL DEFAULT 'Anonymous',
                wave INTEGER NOT NULL,
                score INTEGER NOT NULL DEFAULT 0,
                kills INTEGER NOT NULL DEFAULT 0,
                elite_kills INTEGER NOT NULL DEFAULT 0,
                boss_kills INTEGER NOT NULL DEFAULT 0,
                damage_dealt INTEGER NOT NULL DEFAULT 0,
                arrows_shot INTEGER NOT NULL DEFAULT 0,
                crystals_collected INTEGER NOT NULL DEFAULT 0,
                survival_time INTEGER NOT NULL DEFAULT 0,
                is_victory INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_wave ON {cls.TABLE_NAME}(wave)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_score ON {cls.TABLE_NAME}(score)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql3)

    def create(self, player_name: str, wave: int, score: int, kills: int,
               elite_kills: int, boss_kills: int, damage_dealt: int,
               arrows_shot: int, crystals_collected: int, survival_time: int,
               is_victory: bool) -> int:
        now = datetime.now().isoformat()
        data = {
            'player_name': player_name or 'Anonymous',
            'wave': wave,
            'score': score,
            'kills': kills,
            'elite_kills': elite_kills,
            'boss_kills': boss_kills,
            'damage_dealt': damage_dealt,
            'arrows_shot': arrows_shot,
            'crystals_collected': crystals_collected,
            'survival_time': survival_time,
            'is_victory': 1 if is_victory else 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_latest(self) -> Optional[Dict[str, Any]]:
        return self.query.find_one(order_by='id DESC')

    def get_top_scores(self, limit: int = 10) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='score DESC', limit=limit)

    def get_all(self, limit: int = 100) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id DESC', limit=limit)

    def get_highest_wave(self) -> Optional[Dict[str, Any]]:
        return self.query.find_one(order_by='wave DESC')

    def count(self) -> int:
        return self.query.count()

    def paginate(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='score DESC')

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {**kwargs, 'updated_at': now}
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
