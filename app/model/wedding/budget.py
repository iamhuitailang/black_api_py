from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


CATEGORIES = ['场地', '餐饮', '摄影', '布置', '其他']


class BudgetItemModel:
    TABLE_NAME = 'budget_items'

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
                category TEXT NOT NULL,
                item_name TEXT NOT NULL,
                estimated_cost REAL DEFAULT 0,
                actual_cost REAL DEFAULT 0,
                paid INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category ON {cls.TABLE_NAME}(category)"
        db.execute(index_sql)

        sample_data = db.fetch_one(f"SELECT COUNT(*) as total FROM {cls.TABLE_NAME}")
        if sample_data and sample_data['total'] == 0:
            now = datetime.now().isoformat()
            samples = [
                ('场地', '婚礼酒店场地租赁', 50000, 48000, 1),
                ('餐饮', '婚宴酒席（20桌）', 60000, 58000, 0),
                ('摄影', '婚礼跟拍+摄像', 15000, 15000, 1),
                ('布置', '婚礼现场花艺布置', 20000, 22000, 0),
                ('其他', '喜糖请柬伴手礼', 8000, 7500, 1),
                ('其他', '新郎新娘服装', 12000, 13500, 1),
            ]
            for cat, name, est, act, paid in samples:
                db.execute(
                    f"INSERT INTO {cls.TABLE_NAME} (category, item_name, estimated_cost, actual_cost, paid, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (cat, name, est, act, paid, now, now)
                )

    def create(self, category: str, item_name: str, estimated_cost: float = 0,
               actual_cost: float = 0, paid: int = 0) -> int:
        if category not in CATEGORIES:
            raise ValueError(f"类别必须是以下之一: {CATEGORIES}")
        now = datetime.now().isoformat()
        data = {
            'category': category,
            'item_name': item_name,
            'estimated_cost': estimated_cost,
            'actual_cost': actual_cost,
            'paid': paid,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self, category: str = None) -> List[Dict[str, Any]]:
        conditions = {}
        if category:
            conditions['category'] = category
        return self.query.find_all(conditions=conditions if conditions else None, order_by='id DESC')

    def update(self, record_id: int, **kwargs) -> int:
        if 'category' in kwargs and kwargs['category'] not in CATEGORIES:
            raise ValueError(f"类别必须是以下之一: {CATEGORIES}")
        now = datetime.now().isoformat()
        data = {k: v for k, v in kwargs.items() if v is not None}
        data['updated_at'] = now
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_summary(self) -> Dict[str, Any]:
        rows = self.db.fetch_all(
            f"SELECT category, SUM(estimated_cost) as est, SUM(actual_cost) as act FROM {self.TABLE_NAME} GROUP BY category"
        )
        total_estimated = 0
        total_actual = 0
        by_category = {}
        for cat in CATEGORIES:
            by_category[cat] = {'estimated_cost': 0, 'actual_cost': 0, 'over_budget': False}
        for r in rows:
            cat = r['category']
            if cat in by_category:
                est = r['est'] or 0
                act = r['act'] or 0
                by_category[cat]['estimated_cost'] = est
                by_category[cat]['actual_cost'] = act
                by_category[cat]['over_budget'] = act > est > 0
                total_estimated += est
                total_actual += act
        return {
            'categories': by_category,
            'total_estimated': total_estimated,
            'total_actual': total_actual,
            'over_budget': total_actual > total_estimated > 0
        }
