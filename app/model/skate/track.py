from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class TrackModel:
    TABLE_NAME = 'tb_skate_track'

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
                description TEXT DEFAULT '',
                length INTEGER NOT NULL,
                difficulty INTEGER DEFAULT 1,
                terrain_data TEXT NOT NULL,
                obstacle_data TEXT NOT NULL,
                rail_data TEXT NOT NULL DEFAULT '[]',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

    def create(self, name: str, description: str, length: int, difficulty: int,
               terrain_data: List[Dict], obstacle_data: List[Dict], rail_data: List[Dict] = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'length': length,
            'difficulty': difficulty,
            'terrain_data': json.dumps(terrain_data, ensure_ascii=False),
            'obstacle_data': json.dumps(obstacle_data, ensure_ascii=False),
            'rail_data': json.dumps(rail_data or [], ensure_ascii=False),
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, track_id: int) -> Optional[Dict[str, Any]]:
        row = self.query.find_by_id(track_id)
        if row:
            row['terrain_data'] = json.loads(row.get('terrain_data', '[]'))
            row['obstacle_data'] = json.loads(row.get('obstacle_data', '[]'))
            row['rail_data'] = json.loads(row.get('rail_data', '[]'))
        return row

    def get_all(self) -> List[Dict[str, Any]]:
        rows = self.query.find_all(order_by='id ASC')
        result = []
        for row in rows:
            row_copy = dict(row)
            row_copy['terrain_data'] = json.loads(row_copy.get('terrain_data', '[]'))
            row_copy['obstacle_data'] = json.loads(row_copy.get('obstacle_data', '[]'))
            row_copy['rail_data'] = json.loads(row_copy.get('rail_data', '[]'))
            result.append(row_copy)
        return result

    def get_all_simple(self) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT id, name, description, length, difficulty, created_at
            FROM {self.TABLE_NAME}
            ORDER BY id ASC
        """
        return self.db.fetch_all(sql)

    def count(self) -> int:
        return self.query.count()

    def delete(self, track_id: int) -> int:
        return self.exec.delete_by_id(track_id)
