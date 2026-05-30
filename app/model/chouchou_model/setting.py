from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class SettingModel:
    TABLE_NAME = 'tb_chouchou_model_settings'

    DEFAULT_SETTINGS = {
        'sound_enabled': True,
        'music_volume': 80,
        'effect_volume': 100,
        'animation_enabled': True,
        'auto_start_ai': True,
        'ai_difficulty': 'normal',
        'max_players': 8,
        'min_players': 3,
        'total_rounds': 5,
        'default_theme': 'carnival',
        'show_role_hints': True,
        'confirm_actions': False
    }

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
                settings TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)

    def create_default(self, user_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'settings': json.dumps(self.DEFAULT_SETTINGS),
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_user(self, user_id: int) -> Dict[str, Any]:
        record = self.query.find_one({'user_id': user_id})
        if record and record.get('settings'):
            try:
                settings = json.loads(record['settings'])
                return {**self.DEFAULT_SETTINGS, **settings}
            except (json.JSONDecodeError, TypeError):
                pass
        return self.DEFAULT_SETTINGS.copy()

    def update(self, user_id: int, settings: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        record = self.query.find_one({'user_id': user_id})

        if record:
            current_settings = {}
            if record.get('settings'):
                try:
                    current_settings = json.loads(record['settings'])
                except (json.JSONDecodeError, TypeError):
                    pass

            merged_settings = {**current_settings, **settings}
            return self.exec.update_by_id(record['id'], {
                'settings': json.dumps(merged_settings),
                'updated_at': now
            })
        else:
            merged_settings = {**self.DEFAULT_SETTINGS, **settings}
            return self.create(user_id, merged_settings)

    def create(self, user_id: int, settings: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'settings': json.dumps(settings),
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_value(self, user_id: int, key: str, default: Any = None) -> Any:
        settings = self.get_by_user(user_id)
        return settings.get(key, default if default is not None else self.DEFAULT_SETTINGS.get(key))

    def set_value(self, user_id: int, key: str, value: Any) -> int:
        settings = self.get_by_user(user_id)
        settings[key] = value
        return self.update(user_id, settings)

    def reset_to_default(self, user_id: int) -> int:
        record = self.query.find_one({'user_id': user_id})
        now = datetime.now().isoformat()

        if record:
            return self.exec.update_by_id(record['id'], {
                'settings': json.dumps(self.DEFAULT_SETTINGS),
                'updated_at': now
            })
        else:
            return self.create_default(user_id)

    def delete_by_user(self, user_id: int) -> int:
        return self.exec.execute_raw(
            f"DELETE FROM {self.TABLE_NAME} WHERE user_id = ?",
            (user_id,)
        )

    def to_dict(self, settings: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'sound_enabled': settings.get('sound_enabled', self.DEFAULT_SETTINGS['sound_enabled']),
            'music_volume': settings.get('music_volume', self.DEFAULT_SETTINGS['music_volume']),
            'effect_volume': settings.get('effect_volume', self.DEFAULT_SETTINGS['effect_volume']),
            'animation_enabled': settings.get('animation_enabled', self.DEFAULT_SETTINGS['animation_enabled']),
            'auto_start_ai': settings.get('auto_start_ai', self.DEFAULT_SETTINGS['auto_start_ai']),
            'ai_difficulty': settings.get('ai_difficulty', self.DEFAULT_SETTINGS['ai_difficulty']),
            'max_players': settings.get('max_players', self.DEFAULT_SETTINGS['max_players']),
            'min_players': settings.get('min_players', self.DEFAULT_SETTINGS['min_players']),
            'total_rounds': settings.get('total_rounds', self.DEFAULT_SETTINGS['total_rounds']),
            'default_theme': settings.get('default_theme', self.DEFAULT_SETTINGS['default_theme']),
            'show_role_hints': settings.get('show_role_hints', self.DEFAULT_SETTINGS['show_role_hints']),
            'confirm_actions': settings.get('confirm_actions', self.DEFAULT_SETTINGS['confirm_actions'])
        }
