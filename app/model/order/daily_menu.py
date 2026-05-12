from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class DailyMenuModel:
    TABLE_NAME = 'tb_order_daily_menu'

    STATUS_VALID = 1
    STATUS_INVALID = 0

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
                menu_date TEXT NOT NULL,
                meal_type TEXT DEFAULT 'lunch',
                dish_id INTEGER NOT NULL,
                price_override DECIMAL(10,2),
                max_quantity INTEGER DEFAULT 10,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_date ON {cls.TABLE_NAME}(menu_date)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_meal_type ON {cls.TABLE_NAME}(meal_type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_dish_id ON {cls.TABLE_NAME}(dish_id)"
        db.execute(index_sql)

    def create(self, menu_date: str, meal_type: str, dish_id: int,
               price_override: float = None, max_quantity: int = 10) -> int:
        now = datetime.now().isoformat()
        data = {
            'menu_date': menu_date,
            'meal_type': meal_type,
            'dish_id': dish_id,
            'price_override': price_override,
            'max_quantity': max_quantity,
            'status': self.STATUS_VALID,
            'created_at': now
        }
        return self.exec.insert(data)

    def batch_create(self, menu_date: str, meal_type: str, dish_list: List[Dict[str, Any]]) -> int:
        now = datetime.now().isoformat()
        data_list = []
        for dish in dish_list:
            data_list.append({
                'menu_date': menu_date,
                'meal_type': meal_type,
                'dish_id': dish['dish_id'],
                'price_override': dish.get('price_override'),
                'max_quantity': dish.get('max_quantity', 10),
                'status': self.STATUS_VALID,
                'created_at': now
            })
        if data_list:
            return self.exec.insert_many(data_list)
        return 0

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'menu_date', 'meal_type', 'dish_id', 'price_override',
            'max_quantity', 'status'
        ]}
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_date_and_type(self, menu_date: str, meal_type: str) -> int:
        return self.exec.delete({
            'menu_date': menu_date,
            'meal_type': meal_type
        })

    def get_by_date_and_type(self, menu_date: str, meal_type: str, status: int = None) -> List[Dict[str, Any]]:
        conditions = {
            'menu_date': menu_date,
            'meal_type': meal_type
        }
        if status is not None:
            conditions['status'] = status
        return self.query.find_all(conditions, order_by='id ASC')

    def get_menu_details(self, menu_date: str, meal_type: str) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT dm.*, d.name, d.price, d.image_url, d.description, c.name as category_name, c.icon
            FROM {self.TABLE_NAME} dm
            LEFT JOIN tb_order_dishes d ON dm.dish_id = d.id
            LEFT JOIN tb_order_categories c ON d.category_id = c.id
            WHERE dm.menu_date = ? AND dm.meal_type = ? AND dm.status = 1
            ORDER BY c.sort_order ASC, d.sort_order ASC
        """
        return self.db.fetch_all(sql, (menu_date, meal_type))

    def get_all(self, page: int = 1, page_size: int = 10, menu_date: str = None,
                meal_type: str = None, status: int = None) -> Dict[str, Any]:
        conditions = {}
        if menu_date:
            conditions['menu_date'] = menu_date
        if meal_type:
            conditions['meal_type'] = meal_type
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')