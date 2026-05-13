from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ConfigModel:
    TABLE_NAME = 'tb_bm_configs'

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
                config_key TEXT NOT NULL UNIQUE,
                config_value TEXT,
                description TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

    def create(self, config_key: str, config_value: str, description: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'config_key': config_key,
            'config_value': config_value,
            'description': description,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_key(self, config_key: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'config_key': config_key})

    def get_value(self, config_key: str, default: str = None) -> Optional[str]:
        config = self.get_by_key(config_key)
        return config.get('config_value') if config else default

    def update(self, record_id: int, config_value: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'config_value': config_value,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def set_value(self, config_key: str, config_value: str, description: str = '') -> int:
        existing = self.get_by_key(config_key)
        if existing:
            return self.update(existing['id'], config_value)
        else:
            return self.create(config_key, config_value, description)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id ASC')

    def to_dict(self, config: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': config.get('id'),
            'config_key': config.get('config_key'),
            'config_value': config.get('config_value'),
            'description': config.get('description'),
            'created_at': config.get('created_at'),
            'updated_at': config.get('updated_at')
        }
