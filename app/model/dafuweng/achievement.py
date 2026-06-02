from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class AchievementModel:
    TABLE_NAME = 'tb_dafuweng_model_achievement'

    DEFAULT_ACHIEVEMENTS = [
        {'name': '初出茅庐', 'description': '完成第一局游戏', 'condition_type': 'total_games', 'condition_value': 1, 'reward_coins': 500, 'icon': '🎮'},
        {'name': '常胜将军', 'description': '赢得3场游戏', 'condition_type': 'wins', 'condition_value': 3, 'reward_coins': 2000, 'icon': '🏆'},
        {'name': '地产大亨', 'description': '在一局中拥有5块地产', 'condition_type': 'lands_in_game', 'condition_value': 5, 'reward_coins': 1500, 'icon': '🏰'},
        {'name': '百万富翁', 'description': '在一局中金币达到50000', 'condition_type': 'max_money', 'condition_value': 50000, 'reward_coins': 3000, 'icon': '💎'},
        {'name': '道具达人', 'description': '在一局中使用10个道具', 'condition_type': 'items_used', 'condition_value': 10, 'reward_coins': 1000, 'icon': '🧪'},
        {'name': '幸运之星', 'description': '在一局中触发5次随机事件', 'condition_type': 'events_triggered', 'condition_value': 5, 'reward_coins': 800, 'icon': '⭐'},
        {'name': '破产专家', 'description': '在一局中破产', 'condition_type': 'bankrupt', 'condition_value': 1, 'reward_coins': 200, 'icon': '📉'},
        {'name': '大富翁', 'description': '累计完成20局游戏', 'condition_type': 'total_games', 'condition_value': 20, 'reward_coins': 5000, 'icon': '👑'}
    ]

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
                condition_type TEXT NOT NULL,
                condition_value INTEGER DEFAULT 0,
                reward_coins INTEGER DEFAULT 0,
                icon TEXT DEFAULT '',
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_condition_type ON {cls.TABLE_NAME}(condition_type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_active ON {cls.TABLE_NAME}(is_active)"
        db.execute(index_sql)

    @classmethod
    def init_default_achievements(cls):
        model = cls()
        existing = model.get_all()
        if not existing:
            for ach_data in cls.DEFAULT_ACHIEVEMENTS:
                model.create(**ach_data)

    def create(self, name: str, description: str = '', condition_type: str = '',
               condition_value: int = 0, reward_coins: int = 0, icon: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'condition_type': condition_type,
            'condition_value': condition_value,
            'reward_coins': reward_coins,
            'icon': icon,
            'is_active': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id ASC')

    def get_active_achievements(self) -> List[Dict[str, Any]]:
        return self.query.find_all({'is_active': 1}, order_by='id ASC')

    def update(self, achievement_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'condition_type', 'condition_value', 'reward_coins', 'icon', 'is_active'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(achievement_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_dict(self, achievement: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': achievement.get('id'),
            'name': achievement.get('name'),
            'description': achievement.get('description'),
            'condition_type': achievement.get('condition_type'),
            'condition_value': achievement.get('condition_value'),
            'reward_coins': achievement.get('reward_coins'),
            'icon': achievement.get('icon'),
            'is_active': achievement.get('is_active'),
            'created_at': achievement.get('created_at'),
            'updated_at': achievement.get('updated_at')
        }
