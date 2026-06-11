from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class IngredientModel:
    TABLE_NAME = 'ingredients'

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
                recipe_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                amount TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_recipe_id ON {cls.TABLE_NAME}(recipe_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_name ON {cls.TABLE_NAME}(name)"
        db.execute(index_sql2)

    def get_by_recipe_id(self, recipe_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'recipe_id': recipe_id}, order_by='id ASC')

    def get_all_names(self) -> List[str]:
        sql = f"SELECT DISTINCT name FROM {self.TABLE_NAME} ORDER BY name"
        rows = self.db.fetch_all(sql)
        return [r['name'] for r in rows]

    def generate_shopping_list(self, recipe_ids: List[int]) -> List[Dict[str, Any]]:
        if not recipe_ids:
            return []

        placeholders = ','.join(['?' for _ in recipe_ids])
        sql = f"""
            SELECT name, GROUP_CONCAT(amount, '|||') as amounts,
                   GROUP_CONCAT(recipe_id, '|||') as recipe_ids,
                   COUNT(*) as count
            FROM {self.TABLE_NAME}
            WHERE recipe_id IN ({placeholders})
            GROUP BY name
            ORDER BY name
        """
        rows = self.db.fetch_all(sql, tuple(recipe_ids))
        result = []
        for row in rows:
            amounts = [a for a in (row['amounts'] or '').split('|||') if a]
            r_ids = [int(r) for r in (row['recipe_ids'] or '').split('|||') if r]
            result.append({
                'name': row['name'],
                'amounts': amounts,
                'recipe_ids': r_ids,
                'recipe_count': row['count']
            })
        return result

    def get_missing_ingredients(self, recipe_id: int, available_names: List[str]) -> List[Dict[str, Any]]:
        if not available_names:
            return self.get_by_recipe_id(recipe_id)

        placeholders = ','.join(['?' for _ in available_names])
        sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE recipe_id = ? AND name NOT IN ({placeholders})
            ORDER BY id ASC
        """
        return self.db.fetch_all(sql, tuple([recipe_id] + available_names))
