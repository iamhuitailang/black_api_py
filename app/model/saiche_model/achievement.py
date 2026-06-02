from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class AchievementModel:
    TABLE_NAME = 'tb_saiche_model_achievements'

    CONDITION_RACE_COUNT = 'race_count'
    CONDITION_WIN_COUNT = 'win_count'
    CONDITION_COINS = 'coins'
    CONDITION_LEVEL = 'level'
    CONDITION_TRACK_COUNT = 'track_count'
    CONDITION_CONSECUTIVE_WIN = 'consecutive_win'

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
                condition_value INTEGER DEFAULT 0,
                reward_coins INTEGER DEFAULT 0,
                reward_exp INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_condition_type ON {cls.TABLE_NAME}(condition_type)"
        db.execute(index_sql)

    @classmethod
    def init_default_achievements(cls):
        model = cls()
        existing = model.query.count()
        if existing == 0:
            default_achievements = [
                {
                    'name': '初出茅庐',
                    'description': '完成第一场比赛',
                    'icon': '🏁',
                    'condition_type': 'race_count',
                    'condition_value': 1,
                    'reward_coins': 100,
                    'reward_exp': 50
                },
                {
                    'name': '赛车新星',
                    'description': '完成10场比赛',
                    'icon': '⭐',
                    'condition_type': 'race_count',
                    'condition_value': 10,
                    'reward_coins': 300,
                    'reward_exp': 150
                },
                {
                    'name': '赛道老兵',
                    'description': '完成50场比赛',
                    'icon': '🏆',
                    'condition_type': 'race_count',
                    'condition_value': 50,
                    'reward_coins': 800,
                    'reward_exp': 400
                },
                {
                    'name': '传奇车手',
                    'description': '完成200场比赛',
                    'icon': '👑',
                    'condition_type': 'race_count',
                    'condition_value': 200,
                    'reward_coins': 2000,
                    'reward_exp': 1000
                },
                {
                    'name': '首胜',
                    'description': '赢得第一场比赛',
                    'icon': '🥇',
                    'condition_type': 'win_count',
                    'condition_value': 1,
                    'reward_coins': 200,
                    'reward_exp': 100
                },
                {
                    'name': '常胜将军',
                    'description': '累计赢得10场比赛',
                    'icon': '🏅',
                    'condition_type': 'win_count',
                    'condition_value': 10,
                    'reward_coins': 500,
                    'reward_exp': 250
                },
                {
                    'name': '赛道之王',
                    'description': '累计赢得50场比赛',
                    'icon': '👑',
                    'condition_type': 'win_count',
                    'condition_value': 50,
                    'reward_coins': 1500,
                    'reward_exp': 800
                },
                {
                    'name': '连冠王',
                    'description': '连续赢得5场比赛',
                    'icon': '🔥',
                    'condition_type': 'consecutive_win',
                    'condition_value': 5,
                    'reward_coins': 800,
                    'reward_exp': 400
                },
                {
                    'name': '小富翁',
                    'description': '累计获得10000金币',
                    'icon': '💰',
                    'condition_type': 'coins',
                    'condition_value': 10000,
                    'reward_coins': 1000,
                    'reward_exp': 300
                },
                {
                    'name': '大富豪',
                    'description': '累计获得50000金币',
                    'icon': '💎',
                    'condition_type': 'coins',
                    'condition_value': 50000,
                    'reward_coins': 3000,
                    'reward_exp': 1000
                },
                {
                    'name': '晋级高手',
                    'description': '达到5级',
                    'icon': '📈',
                    'condition_type': 'level',
                    'condition_value': 5,
                    'reward_coins': 500,
                    'reward_exp': 200
                },
                {
                    'name': '巅峰车手',
                    'description': '达到20级',
                    'icon': '🌟',
                    'condition_type': 'level',
                    'condition_value': 20,
                    'reward_coins': 2000,
                    'reward_exp': 1000
                },
                {
                    'name': '赛道探险家',
                    'description': '在所有不同赛道完成比赛',
                    'icon': '🗺️',
                    'condition_type': 'track_count',
                    'condition_value': 5,
                    'reward_coins': 800,
                    'reward_exp': 400
                }
            ]
            for achievement in default_achievements:
                achievement['created_at'] = datetime.now().isoformat()
                model.exec.insert(achievement)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, condition_type: str = None) -> Dict[str, Any]:
        conditions = {}
        if condition_type:
            conditions['condition_type'] = condition_type
        return self.query.paginate(page, page_size, conditions, order_by='id ASC')

    def get_by_condition_type(self, condition_type: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'condition_type': condition_type}, order_by='condition_value ASC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'icon', 'condition_type', 'condition_value',
            'reward_coins', 'reward_exp'
        ]}
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_condition_type_text(self, condition_type: str) -> str:
        type_map = {
            self.CONDITION_RACE_COUNT: '比赛场次',
            self.CONDITION_WIN_COUNT: '胜利场次',
            self.CONDITION_COINS: '累计金币',
            self.CONDITION_LEVEL: '等级',
            self.CONDITION_TRACK_COUNT: '赛道数量',
            self.CONDITION_CONSECUTIVE_WIN: '连胜场次'
        }
        return type_map.get(condition_type, '未知')

    def to_public_dict(self, achievement: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': achievement.get('id'),
            'name': achievement.get('name'),
            'description': achievement.get('description'),
            'icon': achievement.get('icon'),
            'condition_type': achievement.get('condition_type'),
            'condition_type_text': self.get_condition_type_text(achievement.get('condition_type', '')),
            'condition_value': achievement.get('condition_value'),
            'reward_coins': achievement.get('reward_coins'),
            'reward_exp': achievement.get('reward_exp'),
            'created_at': achievement.get('created_at')
        }

    def check_achievement(self, condition_type: str, current_value: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE condition_type = ? AND condition_value <= ?
            ORDER BY condition_value ASC
        """
        return self.db.fetch_all(sql, (condition_type, current_value))
