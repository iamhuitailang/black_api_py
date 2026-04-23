from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class BannerConfigModel:
    TABLE_NAME = 'tb_mudan_banner_config'
    
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
                config_value TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_config_key ON {cls.TABLE_NAME}(config_key)"
        db.execute(index_sql)

    def create(self, config_key: str, config_value: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'config_key': config_key,
            'config_value': config_value,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_key(self, config_key: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'config_key': config_key})

    def get_value(self, config_key: str, default_value: str = None) -> Optional[str]:
        config = self.get_by_key(config_key)
        if config:
            return config.get('config_value')
        return default_value

    def set_value(self, config_key: str, config_value: str) -> int:
        existing = self.get_by_key(config_key)
        now = datetime.now().isoformat()
        
        if existing:
            data = {
                'config_value': config_value,
                'updated_at': now
            }
            return self.exec.update(data, conditions={'config_key': config_key})
        else:
            return self.create(config_key, config_value)

    def update(self, config_key: str, config_value: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'config_value': config_value,
            'updated_at': now
        }
        return self.exec.update(data, conditions={'config_key': config_key})

    def delete(self, config_key: str) -> int:
        return self.exec.delete(conditions={'config_key': config_key})

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='config_key ASC')


class BannerConfigKeys:
    ASPECT_RATIO = 'aspect_ratio'
    AUTO_PLAY = 'auto_play'
    INTERVAL = 'interval'
