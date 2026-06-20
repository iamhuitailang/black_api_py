import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ClimberRecordModel:
    TABLE_NAME = 'tb_climber_records'

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
                player_name TEXT NOT NULL DEFAULT '匿名勇士',
                total_time REAL NOT NULL DEFAULT 0,
                fall_count INTEGER NOT NULL DEFAULT 0,
                floor_1_time REAL DEFAULT 0,
                floor_2_time REAL DEFAULT 0,
                floor_3_time REAL DEFAULT 0,
                floor_4_time REAL DEFAULT 0,
                floor_5_time REAL DEFAULT 0,
                floor_6_time REAL DEFAULT 0,
                floor_7_time REAL DEFAULT 0,
                floor_8_time REAL DEFAULT 0,
                floor_9_time REAL DEFAULT 0,
                floor_10_time REAL DEFAULT 0,
                floor_11_time REAL DEFAULT 0,
                floor_12_time REAL DEFAULT 0,
                floor_times_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        db.execute(f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_total_time ON {cls.TABLE_NAME}(total_time)")
        db.execute(f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)")

    def create(self, player_name: str, total_time: float, fall_count: int,
               floor_times: Dict[int, float]) -> int:
        now = datetime.now().isoformat()
        data = {
            'player_name': player_name or '匿名勇士',
            'total_time': total_time,
            'fall_count': fall_count,
            'floor_times_json': json.dumps(floor_times, ensure_ascii=False),
            'created_at': now
        }
        for i in range(1, 13):
            data[f'floor_{i}_time'] = floor_times.get(i, 0)
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        row = self.query.find_by_id(record_id)
        if row and row.get('floor_times_json'):
            try:
                row['floor_times'] = json.loads(row['floor_times_json'])
            except Exception:
                row['floor_times'] = {}
        return row

    def get_top_records(self, limit: int = 50) -> List[Dict[str, Any]]:
        rows = self.query.find_all(order_by='total_time ASC', limit=limit)
        result = []
        for row in rows:
            r = dict(row)
            if r.get('floor_times_json'):
                try:
                    r['floor_times'] = json.loads(r['floor_times_json'])
                except Exception:
                    r['floor_times'] = {}
            result.append(r)
        return result

    def count(self) -> int:
        return self.query.count()


class ClimberFloorStatModel:
    TABLE_NAME = 'tb_climber_floor_stats'

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
                floor_num INTEGER NOT NULL,
                play_count INTEGER NOT NULL DEFAULT 0,
                total_time REAL NOT NULL DEFAULT 0,
                best_time REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        db.execute(f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_floor ON {cls.TABLE_NAME}(floor_num)")

        for i in range(1, 13):
            existing = db.fetch_one(
                f"SELECT id FROM {cls.TABLE_NAME} WHERE floor_num = ?",
                (i,)
            )
            if not existing:
                now = datetime.now().isoformat()
                db.execute(
                    f"INSERT INTO {cls.TABLE_NAME} (floor_num, play_count, total_time, best_time, created_at, updated_at) VALUES (?, 0, 0, NULL, ?, ?)",
                    (i, now, now)
                )

    def update_with_floor_times(self, floor_times: Dict[int, float]):
        now = datetime.now().isoformat()
        for floor_num, t in floor_times.items():
            if t and t > 0:
                row = self.query.find_one(where='floor_num = ?', params=(floor_num,))
                if row:
                    new_play_count = row['play_count'] + 1
                    new_total_time = row['total_time'] + t
                    new_best = t if row['best_time'] is None else min(row['best_time'], t)
                    self.exec.update_by_id(row['id'], {
                        'play_count': new_play_count,
                        'total_time': new_total_time,
                        'best_time': new_best,
                        'updated_at': now
                    })

    def get_all_stats(self) -> List[Dict[str, Any]]:
        rows = self.query.find_all(order_by='floor_num ASC')
        result = []
        for row in rows:
            r = dict(row)
            if r['play_count'] > 0:
                r['avg_time'] = round(r['total_time'] / r['play_count'], 2)
            else:
                r['avg_time'] = 0
            result.append(r)
        return result
