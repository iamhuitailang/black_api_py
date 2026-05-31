from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class AchievementModel:
    TABLE_NAME = 'tb_doudizhu_model_achievements'

    TYPE_WIN = 0
    TYPE_LEVEL = 1
    TYPE_COINS = 2
    TYPE_SPECIAL = 3

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
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                type INTEGER DEFAULT 0,
                condition_value INTEGER DEFAULT 0,
                reward_coins INTEGER DEFAULT 0,
                reward_exp INTEGER DEFAULT 0,
                icon TEXT DEFAULT '',
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)

    @classmethod
    def init_default_achievements(cls):
        model = cls()
        achievements = [
            {'name': '初出茅庐', 'description': '赢得第一场游戏', 'type': cls.TYPE_WIN, 'condition_value': 1, 'reward_coins': 100, 'reward_exp': 50},
            {'name': '小有名气', 'description': '累计赢得10场游戏', 'type': cls.TYPE_WIN, 'condition_value': 10, 'reward_coins': 500, 'reward_exp': 200},
            {'name': '百战百胜', 'description': '累计赢得100场游戏', 'type': cls.TYPE_WIN, 'condition_value': 100, 'reward_coins': 2000, 'reward_exp': 1000},
            {'name': '千胜将军', 'description': '累计赢得1000场游戏', 'type': cls.TYPE_WIN, 'condition_value': 1000, 'reward_coins': 10000, 'reward_exp': 5000},
            {'name': '升级达人', 'description': '达到10级', 'type': cls.TYPE_LEVEL, 'condition_value': 10, 'reward_coins': 500, 'reward_exp': 200},
            {'name': '登峰造极', 'description': '达到50级', 'type': cls.TYPE_LEVEL, 'condition_value': 50, 'reward_coins': 5000, 'reward_exp': 2000},
            {'name': '小有积蓄', 'description': '拥有10000金币', 'type': cls.TYPE_COINS, 'condition_value': 10000, 'reward_coins': 1000, 'reward_exp': 100},
            {'name': '富甲一方', 'description': '拥有100000金币', 'type': cls.TYPE_COINS, 'condition_value': 100000, 'reward_coins': 10000, 'reward_exp': 1000},
            {'name': '炸弹专家', 'description': '一局游戏中使用3次炸弹', 'type': cls.TYPE_SPECIAL, 'condition_value': 3, 'reward_coins': 500, 'reward_exp': 200},
            {'name': '春天来了', 'description': '打出春天', 'type': cls.TYPE_SPECIAL, 'condition_value': 1, 'reward_coins': 1000, 'reward_exp': 500},
        ]
        for achievement in achievements:
            existing = model.query.find_one({'name': achievement['name']})
            if not existing:
                model.create(**achievement)

    def create(self, name: str, description: str = '', type: int = 0, condition_value: int = 0,
               reward_coins: int = 0, reward_exp: int = 0, icon: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'type': type,
            'condition_value': condition_value,
            'reward_coins': reward_coins,
            'reward_exp': reward_exp,
            'icon': icon,
            'status': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_type(self, type: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'type': type, 'status': 1}, order_by='condition_value ASC')

    def get_all(self, page: int = 1, page_size: int = 10, type: int = None) -> Dict[str, Any]:
        conditions = {}
        if type is not None:
            conditions['type'] = type
        return self.query.paginate(page, page_size, conditions, order_by='type ASC, condition_value ASC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'type', 'condition_value', 'reward_coins', 'reward_exp', 'icon', 'status'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def update_status(self, record_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_type_text(self, type: int) -> str:
        type_map = {
            self.TYPE_WIN: '胜场',
            self.TYPE_LEVEL: '等级',
            self.TYPE_COINS: '金币',
            self.TYPE_SPECIAL: '特殊'
        }
        return type_map.get(type, '未知')

    def to_dict(self, achievement: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': achievement.get('id'),
            'name': achievement.get('name'),
            'description': achievement.get('description'),
            'type': achievement.get('type'),
            'type_text': self.get_type_text(achievement.get('type')),
            'condition_value': achievement.get('condition_value'),
            'reward_coins': achievement.get('reward_coins'),
            'reward_exp': achievement.get('reward_exp'),
            'icon': achievement.get('icon'),
            'status': achievement.get('status'),
            'created_at': achievement.get('created_at')
        }
