from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class FavoriteModel:
    TABLE_NAME = 'tb_shipu_077_model_favorites'

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
                recipe_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_recipe_id ON {cls.TABLE_NAME}(recipe_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_recipe ON {cls.TABLE_NAME}(user_id, recipe_id)"
        db.execute(index_sql)

    def create(self, user_id: int, recipe_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'recipe_id': recipe_id,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_and_recipe(self, user_id: int, recipe_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'recipe_id': recipe_id})

    def delete(self, user_id: int, recipe_id: int) -> int:
        return self.exec.delete(conditions={'user_id': user_id, 'recipe_id': recipe_id})

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE user_id = ?"
        total_result = self.db.fetch_one(count_sql, (user_id,))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT f.*, r.title, r.cover_image, r.description, r.difficulty
            FROM {self.TABLE_NAME} f
            LEFT JOIN tb_shipu_077_model_recipes r ON f.recipe_id = r.id
            WHERE f.user_id = ? AND r.is_deleted = 0
            ORDER BY f.created_at DESC
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, (user_id,))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def is_favorited(self, user_id: int, recipe_id: int) -> bool:
        result = self.get_by_user_and_recipe(user_id, recipe_id)
        return result is not None

    def get_favorite_count(self, recipe_id: int) -> int:
        sql = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME} WHERE recipe_id = ?"
        result = self.db.fetch_one(sql, (recipe_id,))
        return result['count'] if result else 0
