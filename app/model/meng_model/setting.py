from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class SettingModel:
    TABLE_NAME = 'tb_meng_model_settings'

    DEFAULT_SETTINGS = {
        'theme': 'light',
        'language': 'zh-CN',
        'sound_enabled': 'true',
        'music_enabled': 'true',
        'notification_enabled': 'true',
        'difficulty': 'normal',
        'auto_save': 'true'
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
                user_id INTEGER NOT NULL,
                setting_key TEXT NOT NULL,
                setting_value TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, setting_key)
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_setting_key ON {cls.TABLE_NAME}(setting_key)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_key ON {cls.TABLE_NAME}(user_id, setting_key)"
        db.execute(index_sql)

    def create_or_update(self, user_id: int, setting_key: str, setting_value: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'setting_key': setting_key,
            'setting_value': setting_value,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.upsert(data, ['user_id', 'setting_key'])

    def get_by_user(self, user_id: int) -> List[Dict[str, Any]]:
        settings = self.query.find_all({'user_id': user_id}, order_by='setting_key')
        return [self.to_dict(s) for s in settings]

    def get_by_key(self, user_id: int, setting_key: str) -> Optional[Dict[str, Any]]:
        setting = self.query.find_one({
            'user_id': user_id,
            'setting_key': setting_key
        })
        return self.to_dict(setting) if setting else None

    def delete(self, user_id: int, setting_key: str = None) -> int:
        conditions = {'user_id': user_id}
        if setting_key is not None:
            conditions['setting_key'] = setting_key
        return self.exec.delete(conditions)

    def to_dict(self, setting: Dict[str, Any]) -> Dict[str, Any]:
        if not setting:
            return {}

        return {
            'id': setting.get('id'),
            'user_id': setting.get('user_id'),
            'setting_key': setting.get('setting_key'),
            'setting_value': setting.get('setting_value'),
            'created_at': setting.get('created_at'),
            'updated_at': setting.get('updated_at')
        }

    def init_default_settings(self, user_id: int) -> int:
        now = datetime.now().isoformat()
        data_list = []
        for key, value in self.DEFAULT_SETTINGS.items():
            data_list.append({
                'user_id': user_id,
                'setting_key': key,
                'setting_value': value,
                'created_at': now,
                'updated_at': now
            })
        return self.exec.insert_many(data_list)
