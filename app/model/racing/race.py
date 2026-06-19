from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class RaceModel:
    TABLE_NAME = 'tb_racing_race'

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
                vehicle_id INTEGER NOT NULL,
                track_index INTEGER NOT NULL,
                track_name TEXT NOT NULL,
                start_time TIMESTAMP,
                end_time TIMESTAMP,
                total_time REAL DEFAULT 0,
                position INTEGER DEFAULT 0,
                gold_earned INTEGER DEFAULT 0,
                shortcuts_found INTEGER DEFAULT 0,
                rollovers INTEGER DEFAULT 0,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vehicle_id) REFERENCES tb_racing_vehicle(id)
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_vehicle ON {cls.TABLE_NAME}(vehicle_id, track_index)"
        db.execute(index_sql)

    def create(self, vehicle_id: int, track_index: int, track_name: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'vehicle_id': vehicle_id,
            'track_index': track_index,
            'track_name': track_name,
            'status': 'pending',
            'created_at': now
        }
        return self.exec.insert(data)

    def start(self, race_id: int) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(race_id, {
            'start_time': now,
            'status': 'running'
        })

    def finish(self, race_id: int, total_time: float, position: int, gold_earned: int,
               shortcuts_found: int = 0, rollovers: int = 0) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(race_id, {
            'end_time': now,
            'total_time': total_time,
            'position': position,
            'gold_earned': gold_earned,
            'shortcuts_found': shortcuts_found,
            'rollovers': rollovers,
            'status': 'finished'
        })

    def get_by_vehicle_and_track(self, vehicle_id: int, track_index: int) -> Optional[Dict[str, Any]]:
        results = self.query.find_all(
            conditions={'vehicle_id': vehicle_id, 'track_index': track_index},
            limit=1,
            order_by='id DESC'
        )
        return results[0] if results else None

    def get_all_by_vehicle(self, vehicle_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'vehicle_id': vehicle_id},
            order_by='track_index ASC'
        )

    def get_by_id(self, race_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(race_id)


class CheckpointModel:
    TABLE_NAME = 'tb_racing_checkpoint'

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
                race_id INTEGER NOT NULL,
                checkpoint_index INTEGER NOT NULL,
                segment_time REAL DEFAULT 0,
                is_shortcut INTEGER DEFAULT 0,
                has_rollover INTEGER DEFAULT 0,
                penalty_time REAL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (race_id) REFERENCES tb_racing_race(id)
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_race ON {cls.TABLE_NAME}(race_id, checkpoint_index)"
        db.execute(index_sql)

    def record(self, race_id: int, checkpoint_index: int, segment_time: float,
               is_shortcut: bool = False, has_rollover: bool = False, penalty_time: float = 0) -> int:
        data = {
            'race_id': race_id,
            'checkpoint_index': checkpoint_index,
            'segment_time': segment_time,
            'is_shortcut': 1 if is_shortcut else 0,
            'has_rollover': 1 if has_rollover else 0,
            'penalty_time': penalty_time,
            'created_at': datetime.now().isoformat()
        }
        return self.exec.insert(data)

    def get_by_race(self, race_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'race_id': race_id},
            order_by='checkpoint_index ASC'
        )
