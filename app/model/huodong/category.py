from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CategoryModel:
    TABLE_NAME = 'tb_huodong_model_categories'

    DEFAULT_CATEGORIES = [
        {'code': 'sports', 'name': '运动健身', 'icon': '🏃', 'sort_order': 1},
        {'code': 'social', 'name': '社交聚会', 'icon': '🤝', 'sort_order': 2},
        {'code': 'charity', 'name': '公益活动', 'icon': '💚', 'sort_order': 3},
        {'code': 'show', 'name': '演出展览', 'icon': '🎭', 'sort_order': 4},
        {'code': 'study', 'name': '学习交流', 'icon': '📚', 'sort_order': 5},
        {'code': 'food', 'name': '美食探店', 'icon': '🍜', 'sort_order': 6},
        {'code': 'travel', 'name': '户外旅行', 'icon': '🏕️', 'sort_order': 7},
        {'code': 'volunteer', 'name': '志愿者', 'icon': '🙌', 'sort_order': 8},
        {'code': 'other', 'name': '其他', 'icon': '📌', 'sort_order': 99},
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
                code TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                icon TEXT DEFAULT '',
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_code ON {cls.TABLE_NAME}(code)"
        db.execute(index_sql)

    @classmethod
    def init_default_categories(cls):
        db = get_db()
        for cat in cls.DEFAULT_CATEGORIES:
            check = db.fetch_one(f"SELECT id FROM {cls.TABLE_NAME} WHERE code = ?", (cat['code'],))
            if not check:
                now = datetime.now().isoformat()
                db.execute(
                    f"INSERT INTO {cls.TABLE_NAME} (code, name, icon, sort_order, created_at) VALUES (?, ?, ?, ?, ?)",
                    (cat['code'], cat['name'], cat['icon'], cat['sort_order'], now)
                )

    def get_all_categories(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='sort_order ASC')

    def get_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'code': code})

    def get_name_by_code(self, code: str) -> str:
        cat = self.get_by_code(code)
        return cat.get('name', '其他') if cat else '其他'

    def get_icon_by_code(self, code: str) -> str:
        cat = self.get_by_code(code)
        return cat.get('icon', '📌') if cat else '📌'
