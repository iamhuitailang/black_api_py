from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class IngredientListModel:
    TABLE_NAME = 'tb_shipu_077_model_ingredient_lists'

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
                user_id INTEGER NOT NULL,
                recipe_id INTEGER DEFAULT 0,
                name TEXT DEFAULT '',
                ingredients TEXT DEFAULT '',
                is_completed INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_recipe_id ON {cls.TABLE_NAME}(recipe_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_completed ON {cls.TABLE_NAME}(is_completed)"
        db.execute(index_sql)

    def create(self, user_id: int, recipe_id: int = 0, name: str = '', ingredients: List = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'recipe_id': recipe_id,
            'name': name,
            'ingredients': json.dumps(ingredients or [], ensure_ascii=False),
            'is_completed': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, list_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'ingredients', 'is_completed'
        ]}
        if 'ingredients' in update_data and isinstance(update_data['ingredients'], list):
            update_data['ingredients'] = json.dumps(update_data['ingredients'], ensure_ascii=False)
        update_data['updated_at'] = now
        return self.exec.update_by_id(list_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10,
                    is_completed: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if is_completed is not None:
            conditions['is_completed'] = is_completed
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def to_dict(self, ingredient_list: Dict[str, Any]) -> Dict[str, Any]:
        ingredients = ingredient_list.get('ingredients', '[]')
        try:
            ingredients = json.loads(ingredients) if ingredients else []
        except (json.JSONDecodeError, TypeError):
            ingredients = []

        return {
            'id': ingredient_list.get('id'),
            'user_id': ingredient_list.get('user_id'),
            'recipe_id': ingredient_list.get('recipe_id'),
            'name': ingredient_list.get('name'),
            'ingredients': ingredients,
            'is_completed': ingredient_list.get('is_completed'),
            'created_at': ingredient_list.get('created_at'),
            'updated_at': ingredient_list.get('updated_at')
        }
