from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class TrackTemplateModel:
    TABLE_NAME = 'icesled_track_template'

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
                name TEXT NOT NULL,
                segments TEXT NOT NULL,
                total_length INTEGER NOT NULL,
                curve_ratio REAL NOT NULL,
                difficulty TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_difficulty ON {cls.TABLE_NAME}(difficulty)"
        db.execute(index_sql)

    def create(self, name: str, segments: list, total_length: int,
               curve_ratio: float, difficulty: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'segments': json.dumps(segments, ensure_ascii=False),
            'total_length': total_length,
            'curve_ratio': curve_ratio,
            'difficulty': difficulty,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        row = self.query.find_by_id(record_id)
        if row and 'segments' in row:
            row['segments'] = json.loads(row['segments'])
        return row

    def get_all(self, limit: int = 100) -> List[Dict[str, Any]]:
        rows = self.query.find_all(order_by='id DESC', limit=limit)
        for row in rows:
            if 'segments' in row:
                row['segments'] = json.loads(row['segments'])
        return rows

    def get_by_difficulty(self, difficulty: str) -> List[Dict[str, Any]]:
        rows = self.query.find_all(conditions={'difficulty': difficulty},
                                   order_by='id DESC')
        for row in rows:
            if 'segments' in row:
                row['segments'] = json.loads(row['segments'])
        return rows

    def get_random(self) -> Optional[Dict[str, Any]]:
        db = get_db()
        sql = f"SELECT * FROM {self.TABLE_NAME} ORDER BY RANDOM() LIMIT 1"
        row = db.fetch_one(sql)
        if row and 'segments' in row:
            row['segments'] = json.loads(row['segments'])
        return row

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()
