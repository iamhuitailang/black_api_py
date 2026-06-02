from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class DafeijiAchievementModel:
    TABLE_NAME = 'tb_dafeiji_model_achievement'

    CATEGORY_COMBAT = 'combat'
    CATEGORY_SURVIVAL = 'survival'
    CATEGORY_COLLECTION = 'collection'
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
                description TEXT DEFAULT '',
                category TEXT DEFAULT 'combat',
                condition_type TEXT NOT NULL,
                condition_value INTEGER DEFAULT 0,
                reward_score INTEGER DEFAULT 0,
                icon TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category ON {cls.TABLE_NAME}(category)"
        db.execute(index_sql)

    @classmethod
    def init_default_achievements(cls):
        model = cls()
        count = model.query.count({})
        if count > 0:
            return
        defaults = [
            {'name': '初出茅庐', 'description': '完成第一场游戏', 'category': cls.CATEGORY_COMBAT, 'condition_type': 'games_played', 'condition_value': 1, 'reward_score': 10},
            {'name': '百战勇士', 'description': '完成100场游戏', 'category': cls.CATEGORY_COMBAT, 'condition_type': 'games_played', 'condition_value': 100, 'reward_score': 500},
            {'name': '歼灭者', 'description': '单局消灭50个敌人', 'category': cls.CATEGORY_COMBAT, 'condition_type': 'enemies_killed_single', 'condition_value': 50, 'reward_score': 200},
            {'name': '战场屠夫', 'description': '单局消灭100个敌人', 'category': cls.CATEGORY_COMBAT, 'condition_type': 'enemies_killed_single', 'condition_value': 100, 'reward_score': 500},
            {'name': '幸存者', 'description': '到达第5波', 'category': cls.CATEGORY_SURVIVAL, 'condition_type': 'wave_reached', 'condition_value': 5, 'reward_score': 100},
            {'name': '不屈意志', 'description': '到达第10波', 'category': cls.CATEGORY_SURVIVAL, 'condition_type': 'wave_reached', 'condition_value': 10, 'reward_score': 300},
            {'name': '末日战神', 'description': '到达第20波', 'category': cls.CATEGORY_SURVIVAL, 'condition_type': 'wave_reached', 'condition_value': 20, 'reward_score': 1000},
            {'name': '千分达人', 'description': '单局得分达到1000', 'category': cls.CATEGORY_COLLECTION, 'condition_type': 'score_single', 'condition_value': 1000, 'reward_score': 50},
            {'name': '万分传说', 'description': '单局得分达到10000', 'category': cls.CATEGORY_COLLECTION, 'condition_type': 'score_single', 'condition_value': 10000, 'reward_score': 500},
            {'name': '道具收集者', 'description': '单局收集5个道具', 'category': cls.CATEGORY_COLLECTION, 'condition_type': 'items_collected_single', 'condition_value': 5, 'reward_score': 100},
        ]
        now = datetime.now().isoformat()
        for item in defaults:
            item['created_at'] = now
            item['updated_at'] = now
            item['icon'] = ''
            model.exec.insert(item)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        data['updated_at'] = now
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, category: str = None) -> Dict[str, Any]:
        conditions = {}
        if category:
            conditions['category'] = category
        return self.query.paginate(page, page_size, conditions, order_by='id ASC')

    def get_all_list(self, category: str = None) -> List[Dict[str, Any]]:
        conditions = {}
        if category:
            conditions['category'] = category
        return self.query.find_all(conditions, order_by='id ASC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'category', 'condition_type',
            'condition_value', 'reward_score', 'icon'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_dict(self, achievement: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': achievement.get('id'),
            'name': achievement.get('name'),
            'description': achievement.get('description'),
            'category': achievement.get('category'),
            'condition_type': achievement.get('condition_type'),
            'condition_value': achievement.get('condition_value'),
            'reward_score': achievement.get('reward_score'),
            'icon': achievement.get('icon'),
            'created_at': achievement.get('created_at')
        }
