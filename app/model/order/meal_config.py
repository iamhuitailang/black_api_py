from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class MealConfigModel:
    TABLE_NAME = 'tb_order_meal_config'

    TYPE_BREAKFAST = 'breakfast'
    TYPE_LUNCH = 'lunch'
    TYPE_DINNER = 'dinner'

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
                meal_type TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                order_deadline_minutes INTEGER DEFAULT 30,
                is_active INTEGER DEFAULT 1
            )
        """
        db.execute(sql)

    @classmethod
    def init_default_configs(cls):
        model = cls()
        configs = model.get_all()
        if configs.get('total', 0) == 0:
            default_configs = [
                {'meal_type': 'breakfast', 'name': '早餐', 'start_time': '07:00', 'end_time': '09:00', 'order_deadline_minutes': 30},
                {'meal_type': 'lunch', 'name': '午餐', 'start_time': '11:30', 'end_time': '13:30', 'order_deadline_minutes': 30},
                {'meal_type': 'dinner', 'name': '晚餐', 'start_time': '17:30', 'end_time': '19:30', 'order_deadline_minutes': 30}
            ]
            for config in default_configs:
                model.create(**config)
            print("  - Created default meal configs")

    def create(self, meal_type: str, name: str, start_time: str, end_time: str,
               order_deadline_minutes: int = 30, is_active: int = 1) -> int:
        data = {
            'meal_type': meal_type,
            'name': name,
            'start_time': start_time,
            'end_time': end_time,
            'order_deadline_minutes': order_deadline_minutes,
            'is_active': is_active
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_type(self, meal_type: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'meal_type': meal_type})

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'meal_type', 'name', 'start_time', 'end_time',
            'order_deadline_minutes', 'is_active'
        ]}
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, is_active: int = None) -> Dict[str, Any]:
        conditions = {}
        if is_active is not None:
            conditions['is_active'] = is_active
        return self.query.paginate(page, page_size, conditions, order_by='id ASC')

    def get_active_list(self) -> List[Dict[str, Any]]:
        return self.query.find_all({'is_active': 1}, order_by='id ASC')