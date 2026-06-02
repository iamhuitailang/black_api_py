from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class AchievementModel:
    TABLE_NAME = 'tb_majiang_model_achievement'

    CATEGORY_WIN = 1
    CATEGORY_FAN = 2
    CATEGORY_GAMES = 3
    CATEGORY_SPECIAL = 4

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
                description TEXT NOT NULL,
                category INTEGER NOT NULL,
                condition_type TEXT NOT NULL,
                condition_value INTEGER NOT NULL,
                reward_coins INTEGER DEFAULT 0,
                reward_exp INTEGER DEFAULT 0,
                icon TEXT DEFAULT '',
                rarity INTEGER DEFAULT 1,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category ON {cls.TABLE_NAME}(category)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql2)

    @classmethod
    def init_default_achievements(cls):
        model = cls()
        default_achievements = [
            {'name': '初出茅庐', 'description': '完成第一场麻将对局', 'category': 3, 'condition_type': 'total_games', 'condition_value': 1, 'reward_coins': 100, 'reward_exp': 50, 'rarity': 1},
            {'name': '小试牛刀', 'description': '累计完成10场对局', 'category': 3, 'condition_type': 'total_games', 'condition_value': 10, 'reward_coins': 200, 'reward_exp': 100, 'rarity': 1},
            {'name': '身经百战', 'description': '累计完成100场对局', 'category': 3, 'condition_type': 'total_games', 'condition_value': 100, 'reward_coins': 500, 'reward_exp': 300, 'rarity': 2},
            {'name': '千局王', 'description': '累计完成1000场对局', 'category': 3, 'condition_type': 'total_games', 'condition_value': 1000, 'reward_coins': 2000, 'reward_exp': 1000, 'rarity': 4},
            {'name': '首战告捷', 'description': '赢得第一场对局', 'category': 1, 'condition_type': 'wins', 'condition_value': 1, 'reward_coins': 100, 'reward_exp': 50, 'rarity': 1},
            {'name': '常胜将军', 'description': '累计赢得10场对局', 'category': 1, 'condition_type': 'wins', 'condition_value': 10, 'reward_coins': 300, 'reward_exp': 150, 'rarity': 2},
            {'name': '百战百胜', 'description': '累计赢得100场对局', 'category': 1, 'condition_type': 'wins', 'condition_value': 100, 'reward_coins': 1000, 'reward_exp': 500, 'rarity': 3},
            {'name': '雀神', 'description': '累计赢得500场对局', 'category': 1, 'condition_type': 'wins', 'condition_value': 500, 'reward_coins': 5000, 'reward_exp': 2000, 'rarity': 5},
            {'name': '一炮打响', 'description': '第一次胡牌番数达到3番', 'category': 2, 'condition_type': 'max_fan', 'condition_value': 3, 'reward_coins': 200, 'reward_exp': 100, 'rarity': 1},
            {'name': '小有名气', 'description': '第一次胡牌番数达到6番', 'category': 2, 'condition_type': 'max_fan', 'condition_value': 6, 'reward_coins': 500, 'reward_exp': 250, 'rarity': 2},
            {'name': '大牌专家', 'description': '第一次胡牌番数达到8番', 'category': 2, 'condition_type': 'max_fan', 'condition_value': 8, 'reward_coins': 1000, 'reward_exp': 500, 'rarity': 3},
            {'name': '天选之人', 'description': '第一次胡牌番数达到13番', 'category': 2, 'condition_type': 'max_fan', 'condition_value': 13, 'reward_coins': 3000, 'reward_exp': 1500, 'rarity': 5},
            {'name': '连庄高手', 'description': '连续赢3场对局', 'category': 4, 'condition_type': 'win_streak', 'condition_value': 3, 'reward_coins': 300, 'reward_exp': 150, 'rarity': 2},
            {'name': '七连胜', 'description': '连续赢7场对局', 'category': 4, 'condition_type': 'win_streak', 'condition_value': 7, 'reward_coins': 800, 'reward_exp': 400, 'rarity': 3},
            {'name': '十全十美', 'description': '连续赢10场对局', 'category': 4, 'condition_type': 'win_streak', 'condition_value': 10, 'reward_coins': 2000, 'reward_exp': 1000, 'rarity': 4},
        ]
        for ach_data in default_achievements:
            existing = model.get_by_name(ach_data['name'])
            if not existing:
                model.create(**ach_data)

    def create(self, name: str, description: str, category: int, condition_type: str,
               condition_value: int, reward_coins: int = 0, reward_exp: int = 0,
               icon: str = '', rarity: int = 1) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'category': category,
            'condition_type': condition_type,
            'condition_value': condition_value,
            'reward_coins': reward_coins,
            'reward_exp': reward_exp,
            'icon': icon,
            'rarity': rarity,
            'status': 1,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'name': name})

    def get_all_active(self) -> List[Dict[str, Any]]:
        return self.query.find_all({'status': 1}, order_by='category ASC, rarity ASC')

    def get_by_category(self, category: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'category': category, 'status': 1}, order_by='condition_value ASC')

    def check_achievements(self, user_stats: Dict[str, Any]) -> List[Dict[str, Any]]:
        all_achievements = self.get_all_active()
        unlocked = []

        for ach in all_achievements:
            condition_type = ach.get('condition_type', '')
            condition_value = ach.get('condition_value', 0)
            current_value = user_stats.get(condition_type, 0)

            if current_value >= condition_value:
                unlocked.append(ach)

        return unlocked

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'category', 'condition_type', 'condition_value',
            'reward_coins', 'reward_exp', 'icon', 'rarity', 'status'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.update_by_id(record_id, {'status': 0})

    def get_all(self, page: int = 1, page_size: int = 10, category: int = None,
                status: int = None) -> Dict[str, Any]:
        conditions = {}
        if category is not None:
            conditions['category'] = category
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_category_text(self, category: int) -> str:
        cat_map = {
            self.CATEGORY_WIN: '胜利类',
            self.CATEGORY_FAN: '番数类',
            self.CATEGORY_GAMES: '场次类',
            self.CATEGORY_SPECIAL: '特殊类'
        }
        return cat_map.get(category, '未知')

    def get_rarity_text(self, rarity: int) -> str:
        rarity_map = {1: '普通', 2: '稀有', 3: '史诗', 4: '传说', 5: '神话'}
        return rarity_map.get(rarity, '未知')

    def to_dict(self, achievement: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': achievement.get('id'),
            'name': achievement.get('name'),
            'description': achievement.get('description'),
            'category': achievement.get('category'),
            'category_text': self.get_category_text(achievement.get('category')),
            'condition_type': achievement.get('condition_type'),
            'condition_value': achievement.get('condition_value'),
            'reward_coins': achievement.get('reward_coins'),
            'reward_exp': achievement.get('reward_exp'),
            'icon': achievement.get('icon'),
            'rarity': achievement.get('rarity'),
            'rarity_text': self.get_rarity_text(achievement.get('rarity')),
            'status': achievement.get('status'),
            'created_at': achievement.get('created_at')
        }
