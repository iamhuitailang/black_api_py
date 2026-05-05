from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TsAchievementModel:
    TABLE_NAME = 'tb_ts_achievement'

    CONDITION_TYPE_TOTAL = 'total'
    CONDITION_TYPE_SINGLE = 'single'
    CONDITION_TYPE_STREAK = 'streak'

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
                badge_icon TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_condition_type ON {cls.TABLE_NAME}(condition_type)"
        db.execute(index_sql)

        cls._init_default_achievements(db)

    @classmethod
    def _init_default_achievements(cls, db):
        default_achievements = [
            {'name': '初次体验', 'description': '完成第一次跳绳记录', 'condition_type': 'total', 'condition_value': 1, 'badge_icon': '🎯'},
            {'name': '百次挑战', 'description': '累计跳绳100次', 'condition_type': 'total', 'condition_value': 100, 'badge_icon': '💪'},
            {'name': '千次达人', 'description': '累计跳绳1000次', 'condition_type': 'total', 'condition_value': 1000, 'badge_icon': '🏆'},
            {'name': '万次传奇', 'description': '累计跳绳10000次', 'condition_type': 'total', 'condition_value': 10000, 'badge_icon': '👑'},
            {'name': '十万大师', 'description': '累计跳绳100000次', 'condition_type': 'total', 'condition_value': 100000, 'badge_icon': '🌟'},
            {'name': '突破自我', 'description': '单次跳绳100次', 'condition_type': 'single', 'condition_value': 100, 'badge_icon': '🔥'},
            {'name': '飞速跳跃', 'description': '单次跳绳500次', 'condition_type': 'single', 'condition_value': 500, 'badge_icon': '⚡'},
            {'name': '极限挑战', 'description': '单次跳绳1000次', 'condition_type': 'single', 'condition_value': 1000, 'badge_icon': '💥'},
            {'name': '坚持不懈', 'description': '连续打卡3天', 'condition_type': 'streak', 'condition_value': 3, 'badge_icon': '📅'},
            {'name': '持之以恒', 'description': '连续打卡7天', 'condition_type': 'streak', 'condition_value': 7, 'badge_icon': '🌈'},
            {'name': '习惯养成', 'description': '连续打卡14天', 'condition_type': 'streak', 'condition_value': 14, 'badge_icon': '🌸'},
            {'name': '跳绳达人', 'description': '连续打卡30天', 'condition_type': 'streak', 'condition_value': 30, 'badge_icon': '🏅'},
            {'name': '百日之星', 'description': '连续打卡100天', 'condition_type': 'streak', 'condition_value': 100, 'badge_icon': '⭐'},
        ]

        for achievement in default_achievements:
            existing = db.fetch_one(
                f"SELECT id FROM {cls.TABLE_NAME} WHERE name = ?",
                (achievement['name'],)
            )
            if not existing:
                now = datetime.now().isoformat()
                db.execute(f"""
                    INSERT INTO {cls.TABLE_NAME} (name, description, condition_type, condition_value, badge_icon, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    achievement['name'],
                    achievement['description'],
                    achievement['condition_type'],
                    achievement['condition_value'],
                    achievement['badge_icon'],
                    now
                ))

    def create(self, name: str, description: str, condition_type: str,
               condition_value: int, badge_icon: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'condition_type': condition_type,
            'condition_value': condition_value,
            'badge_icon': badge_icon,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self, condition_type: str = None) -> List[Dict[str, Any]]:
        conditions = {}
        if condition_type:
            conditions['condition_type'] = condition_type
        return self.query.find_all(conditions, order_by='id ASC')

    def get_by_type(self, condition_type: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'condition_type': condition_type}, order_by='condition_value ASC')

    def check_achievement(self, user_stats: Dict[str, Any], achievement: Dict[str, Any]) -> bool:
        condition_type = achievement.get('condition_type')
        condition_value = achievement.get('condition_value', 0)

        if condition_type == self.CONDITION_TYPE_TOTAL:
            total_count = user_stats.get('total_count', 0)
            return total_count >= condition_value
        elif condition_type == self.CONDITION_TYPE_SINGLE:
            max_single_count = user_stats.get('max_single_count', 0)
            return max_single_count >= condition_value
        elif condition_type == self.CONDITION_TYPE_STREAK:
            streak_days = user_stats.get('streak_days', 0)
            return streak_days >= condition_value

        return False

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'condition_type', 'condition_value', 'badge_icon'
        ]}
        if update_data:
            return self.exec.update_by_id(record_id, update_data)
        return 0

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_dict(self, achievement: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': achievement.get('id'),
            'name': achievement.get('name'),
            'description': achievement.get('description'),
            'condition_type': achievement.get('condition_type'),
            'condition_value': achievement.get('condition_value'),
            'badge_icon': achievement.get('badge_icon'),
            'created_at': achievement.get('created_at')
        }
