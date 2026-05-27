from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class AchievementModel:
    TABLE_NAME = 'tb_daka_achievements'

    CATEGORY_STREAK = 'streak'
    CATEGORY_COMPLETION = 'completion'
    CATEGORY_POINTS = 'points'
    CATEGORY_SPECIAL = 'special'

    DEFAULT_ACHIEVEMENTS = [
        {'name': '初次打卡', 'description': '完成第一次打卡', 'icon': '🎯', 'category': 'streak', 'condition_type': 'checkin_count', 'condition_value': 1, 'points_reward': 10},
        {'name': '连续7天', 'description': '连续打卡7天', 'icon': '🔥', 'category': 'streak', 'condition_type': 'streak_days', 'condition_value': 7, 'points_reward': 50},
        {'name': '连续30天', 'description': '连续打卡30天', 'icon': '🌟', 'category': 'streak', 'condition_type': 'streak_days', 'condition_value': 30, 'points_reward': 200},
        {'name': '连续100天', 'description': '连续打卡100天', 'icon': '👑', 'category': 'streak', 'condition_type': 'streak_days', 'condition_value': 100, 'points_reward': 1000},
        {'name': '完美一日', 'description': '一天内完成所有任务', 'icon': '✨', 'category': 'completion', 'condition_type': 'perfect_day', 'condition_value': 1, 'points_reward': 30},
        {'name': '任务达人', 'description': '累计完成100次打卡', 'icon': '🏆', 'category': 'completion', 'condition_type': 'total_completions', 'condition_value': 100, 'points_reward': 100},
        {'name': '千次成就', 'description': '累计完成1000次打卡', 'icon': '🏅', 'category': 'completion', 'condition_type': 'total_completions', 'condition_value': 1000, 'points_reward': 500},
        {'name': '积分新手', 'description': '累计获得100积分', 'icon': '💰', 'category': 'points', 'condition_type': 'total_points', 'condition_value': 100, 'points_reward': 20},
        {'name': '积分达人', 'description': '累计获得1000积分', 'icon': '💎', 'category': 'points', 'condition_type': 'total_points', 'condition_value': 1000, 'points_reward': 200},
        {'name': '早起达人', 'description': '早起打卡连续30天', 'icon': '🌅', 'category': 'special', 'condition_type': 'task_streak', 'condition_value': 30, 'task_id': 1, 'points_reward': 150},
        {'name': '运动健将', 'description': '运动打卡累计50次', 'icon': '🏋️', 'category': 'special', 'condition_type': 'task_count', 'condition_value': 50, 'task_id': 4, 'points_reward': 150},
        {'name': '冥想大师', 'description': '冥想打卡连续21天', 'icon': '🧘', 'category': 'special', 'condition_type': 'task_streak', 'condition_value': 21, 'task_id': 5, 'points_reward': 100},
        {'name': '阅读爱好者', 'description': '阅读打卡累计100次', 'icon': '📖', 'category': 'special', 'condition_type': 'task_count', 'condition_value': 100, 'task_id': 2, 'points_reward': 200},
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
                category TEXT DEFAULT '',
                condition_type TEXT DEFAULT '',
                condition_value INTEGER DEFAULT 0,
                task_id INTEGER DEFAULT 0,
                points_reward INTEGER DEFAULT 0,
                sort_order INTEGER DEFAULT 0,
                is_system INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category ON {cls.TABLE_NAME}(category)"
        db.execute(index_sql)

    @classmethod
    def init_default_achievements(cls):
        db = get_db()
        achievement_model = cls()
        for achievement in cls.DEFAULT_ACHIEVEMENTS:
            existing = db.fetch_one(
                f"SELECT id FROM {cls.TABLE_NAME} WHERE name = ?",
                (achievement['name'],)
            )
            if not existing:
                achievement_model.create(**achievement)

    def create(self, name: str, description: str = '', icon: str = '', category: str = '',
               condition_type: str = '', condition_value: int = 0, task_id: int = 0,
               points_reward: int = 0, sort_order: int = 0, is_system: int = 1) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'icon': icon,
            'category': category,
            'condition_type': condition_type,
            'condition_value': condition_value,
            'task_id': task_id,
            'points_reward': points_reward,
            'sort_order': sort_order,
            'is_system': is_system,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, achievement_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(achievement_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all({}, order_by='sort_order ASC, id ASC')

    def get_by_category(self, category: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'category': category}, order_by='sort_order ASC, id ASC')

    def to_dict(self, achievement: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': achievement.get('id'),
            'name': achievement.get('name'),
            'description': achievement.get('description'),
            'icon': achievement.get('icon'),
            'category': achievement.get('category'),
            'condition_type': achievement.get('condition_type'),
            'condition_value': achievement.get('condition_value'),
            'task_id': achievement.get('task_id'),
            'points_reward': achievement.get('points_reward'),
            'sort_order': achievement.get('sort_order'),
            'is_system': achievement.get('is_system'),
            'created_at': achievement.get('created_at')
        }
