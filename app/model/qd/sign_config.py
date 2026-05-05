from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class SignConfigModel:
    TABLE_NAME = 'tb_qd_sign_config'

    DEFAULT_DAILY_POINTS = 10
    DEFAULT_SUPPLEMENT_COST = 50

    CONSECUTIVE_REWARDS = {
        3: 30,
        5: 50,
        7: 100,
        15: 200,
        30: 500
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
                config_key TEXT NOT NULL UNIQUE,
                config_value TEXT NOT NULL,
                description TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        cls._migrate_table()

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_key ON {cls.TABLE_NAME}(config_key)"
        db.execute(index_sql)

    @classmethod
    def _migrate_table(cls):
        db = get_db()
        try:
            columns = db.fetch_all(f"PRAGMA table_info({cls.TABLE_NAME})")
            column_names = [col.get('name') for col in columns]

            if 'created_at' not in column_names:
                db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
                print(f"  - Migrated {cls.TABLE_NAME}: added created_at column")

            if 'updated_at' not in column_names:
                db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
                print(f"  - Migrated {cls.TABLE_NAME}: added updated_at column")
        except Exception as e:
            print(f"  - Migration check skipped for {cls.TABLE_NAME}: {e}")

    @classmethod
    def init_default_config(cls):
        model = SignConfigModel()
        
        default_configs = [
            ('daily_points', str(cls.DEFAULT_DAILY_POINTS), '每日签到基础积分'),
            ('supplement_cost', str(cls.DEFAULT_SUPPLEMENT_COST), '补签消耗积分'),
            ('enable_supplement', '1', '是否启用补签功能（1启用，0禁用）'),
            ('max_supplement_days', '7', '最大可补签天数'),
            ('enable_notification', '1', '是否启用签到提醒'),
        ]
        
        for key, value, desc in default_configs:
            existing = model.get_by_key(key)
            if not existing:
                model.create(key, value, desc)

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

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_key(self, config_key: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'config_key': config_key})

    def get_value(self, config_key: str, default_value: str = '') -> str:
        config = self.get_by_key(config_key)
        if config:
            return config.get('config_value', default_value)
        return default_value

    def update_value(self, config_key: str, config_value: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'config_value': config_value,
            'updated_at': now
        }
        return self.exec.update(data, {'config_key': config_key})

    def get_all_config(self) -> Dict[str, Any]:
        all_configs = self.query.find_all({})
        result = {}
        for config in all_configs:
            result[config.get('config_key')] = {
                'value': config.get('config_value'),
                'description': config.get('description')
            }
        return result

    def get_daily_points(self) -> int:
        value = self.get_value('daily_points', str(self.DEFAULT_DAILY_POINTS))
        try:
            return int(value)
        except ValueError:
            return self.DEFAULT_DAILY_POINTS

    def get_supplement_cost(self) -> int:
        value = self.get_value('supplement_cost', str(self.DEFAULT_SUPPLEMENT_COST))
        try:
            return int(value)
        except ValueError:
            return self.DEFAULT_SUPPLEMENT_COST

    def is_supplement_enabled(self) -> bool:
        value = self.get_value('enable_supplement', '1')
        return value == '1'

    def get_max_supplement_days(self) -> int:
        value = self.get_value('max_supplement_days', '7')
        try:
            return int(value)
        except ValueError:
            return 7

    def get_consecutive_reward(self, continuous_days: int) -> int:
        return self.CONSECUTIVE_REWARDS.get(continuous_days, 0)

    def get_all_consecutive_rewards(self) -> Dict[int, int]:
        return self.CONSECUTIVE_REWARDS.copy()

    def delete_by_id(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
