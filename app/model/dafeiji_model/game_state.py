from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class DafeijiGameStateModel:
    TABLE_NAME = 'tb_dafeiji_model_game_state'

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
                user_id INTEGER NOT NULL,
                score INTEGER DEFAULT 0,
                wave INTEGER DEFAULT 1,
                hp INTEGER DEFAULT 100,
                lives INTEGER DEFAULT 3,
                aircraft_id INTEGER DEFAULT 1,
                weapon_level INTEGER DEFAULT 1,
                items TEXT DEFAULT '[]',
                enemies_killed INTEGER DEFAULT 0,
                play_time INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        unique_sql = f"CREATE UNIQUE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_unique ON {cls.TABLE_NAME}(user_id)"
        db.execute(unique_sql)

    def save_state(self, user_id: int, state_data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        existing = self.query.find_one({'user_id': user_id})
        state_data['updated_at'] = now
        if isinstance(state_data.get('items'), list):
            state_data['items'] = json.dumps(state_data['items'], ensure_ascii=False)
        if existing:
            update_data = {k: v for k, v in state_data.items() if k in [
                'score', 'wave', 'hp', 'lives', 'aircraft_id',
                'weapon_level', 'items', 'enemies_killed', 'play_time', 'updated_at'
            ]}
            return self.exec.update_by_id(existing.get('id'), update_data)
        else:
            data = {
                'user_id': user_id,
                'score': state_data.get('score', 0),
                'wave': state_data.get('wave', 1),
                'hp': state_data.get('hp', 100),
                'lives': state_data.get('lives', 3),
                'aircraft_id': state_data.get('aircraft_id', 1),
                'weapon_level': state_data.get('weapon_level', 1),
                'items': state_data.get('items', '[]'),
                'enemies_killed': state_data.get('enemies_killed', 0),
                'play_time': state_data.get('play_time', 0),
                'created_at': now,
                'updated_at': now
            }
            return self.exec.insert(data)

    def get_state(self, user_id: int) -> Optional[Dict[str, Any]]:
        state = self.query.find_one({'user_id': user_id})
        if state and isinstance(state.get('items'), str):
            try:
                state['items'] = json.loads(state['items'])
            except (json.JSONDecodeError, TypeError):
                state['items'] = []
        return state

    def clear_state(self, user_id: int) -> int:
        existing = self.query.find_one({'user_id': user_id})
        if existing:
            return self.exec.delete_by_id(existing.get('id'))
        return 0

    def to_dict(self, state: Dict[str, Any]) -> Dict[str, Any]:
        items = state.get('items', [])
        if isinstance(items, str):
            try:
                items = json.loads(items)
            except (json.JSONDecodeError, TypeError):
                items = []
        return {
            'id': state.get('id'),
            'user_id': state.get('user_id'),
            'score': state.get('score', 0),
            'wave': state.get('wave', 1),
            'hp': state.get('hp', 100),
            'lives': state.get('lives', 3),
            'aircraft_id': state.get('aircraft_id', 1),
            'weapon_level': state.get('weapon_level', 1),
            'items': items,
            'enemies_killed': state.get('enemies_killed', 0),
            'play_time': state.get('play_time', 0),
            'updated_at': state.get('updated_at')
        }
