from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class AchievementModel:
    TABLE_NAME = 'tb_jinwutuan_model_achievement'

    CATEGORY_PLAY = 'play'
    CATEGORY_SCORE = 'score'
    CATEGORY_COMBO = 'combo'
    CATEGORY_COLLECTION = 'collection'

    CATEGORIES = [
        {'code': CATEGORY_PLAY, 'name': '演奏'},
        {'code': CATEGORY_SCORE, 'name': '得分'},
        {'code': CATEGORY_COMBO, 'name': '连击'},
        {'code': CATEGORY_COLLECTION, 'name': '收藏'}
    ]

    STATUS_ENABLED = 0
    STATUS_DISABLED = 1

    DEFAULT_ACHIEVEMENTS = [
        {
            'name': '初出茅庐',
            'description': '完成第一首歌曲',
            'icon': '🎵',
            'category': CATEGORY_PLAY,
            'condition_type': 'total_games',
            'condition_value': 1,
            'reward_coins': 50
        },
        {
            'name': '小有名气',
            'description': '累计演奏10首歌曲',
            'icon': '🎶',
            'category': CATEGORY_PLAY,
            'condition_type': 'total_games',
            'condition_value': 10,
            'reward_coins': 200
        },
        {
            'name': '舞台常客',
            'description': '累计演奏50首歌曲',
            'icon': '🎤',
            'category': CATEGORY_PLAY,
            'condition_type': 'total_games',
            'condition_value': 50,
            'reward_coins': 500
        },
        {
            'name': '百分选手',
            'description': '单首歌曲得分超过100000',
            'icon': '💯',
            'category': CATEGORY_SCORE,
            'condition_type': 'single_score',
            'condition_value': 100000,
            'reward_coins': 300
        },
        {
            'name': '高分达人',
            'description': '单首歌曲得分超过500000',
            'icon': '🏆',
            'category': CATEGORY_SCORE,
            'condition_type': 'single_score',
            'condition_value': 500000,
            'reward_coins': 800
        },
        {
            'name': '连击新手',
            'description': '达成50连击',
            'icon': '🔥',
            'category': CATEGORY_COMBO,
            'condition_type': 'max_combo',
            'condition_value': 50,
            'reward_coins': 200
        },
        {
            'name': '连击大师',
            'description': '达成200连击',
            'icon': '⚡',
            'category': CATEGORY_COMBO,
            'condition_type': 'max_combo',
            'condition_value': 200,
            'reward_coins': 600
        },
        {
            'name': '全曲制霸',
            'description': '游玩所有可用歌曲',
            'icon': '👑',
            'category': CATEGORY_COLLECTION,
            'condition_type': 'unique_songs',
            'condition_value': -1,
            'reward_coins': 1000
        }
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
                icon TEXT DEFAULT '',
                category TEXT NOT NULL,
                condition_type TEXT NOT NULL,
                condition_value INTEGER DEFAULT 0,
                reward_coins INTEGER DEFAULT 0,
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category ON {cls.TABLE_NAME}(category)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_condition_type ON {cls.TABLE_NAME}(condition_type)"
        db.execute(index_sql)

    @classmethod
    def init_default_achievements(cls):
        model = cls()

        for ach in cls.DEFAULT_ACHIEVEMENTS:
            existing = model.query.find_one({'name': ach['name']})
            if not existing:
                model.create(
                    name=ach['name'],
                    description=ach['description'],
                    icon=ach['icon'],
                    category=ach['category'],
                    condition_type=ach['condition_type'],
                    condition_value=ach['condition_value'],
                    reward_coins=ach['reward_coins']
                )

    def create(self, name: str, description: str = '', icon: str = '',
               category: str = '', condition_type: str = '',
               condition_value: int = 0, reward_coins: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'icon': icon,
            'category': category,
            'condition_type': condition_type,
            'condition_value': condition_value,
            'reward_coins': reward_coins,
            'status': self.STATUS_ENABLED,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, achievement_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'icon', 'category',
            'condition_type', 'condition_value', 'reward_coins', 'status'
        ]}
        return self.exec.update_by_id(achievement_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, category: str = None,
                status: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        if category:
            conditions['category'] = category

        return self.query.paginate(page, page_size, conditions, order_by='id ASC')

    def get_category_name(self, category: str) -> str:
        for c in self.CATEGORIES:
            if c['code'] == category:
                return c['name']
        return '其他'

    def to_dict(self, achievement: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': achievement.get('id'),
            'name': achievement.get('name'),
            'description': achievement.get('description'),
            'icon': achievement.get('icon'),
            'category': achievement.get('category'),
            'category_name': self.get_category_name(achievement.get('category')),
            'condition_type': achievement.get('condition_type'),
            'condition_value': achievement.get('condition_value'),
            'reward_coins': achievement.get('reward_coins'),
            'status': achievement.get('status'),
            'created_at': achievement.get('created_at')
        }
