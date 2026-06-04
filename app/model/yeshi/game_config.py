from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameConfigModel:
    TABLE_NAME = 'tb_yeshi_model_game_config'
    
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
                config_type TEXT DEFAULT 'string',
                description TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        cls._init_default_configs(db)

    @classmethod
    def _init_default_configs(cls, db):
        default_configs = [
            ('game.start_gold', '100', 'integer', '初始金币', 1),
            ('game.start_level', '1', 'integer', '初始等级', 1),
            ('game.max_customers_base', '3', 'integer', '基础最大客人数', 1),
            ('game.customer_spawn_rate', '10', 'integer', '客人出现间隔（秒）', 1),
            ('game.order_timeout', '120', 'integer', '订单超时时间（秒）', 1),
            ('game.quality_perfect_min', '90', 'integer', '完美品质最低分', 1),
            ('game.quality_good_min', '70', 'integer', '良好品质最低分', 1),
            ('game.exp_per_level_base', '100', 'integer', '每级基础经验需求', 1),
            ('game.exp_growth_rate', '1.2', 'float', '经验增长率', 1),
            ('game.reputation_perfect', '5', 'integer', '完美订单获得声望', 1),
            ('game.reputation_good', '3', 'integer', '良好订单获得声望', 1),
            ('game.reputation_normal', '1', 'integer', '普通订单获得声望', 1),
            ('game.reputation_failed', '-2', 'integer', '失败订单扣除声望', 1),
            ('game.max_patience_base', '60', 'integer', '基础耐心值', 1),
            ('game.tip_base_rate', '0.1', 'float', '基础小费比例', 1),
        ]
        
        existing = db.fetch_one(f"SELECT COUNT(*) as count FROM {cls.TABLE_NAME}")
        if existing and existing.get('count', 0) == 0:
            now = datetime.now().isoformat()
            for config in default_configs:
                db.execute(
                    f"""INSERT INTO {cls.TABLE_NAME} 
                    (config_key, config_value, config_type, description, is_active, created_at, updated_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    (*config, now, now)
                )

    def get(self, config_key: str, default: Any = None) -> Any:
        config = self.query.find_one({'config_key': config_key, 'is_active': 1})
        if not config:
            return default
        
        value = config.get('config_value')
        config_type = config.get('config_type', 'string')
        
        if config_type == 'integer':
            return int(value) if value else default
        elif config_type == 'float':
            return float(value) if value else default
        elif config_type == 'boolean':
            return value.lower() in ('true', '1', 'yes') if value else default
        elif config_type == 'json':
            import json
            try:
                return json.loads(value) if value else default
            except:
                return default
        return value

    def set(self, config_key: str, config_value: Any, description: str = None) -> int:
        existing = self.query.find_one({'config_key': config_key})
        now = datetime.now().isoformat()
        
        if isinstance(config_value, (dict, list)):
            import json
            config_value = json.dumps(config_value, ensure_ascii=False)
            config_type = 'json'
        elif isinstance(config_value, bool):
            config_value = 'true' if config_value else 'false'
            config_type = 'boolean'
        elif isinstance(config_value, int):
            config_value = str(config_value)
            config_type = 'integer'
        elif isinstance(config_value, float):
            config_value = str(config_value)
            config_type = 'float'
        else:
            config_value = str(config_value)
            config_type = 'string'
        
        if existing:
            data = {
                'config_value': config_value,
                'config_type': config_type,
                'updated_at': now
            }
            if description:
                data['description'] = description
            return self.exec.update_by_id(existing['id'], data)
        else:
            data = {
                'config_key': config_key,
                'config_value': config_value,
                'config_type': config_type,
                'description': description or '',
                'is_active': 1,
                'created_at': now,
                'updated_at': now
            }
            return self.exec.insert(data)

    def get_all(self) -> Dict[str, Any]:
        configs = self.query.find_all({'is_active': 1}, order_by='config_key ASC')
        result = {}
        for config in configs:
            key = config.get('config_key')
            value = config.get('config_value')
            config_type = config.get('config_type', 'string')
            
            if config_type == 'integer':
                result[key] = int(value) if value else None
            elif config_type == 'float':
                result[key] = float(value) if value else None
            elif config_type == 'boolean':
                result[key] = value.lower() in ('true', '1', 'yes') if value else False
            elif config_type == 'json':
                import json
                try:
                    result[key] = json.loads(value) if value else None
                except:
                    result[key] = value
            else:
                result[key] = value
        
        return result

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['updated_at'] = now
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
