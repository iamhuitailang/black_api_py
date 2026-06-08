from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class AchievementModel:
    TABLE_NAME = 'tb_danzhu_model_achievement'

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
                code TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                icon TEXT DEFAULT '',
                type TEXT DEFAULT 'normal',
                condition_json TEXT DEFAULT '{{}}',
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_code ON {cls.TABLE_NAME}(code)"
        db.execute(index_sql)

        cls._seed_default_data()

    @classmethod
    def _seed_default_data(cls):
        db = get_db()
        count = db.fetch_one(f"SELECT COUNT(*) as total FROM {cls.TABLE_NAME}")
        if count and count.get('total', 0) > 0:
            return

        now = datetime.now().isoformat()
        achievements = [
            {
                'code': 'first_launch',
                'name': '初次发射',
                'description': '首次发射弹珠',
                'icon': '🎯',
                'type': 'normal',
                'condition_json': '{"type":"launch","value":1}',
                'sort_order': 1,
                'created_at': now,
            },
            {
                'code': 'score_1000',
                'name': '初露锋芒',
                'description': '单局得分达到1000分',
                'icon': '⭐',
                'type': 'score',
                'condition_json': '{"type":"score","value":1000}',
                'sort_order': 2,
                'created_at': now,
            },
            {
                'code': 'score_5000',
                'name': '弹珠高手',
                'description': '单局得分达到5000分',
                'icon': '🌟',
                'type': 'score',
                'condition_json': '{"type":"score","value":5000}',
                'sort_order': 3,
                'created_at': now,
            },
            {
                'code': 'combo_5',
                'name': '连击新星',
                'description': '达成5连击',
                'icon': '🔥',
                'type': 'combo',
                'condition_json': '{"type":"combo","value":5}',
                'sort_order': 4,
                'created_at': now,
            },
            {
                'code': 'combo_10',
                'name': '连击大师',
                'description': '达成10连击',
                'icon': '💥',
                'type': 'combo',
                'condition_json': '{"type":"combo","value":10}',
                'sort_order': 5,
                'created_at': now,
            },
            {
                'code': 'all_gadget_types',
                'name': '机关探索者',
                'description': '一局内触发所有类型的机关',
                'icon': '🎡',
                'type': 'gadget',
                'condition_json': '{"type":"all_gadgets"}',
                'sort_order': 6,
                'created_at': now,
            },
            {
                'code': 'all_levels',
                'name': '全图通关',
                'description': '体验所有关卡',
                'icon': '🗺️',
                'type': 'level',
                'condition_json': '{"type":"all_levels"}',
                'sort_order': 7,
                'created_at': now,
            },
            {
                'code': 'launch_100',
                'name': '百发百中',
                'description': '累计发射100颗弹珠',
                'icon': '🎱',
                'type': 'launch',
                'condition_json': '{"type":"launch_total","value":100}',
                'sort_order': 8,
                'created_at': now,
            },
        ]

        for ach in achievements:
            keys = ', '.join(ach.keys())
            placeholders = ', '.join(['?' for _ in ach])
            values = tuple(ach.values())
            db.execute(
                f"INSERT INTO {cls.TABLE_NAME} ({keys}) VALUES ({placeholders})",
                values
            )

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='sort_order ASC, id ASC')

    def get_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'code': code})

    def get_by_id(self, achievement_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(achievement_id)

    def count(self) -> int:
        return self.query.count()
