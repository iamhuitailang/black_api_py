from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class FavoriteModel:
    TABLE_NAME = 'favorites'

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
                recipe_id INTEGER NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_recipe_id ON {cls.TABLE_NAME}(recipe_id)"
        db.execute(index_sql)

    def add(self, recipe_id: int) -> int:
        existing = self.query.find_one({'recipe_id': recipe_id})
        if existing:
            return existing['id']
        now = datetime.now().isoformat()
        return self.exec.insert({'recipe_id': recipe_id, 'created_at': now})

    def remove(self, recipe_id: int) -> int:
        return self.exec.delete({'recipe_id': recipe_id})

    def is_favorited(self, recipe_id: int) -> bool:
        return self.query.exists({'recipe_id': recipe_id})

    def get_all(self) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT f.*, r.name, r.difficulty, r.cook_time, r.tags, r.steps
            FROM {self.TABLE_NAME} f
            JOIN recipes r ON f.recipe_id = r.id
            ORDER BY f.created_at DESC
        """
        records = self.db.fetch_all(sql)
        for r in records:
            try:
                r['tags'] = json.loads(r['tags']) if r.get('tags') else []
            except (json.JSONDecodeError, TypeError):
                r['tags'] = []
            try:
                r['steps'] = json.loads(r['steps']) if r.get('steps') else []
            except (json.JSONDecodeError, TypeError):
                r['steps'] = []
        return records

    def get_all_recipe_ids(self) -> List[int]:
        rows = self.query.find_all(fields=['recipe_id'])
        return [r['recipe_id'] for r in rows]
