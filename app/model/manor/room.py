from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class RoomModel:
    TABLE_NAME = 'manor_room'

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
                room_id TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                connections TEXT NOT NULL DEFAULT '[]',
                has_puzzle INTEGER NOT NULL DEFAULT 0,
                puzzle_type TEXT,
                puzzle_solved INTEGER NOT NULL DEFAULT 0,
                locked INTEGER NOT NULL DEFAULT 0,
                required_key TEXT,
                decor_style TEXT NOT NULL DEFAULT 'victorian',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_room_id ON {cls.TABLE_NAME}(room_id)"
        db.execute(index_sql)

    def create(self, room_data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data = {
            'room_id': room_data['room_id'],
            'name': room_data['name'],
            'description': room_data['description'],
            'connections': room_data.get('connections', '[]'),
            'has_puzzle': room_data.get('has_puzzle', 0),
            'puzzle_type': room_data.get('puzzle_type'),
            'puzzle_solved': room_data.get('puzzle_solved', 0),
            'locked': room_data.get('locked', 0),
            'required_key': room_data.get('required_key'),
            'decor_style': room_data.get('decor_style', 'victorian'),
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_room_id(self, room_id: str) -> Optional[Dict[str, Any]]:
        return self.query.find_by_field('room_id', room_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id ASC')

    def update(self, room_id: str, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['updated_at'] = now
        return self.exec.update(data, conditions={'room_id': room_id})

    def delete(self, room_id: str) -> int:
        record = self.get_by_room_id(room_id)
        if record:
            return self.exec.delete_by_id(record['id'])
        return 0
