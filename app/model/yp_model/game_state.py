from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class GameStateModel:
    TABLE_NAME = 'tb_yp_model_game_state'

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
                user_id INTEGER NOT NULL UNIQUE,
                current_music_id INTEGER DEFAULT 0,
                current_character_id INTEGER DEFAULT 0,
                game_settings TEXT DEFAULT '',
                last_play_time TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)

    def create(self, user_id: int) -> int:
        existing = self.query.find_one({'user_id': user_id})
        if existing:
            return existing.get('id', 0)

        now = datetime.now().isoformat()
        default_settings = json.dumps({
            'sound_volume': 0.7,
            'music_volume': 0.8,
            'vibration': True,
            'auto_play': False,
            'difficulty': 'normal'
        })
        data = {
            'user_id': user_id,
            'current_music_id': 1,
            'current_character_id': 1,
            'game_settings': default_settings,
            'last_play_time': now,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_user_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id})

    def update_music(self, user_id: int, music_id: int) -> int:
        state = self.query.find_one({'user_id': user_id})
        if not state:
            self.create(user_id)
            state = self.query.find_one({'user_id': user_id})

        now = datetime.now().isoformat()
        data = {
            'current_music_id': music_id,
            'updated_at': now
        }
        return self.exec.update_by_id(state.get('id'), data)

    def update_character(self, user_id: int, character_id: int) -> int:
        state = self.query.find_one({'user_id': user_id})
        if not state:
            self.create(user_id)
            state = self.query.find_one({'user_id': user_id})

        now = datetime.now().isoformat()
        data = {
            'current_character_id': character_id,
            'updated_at': now
        }
        return self.exec.update_by_id(state.get('id'), data)

    def update_settings(self, user_id: int, settings: Dict[str, Any]) -> int:
        state = self.query.find_one({'user_id': user_id})
        if not state:
            self.create(user_id)
            state = self.query.find_one({'user_id': user_id})

        current_settings = {}
        try:
            current_settings = json.loads(state.get('game_settings', '{}'))
        except (ValueError, TypeError):
            pass

        current_settings.update(settings)
        settings_json = json.dumps(current_settings)

        now = datetime.now().isoformat()
        data = {
            'game_settings': settings_json,
            'updated_at': now
        }
        return self.exec.update_by_id(state.get('id'), data)

    def update_last_play_time(self, user_id: int) -> int:
        state = self.query.find_one({'user_id': user_id})
        if not state:
            return 0

        now = datetime.now().isoformat()
        data = {
            'last_play_time': now,
            'updated_at': now
        }
        return self.exec.update_by_id(state.get('id'), data)

    def to_public_dict(self, state: Dict[str, Any]) -> Dict[str, Any]:
        settings = {}
        try:
            settings = json.loads(state.get('game_settings', '{}'))
        except (ValueError, TypeError):
            pass

        return {
            'id': state.get('id'),
            'user_id': state.get('user_id'),
            'current_music_id': state.get('current_music_id'),
            'current_character_id': state.get('current_character_id'),
            'game_settings': settings,
            'last_play_time': state.get('last_play_time'),
            'created_at': state.get('created_at')
        }
