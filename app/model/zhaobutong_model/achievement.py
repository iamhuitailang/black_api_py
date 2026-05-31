from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ZbtAchievementModel:
    TABLE_NAME = 'tb_zhaobutong_model_achievement'

    TYPE_SPEED = 'speed'
    TYPE_COUNT = 'count'
    TYPE_STREAK = 'streak'
    TYPE_SPECIAL = 'special'

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
                name TEXT NOT NULL UNIQUE,
                title TEXT NOT NULL,
                description TEXT DEFAULT '',
                icon TEXT DEFAULT '',
                type TEXT DEFAULT 'special',
                condition_value INTEGER DEFAULT 0,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)

    @classmethod
    def init_default_achievements(cls):
        model = cls()
        count = model.query.count()
        if count > 0:
            return

        defaults = [
            {'name': 'first_win', 'title': '初出茅庐', 'description': '完成第一关卡', 'type': cls.TYPE_COUNT, 'condition_value': 1, 'icon': '🏆', 'sort_order': 1},
            {'name': 'five_wins', 'title': '小试牛刀', 'description': '完成5个关卡', 'type': cls.TYPE_COUNT, 'condition_value': 5, 'icon': '🎯', 'sort_order': 2},
            {'name': 'ten_wins', 'title': '得心应手', 'description': '完成10个关卡', 'type': cls.TYPE_COUNT, 'condition_value': 10, 'icon': '⭐', 'sort_order': 3},
            {'name': 'speed_demon', 'title': '闪电之眼', 'description': '30秒内完成一个关卡', 'type': cls.TYPE_SPEED, 'condition_value': 30, 'icon': '⚡', 'sort_order': 4},
            {'name': 'no_hints', 'title': '火眼金睛', 'description': '不使用提示完成一个关卡', 'type': cls.TYPE_SPECIAL, 'condition_value': 0, 'icon': '👁️', 'sort_order': 5},
            {'name': 'hard_master', 'title': '困难大师', 'description': '完成一个困难关卡', 'type': cls.TYPE_SPECIAL, 'condition_value': 0, 'icon': '👑', 'sort_order': 6},
            {'name': 'all_themes', 'title': '全能探索者', 'description': '完成所有主题的关卡', 'type': cls.TYPE_SPECIAL, 'condition_value': 0, 'icon': '🌈', 'sort_order': 7},
            {'name': 'perfect_score', 'title': '完美通关', 'description': '找到所有不同点且零失误', 'type': cls.TYPE_SPECIAL, 'condition_value': 0, 'icon': '💎', 'sort_order': 8},
        ]

        for item in defaults:
            now = datetime.now().isoformat()
            data = {**item, 'created_at': now}
            model.exec.insert(data)

    def create(self, name: str, title: str, description: str = '', icon: str = '',
               type: str = 'special', condition_value: int = 0, sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'title': title,
            'description': description,
            'icon': icon,
            'type': type,
            'condition_value': condition_value,
            'sort_order': sort_order,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'name': name})

    def get_all_achievements(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='sort_order ASC, id ASC')

    def update(self, achievement_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'title', 'description', 'icon', 'type', 'condition_value', 'sort_order'
        ]}
        return self.exec.update_by_id(achievement_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_dict(self, achievement: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': achievement.get('id'),
            'name': achievement.get('name'),
            'title': achievement.get('title'),
            'description': achievement.get('description'),
            'icon': achievement.get('icon'),
            'type': achievement.get('type'),
            'condition_value': achievement.get('condition_value'),
            'sort_order': achievement.get('sort_order')
        }
