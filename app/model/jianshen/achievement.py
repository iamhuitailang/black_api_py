from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class JianshenAchievementModel:
    TABLE_NAME = 'tb_jianshen_achievements'

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
                type TEXT DEFAULT 'checkin',
                condition_value INTEGER DEFAULT 0,
                exp_reward INTEGER DEFAULT 0,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

    @classmethod
    def init_default_achievements(cls):
        model = cls()
        existing = model.query.count({})
        if existing > 0:
            return
        defaults = [
            {'name': '初次打卡', 'description': '完成第一次健身打卡', 'icon': '🏅', 'type': 'first_time', 'condition_value': 1, 'exp_reward': 10, 'sort_order': 1},
            {'name': '坚持一周', 'description': '连续打卡7天', 'icon': '🔥', 'type': 'consecutive_days', 'condition_value': 7, 'exp_reward': 30, 'sort_order': 2},
            {'name': '坚持一月', 'description': '连续打卡30天', 'icon': '💪', 'type': 'consecutive_days', 'condition_value': 30, 'exp_reward': 100, 'sort_order': 3},
            {'name': '百日挑战', 'description': '连续打卡100天', 'icon': '👑', 'type': 'consecutive_days', 'condition_value': 100, 'exp_reward': 500, 'sort_order': 4},
            {'name': '健身达人', 'description': '累计打卡50次', 'icon': '🌟', 'type': 'total_checkins', 'condition_value': 50, 'exp_reward': 50, 'sort_order': 5},
            {'name': '健身狂魔', 'description': '累计打卡200次', 'icon': '🏆', 'type': 'total_checkins', 'condition_value': 200, 'exp_reward': 200, 'sort_order': 6},
            {'name': '健身之神', 'description': '累计打卡500次', 'icon': '⚡', 'type': 'total_checkins', 'condition_value': 500, 'exp_reward': 500, 'sort_order': 7},
            {'name': '全能战士', 'description': '完成所有训练项目', 'icon': '🛡️', 'type': 'all_projects', 'condition_value': 6, 'exp_reward': 100, 'sort_order': 8},
            {'name': '早起打卡', 'description': '早上8点前打卡一次', 'icon': '🌅', 'type': 'morning', 'condition_value': 1, 'exp_reward': 20, 'sort_order': 9},
            {'name': '夜跑达人', 'description': '深夜打卡一次', 'icon': '🌙', 'type': 'night', 'condition_value': 1, 'exp_reward': 20, 'sort_order': 10},
        ]
        now = datetime.now().isoformat()
        for a in defaults:
            a['created_at'] = now
            model.exec.insert(a)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='sort_order ASC, id ASC')

    def get_by_type(self, achievement_type: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'type': achievement_type}, order_by='sort_order ASC')

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def to_dict(self, record: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': record.get('id'),
            'name': record.get('name'),
            'description': record.get('description'),
            'icon': record.get('icon'),
            'type': record.get('type'),
            'condition_value': record.get('condition_value'),
            'exp_reward': record.get('exp_reward'),
            'sort_order': record.get('sort_order'),
            'created_at': record.get('created_at')
        }
