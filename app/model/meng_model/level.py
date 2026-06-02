from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class LevelModel:
    TABLE_NAME = 'tb_meng_model_levels'

    TYPE_PUZZLE = 'puzzle'
    TYPE_CHALLENGE = 'challenge'
    TYPE_EXPLORATION = 'exploration'
    TYPE_STORY = 'story'
    TYPE_TUTORIAL = 'tutorial'

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
                dream_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                level_type TEXT DEFAULT 'puzzle',
                difficulty INTEGER DEFAULT 1,
                target_x REAL DEFAULT 0,
                target_y REAL DEFAULT 0,
                target_z REAL DEFAULT 0,
                reward INTEGER DEFAULT 0,
                is_completed INTEGER DEFAULT 0,
                data TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_dream_id ON {cls.TABLE_NAME}(dream_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_level_type ON {cls.TABLE_NAME}(level_type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_difficulty ON {cls.TABLE_NAME}(difficulty)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_completed ON {cls.TABLE_NAME}(is_completed)"
        db.execute(index_sql)

    def create(self, dream_id: int, name: str, description: str = '',
               level_type: str = 'puzzle', difficulty: int = 1,
               target_x: float = 0, target_y: float = 0, target_z: float = 0,
               reward: int = 0, is_completed: int = 0,
               data: Dict[str, Any] = None) -> int:
        now = datetime.now().isoformat()
        level_data = {
            'dream_id': dream_id,
            'name': name,
            'description': description,
            'level_type': level_type,
            'difficulty': difficulty,
            'target_x': target_x,
            'target_y': target_y,
            'target_z': target_z,
            'reward': reward,
            'is_completed': is_completed,
            'data': json.dumps(data) if data else '',
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(level_data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_dream(self, dream_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'dream_id': dream_id}, order_by='id DESC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'level_type', 'difficulty',
            'target_x', 'target_y', 'target_z', 'reward',
            'is_completed', 'data'
        ]}
        if 'data' in update_data and isinstance(update_data['data'], dict):
            update_data['data'] = json.dumps(update_data['data'])
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_dream(self, dream_id: int) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE dream_id = ?"
        return self.db.execute(sql, (dream_id,))

    def mark_completed(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'is_completed': 1,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def to_dict(self, level: Dict[str, Any]) -> Dict[str, Any]:
        if not level:
            return {}
        
        data_content = level.get('data', '')
        
        return {
            'id': level.get('id'),
            'dream_id': level.get('dream_id'),
            'name': level.get('name'),
            'description': level.get('description'),
            'level_type': level.get('level_type'),
            'difficulty': level.get('difficulty'),
            'target_x': level.get('target_x'),
            'target_y': level.get('target_y'),
            'target_z': level.get('target_z'),
            'reward': level.get('reward'),
            'is_completed': level.get('is_completed'),
            'data': json.loads(data_content) if data_content else {},
            'created_at': level.get('created_at'),
            'updated_at': level.get('updated_at')
        }
