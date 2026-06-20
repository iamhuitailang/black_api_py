from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class RaceDetailModel:
    TABLE_NAME = 'icesled_race_detail'

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
                race_record_id INTEGER NOT NULL,
                racer_name TEXT NOT NULL,
                racer_type TEXT NOT NULL,
                final_speed REAL NOT NULL,
                total_time REAL NOT NULL,
                rank INTEGER NOT NULL,
                score INTEGER NOT NULL DEFAULT 0,
                wall_hit_count INTEGER NOT NULL DEFAULT 0,
                crack_fall_count INTEGER NOT NULL DEFAULT 0,
                boost_count INTEGER NOT NULL DEFAULT 0,
                event_log TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_race_record_id ON {cls.TABLE_NAME}(race_record_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_rank ON {cls.TABLE_NAME}(rank)"
        db.execute(index_sql2)

    def create(self, race_record_id: int, racer_name: str, racer_type: str,
               final_speed: float, total_time: float, rank: int, score: int,
               wall_hit_count: int, crack_fall_count: int, boost_count: int,
               event_log: list) -> int:
        now = datetime.now().isoformat()
        data = {
            'race_record_id': race_record_id,
            'racer_name': racer_name,
            'racer_type': racer_type,
            'final_speed': final_speed,
            'total_time': total_time,
            'rank': rank,
            'score': score,
            'wall_hit_count': wall_hit_count,
            'crack_fall_count': crack_fall_count,
            'boost_count': boost_count,
            'event_log': json.dumps(event_log, ensure_ascii=False),
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        row = self.query.find_by_id(record_id)
        if row and 'event_log' in row:
            row['event_log'] = json.loads(row['event_log'])
        return row

    def get_by_race_id(self, race_record_id: int) -> List[Dict[str, Any]]:
        rows = self.query.find_all(conditions={'race_record_id': race_record_id},
                                   order_by='rank ASC')
        for row in rows:
            if 'event_log' in row:
                row['event_log'] = json.loads(row['event_log'])
        return rows

    def count(self) -> int:
        return self.query.count()

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
