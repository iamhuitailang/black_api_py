from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class AchievementModel:
    TABLE_NAME = 'tb_heping_model_achievements'

    RARITY_COMMON = 'common'
    RARITY_RARE = 'rare'
    RARITY_EPIC = 'epic'
    RARITY_LEGENDARY = 'legendary'

    CONDITION_KILLS = 'kills'
    CONDITION_WINS = 'wins'
    CONDITION_GAMES = 'games'
    CONDITION_SURVIVE_TIME = 'survive_time'

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
                icon TEXT DEFAULT '',
                condition_type TEXT NOT NULL,
                condition_value INTEGER NOT NULL,
                reward_exp INTEGER DEFAULT 0,
                rarity TEXT DEFAULT 'common',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_condition_type ON {cls.TABLE_NAME}(condition_type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_rarity ON {cls.TABLE_NAME}(rarity)"
        db.execute(index_sql)

    def create(self, name: str, condition_type: str, condition_value: int,
               description: str = '', icon: str = '', reward_exp: int = 0,
               rarity: str = 'common') -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'icon': icon,
            'condition_type': condition_type,
            'condition_value': condition_value,
            'reward_exp': reward_exp,
            'rarity': rarity,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id ASC')

    @classmethod
    def init_default_achievements(cls):
        model = cls()
        if model.query.count() > 0:
            return

        achievements = [
            {'name': '初出茅庐', 'description': '完成第一场游戏', 'condition_type': 'games', 'condition_value': 1, 'reward_exp': 10, 'rarity': 'common'},
            {'name': '百战老兵', 'description': '完成100场游戏', 'condition_type': 'games', 'condition_value': 100, 'reward_exp': 200, 'rarity': 'rare'},
            {'name': '首次击杀', 'description': '击杀1名敌人', 'condition_type': 'kills', 'condition_value': 1, 'reward_exp': 10, 'rarity': 'common'},
            {'name': '杀敌如麻', 'description': '累计击杀50名敌人', 'condition_type': 'kills', 'condition_value': 50, 'reward_exp': 100, 'rarity': 'rare'},
            {'name': '战神降临', 'description': '累计击杀500名敌人', 'condition_type': 'kills', 'condition_value': 500, 'reward_exp': 500, 'rarity': 'legendary'},
            {'name': '初尝胜果', 'description': '获得第1次胜利', 'condition_type': 'wins', 'condition_value': 1, 'reward_exp': 50, 'rarity': 'common'},
            {'name': '常胜将军', 'description': '获得10次胜利', 'condition_type': 'wins', 'condition_value': 10, 'reward_exp': 200, 'rarity': 'rare'},
            {'name': '战无不胜', 'description': '获得50次胜利', 'condition_type': 'wins', 'condition_value': 50, 'reward_exp': 500, 'rarity': 'epic'},
            {'name': '绝地求生', 'description': '单局存活超过20分钟', 'condition_type': 'survive_time', 'condition_value': 1200, 'reward_exp': 100, 'rarity': 'rare'},
            {'name': '不朽传说', 'description': '累计获得100次胜利', 'condition_type': 'wins', 'condition_value': 100, 'reward_exp': 1000, 'rarity': 'legendary'}
        ]

        now = datetime.now().isoformat()
        data_list = []
        for a in achievements:
            data_list.append({
                'name': a['name'],
                'description': a['description'],
                'icon': '',
                'condition_type': a['condition_type'],
                'condition_value': a['condition_value'],
                'reward_exp': a['reward_exp'],
                'rarity': a['rarity'],
                'created_at': now
            })

        model.exec.insert_many(data_list)
