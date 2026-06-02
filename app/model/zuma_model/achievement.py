from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ZumaAchievementModel:
    TABLE_NAME = 'tb_zuma_model_achievements'

    CATEGORY_SCORE = 'score'
    CATEGORY_COMBO = 'combo'
    CATEGORY_LEVEL = 'level'
    CATEGORY_GAMES = 'games'
    CATEGORY_SPECIAL = 'special'

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
                category TEXT NOT NULL,
                requirement INTEGER NOT NULL,
                reward_coins INTEGER DEFAULT 0,
                icon TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category ON {cls.TABLE_NAME}(category)"
        db.execute(index_sql)

    @classmethod
    def init_default_achievements(cls):
        db = get_db()
        default_achievements = [
            ('初出茅庐', '完成第一局游戏', cls.CATEGORY_GAMES, 1, 50, '🎮'),
            ('游戏达人', '完成10局游戏', cls.CATEGORY_GAMES, 10, 200, '🏆'),
            ('游戏大师', '完成100局游戏', cls.CATEGORY_GAMES, 100, 1000, '👑'),
            ('得分新手', '单局得分超过1000', cls.CATEGORY_SCORE, 1000, 100, '⭐'),
            ('得分达人', '单局得分超过5000', cls.CATEGORY_SCORE, 5000, 300, '🌟'),
            ('得分大师', '单局得分超过10000', cls.CATEGORY_SCORE, 10000, 800, '💫'),
            ('连击新手', '达成5连击', cls.CATEGORY_COMBO, 5, 100, '🔥'),
            ('连击达人', '达成10连击', cls.CATEGORY_COMBO, 10, 300, '💥'),
            ('连击大师', '达成20连击', cls.CATEGORY_COMBO, 20, 1000, '☄️'),
            ('等级提升', '达到5级', cls.CATEGORY_LEVEL, 5, 200, '📈'),
            ('等级达人', '达到10级', cls.CATEGORY_LEVEL, 10, 500, '🚀'),
            ('等级大师', '达到20级', cls.CATEGORY_LEVEL, 20, 1500, '🎖️'),
            ('完美消除', '单次消除10个珠子', cls.CATEGORY_SPECIAL, 10, 500, '✨'),
            ('精准射手', '连续命中50次', cls.CATEGORY_SPECIAL, 50, 500, '🎯'),
            ('传奇玩家', '单局得分超过50000', cls.CATEGORY_SCORE, 50000, 5000, '🏅'),
        ]

        for ach in default_achievements:
            check_sql = f"SELECT id FROM {cls.TABLE_NAME} WHERE name = ?"
            existing = db.fetch_one(check_sql, (ach[0],))
            if not existing:
                insert_sql = f"""
                    INSERT INTO {cls.TABLE_NAME} (name, description, category, requirement, reward_coins, icon, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """
                db.execute(insert_sql, (ach[0], ach[1], ach[2], ach[3], ach[4], ach[5], datetime.now().isoformat()))

    def create(self, name: str, description: str, category: str, requirement: int,
               reward_coins: int = 0, icon: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'category': category,
            'requirement': requirement,
            'reward_coins': reward_coins,
            'icon': icon,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id ASC')

    def get_by_category(self, category: str) -> List[Dict[str, Any]]:
        return self.query.find_many({'category': category}, order_by='requirement ASC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'category', 'requirement', 'reward_coins', 'icon'
        ]}
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
