from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class ReadingSettingsModel:
    TABLE_NAME = 'tb_manhua_reading_settings'

    MODE_SINGLE = 'single'
    MODE_DOUBLE = 'double'
    MODE_SCROLL = 'scroll'

    THEME_DARK = 'dark'
    THEME_LIGHT = 'light'

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
                read_mode TEXT DEFAULT 'single',
                theme TEXT DEFAULT 'dark',
                brightness INTEGER DEFAULT 80,
                auto_play INTEGER DEFAULT 0,
                auto_play_speed INTEGER DEFAULT 3,
                font_size INTEGER DEFAULT 16,
                page_direction TEXT DEFAULT 'ltr',
                show_page_num INTEGER DEFAULT 1,
                show_timestamp INTEGER DEFAULT 0,
                extra_settings TEXT DEFAULT '{{}}',
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
            'read_mode': self.MODE_SINGLE,
            'theme': self.THEME_DARK,
            'brightness': 80,
            'auto_play': 0,
            'auto_play_speed': 3,
            'font_size': 16,
            'page_direction': 'ltr',
            'show_page_num': 1,
            'show_timestamp': 0,
            'extra_settings': '{}',
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_user_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        settings = self.query.find_one({'user_id': user_id})
        if not settings:
            self.create_default(user_id)
            settings = self.query.find_one({'user_id': user_id})
        return settings

    def update(self, user_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'read_mode', 'theme', 'brightness', 'auto_play', 'auto_play_speed',
            'font_size', 'page_direction', 'show_page_num', 'show_timestamp', 'extra_settings'
        ]}
        update_data['updated_at'] = now
        return self.exec.update(update_data, conditions={'user_id': user_id})

    def to_dict(self, settings: Dict[str, Any]) -> Dict[str, Any]:
        extra = settings.get('extra_settings', '{}')
        if isinstance(extra, str):
            try:
                extra = json.loads(extra)
            except:
                extra = {}
        return {
            'id': settings.get('id'),
            'user_id': settings.get('user_id'),
            'read_mode': settings.get('read_mode'),
            'theme': settings.get('theme'),
            'brightness': settings.get('brightness'),
            'auto_play': settings.get('auto_play'),
            'auto_play_speed': settings.get('auto_play_speed'),
            'font_size': settings.get('font_size'),
            'page_direction': settings.get('page_direction'),
            'show_page_num': settings.get('show_page_num'),
            'show_timestamp': settings.get('show_timestamp'),
            'extra_settings': extra,
            'updated_at': settings.get('updated_at')
        }