from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class AchievementModel:
    TABLE_NAME = 'tb_huangjin_model_achievement'

    TYPE_SCORE = 'score'
    TYPE_GAMES = 'games'
    TYPE_ORE = 'ore'
    TYPE_SPECIAL = 'special'

    STATUS_ENABLED = 0
    STATUS_DISABLED = 1

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
                condition_value INTEGER NOT NULL DEFAULT 0,
                icon TEXT DEFAULT '',
                badge_color TEXT DEFAULT '#FFD700',
                sort_order INTEGER DEFAULT 0,
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_condition_type ON {cls.TABLE_NAME}(condition_type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    @classmethod
    def init_default_achievements(cls):
        model = cls()
        existing = model.query.count()
        if existing > 0:
            return
        now = datetime.now().isoformat()
        defaults = [
            {'name': '初出茅庐', 'description': '完成第一局游戏', 'condition_type': cls.TYPE_GAMES, 'condition_value': 1, 'badge_color': '#CD7F32', 'sort_order': 1},
            {'name': '小有成就', 'description': '累计完成10局游戏', 'condition_type': cls.TYPE_GAMES, 'condition_value': 10, 'badge_color': '#CD7F32', 'sort_order': 2},
            {'name': '矿场老手', 'description': '累计完成50局游戏', 'condition_type': cls.TYPE_GAMES, 'condition_value': 50, 'badge_color': '#C0C0C0', 'sort_order': 3},
            {'name': '挖矿达人', 'description': '累计完成100局游戏', 'condition_type': cls.TYPE_GAMES, 'condition_value': 100, 'badge_color': '#FFD700', 'sort_order': 4},
            {'name': '百分离手', 'description': '单局得分超过100', 'condition_type': cls.TYPE_SCORE, 'condition_value': 100, 'badge_color': '#C0C0C0', 'sort_order': 5},
            {'name': '千金万两', 'description': '单局得分超过500', 'condition_type': cls.TYPE_SCORE, 'condition_value': 500, 'badge_color': '#FFD700', 'sort_order': 6},
            {'name': '日进斗金', 'description': '单局得分超过1000', 'condition_type': cls.TYPE_SCORE, 'condition_value': 1000, 'badge_color': '#E0115F', 'sort_order': 7},
            {'name': '小有积蓄', 'description': '累计总分超过1000', 'condition_type': cls.TYPE_SCORE, 'condition_value': 1000, 'badge_color': '#CD7F32', 'sort_order': 8},
            {'name': '富甲一方', 'description': '累计总分超过10000', 'condition_type': cls.TYPE_SCORE, 'condition_value': 10000, 'badge_color': '#FFD700', 'sort_order': 9},
            {'name': '淘宝新手', 'description': '单局收集5个矿石', 'condition_type': cls.TYPE_ORE, 'condition_value': 5, 'badge_color': '#CD7F32', 'sort_order': 10},
            {'name': '淘宝专家', 'description': '单局收集15个矿石', 'condition_type': cls.TYPE_ORE, 'condition_value': 15, 'badge_color': '#FFD700', 'sort_order': 11},
            {'name': '传奇矿工', 'description': '解锁所有其他成就', 'condition_type': cls.TYPE_SPECIAL, 'condition_value': 11, 'badge_color': '#E0115F', 'sort_order': 12},
        ]
        for ach_data in defaults:
            ach_data['icon'] = ''
            ach_data['status'] = cls.STATUS_ENABLED
            ach_data['created_at'] = now
            ach_data['updated_at'] = now
            model.exec.insert(ach_data)

    def create(self, name: str, description: str, condition_type: str,
               condition_value: int, icon: str = '', badge_color: str = '#FFD700',
               sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'condition_type': condition_type,
            'condition_value': condition_value,
            'icon': icon,
            'badge_color': badge_color,
            'sort_order': sort_order,
            'status': self.STATUS_ENABLED,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_enabled(self) -> list:
        return self.query.find_all(
            {'status': self.STATUS_ENABLED},
            order_by='sort_order ASC, id ASC'
        )

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None,
                condition_type: str = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        if condition_type is not None:
            conditions['condition_type'] = condition_type
        return self.query.paginate(page, page_size, conditions, order_by='sort_order ASC, id ASC')

    def update(self, achievement_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'condition_type', 'condition_value',
            'icon', 'badge_color', 'status', 'sort_order'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(achievement_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def update_status(self, achievement_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(achievement_id, data)

    @staticmethod
    def get_condition_type_text(condition_type: str) -> str:
        type_map = {
            'score': '分数',
            'games': '局数',
            'ore': '矿石',
            'special': '特殊'
        }
        return type_map.get(condition_type, '未知')

    def to_dict(self, achievement: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': achievement.get('id'),
            'name': achievement.get('name'),
            'description': achievement.get('description'),
            'condition_type': achievement.get('condition_type'),
            'condition_type_text': self.get_condition_type_text(achievement.get('condition_type')),
            'condition_value': achievement.get('condition_value'),
            'icon': achievement.get('icon'),
            'badge_color': achievement.get('badge_color'),
            'sort_order': achievement.get('sort_order'),
            'status': achievement.get('status'),
            'created_at': achievement.get('created_at')
        }
