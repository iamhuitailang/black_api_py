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
                user_id INTEGER NOT NULL DEFAULT 0,
                recipe_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
                UNIQUE(user_id, recipe_id)
            )
        """
        db.execute(sql)

        try:
            index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_recipe_id ON {cls.TABLE_NAME}(recipe_id)"
            db.execute(index_sql)
        except Exception:
            pass
        try:
            index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
            db.execute(index_sql2)
        except Exception:
            pass

    def add(self, user_id: int, recipe_id: int) -> int:
        existing = self.query.find_one({'user_id': user_id, 'recipe_id': recipe_id})
        if existing:
            return existing['id']
        now = datetime.now().isoformat()
        return self.exec.insert({'user_id': user_id, 'recipe_id': recipe_id, 'created_at': now})

    def remove(self, user_id: int, recipe_id: int) -> int:
        return self.exec.delete({'user_id': user_id, 'recipe_id': recipe_id})

    def is_favorited(self, user_id: int, recipe_id: int) -> bool:
        return self.query.exists({'user_id': user_id, 'recipe_id': recipe_id})

    def get_all(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT f.*, r.name, r.difficulty, r.cook_time, r.tags, r.steps
            FROM {self.TABLE_NAME} f
            JOIN recipes r ON f.recipe_id = r.id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC
        """
        records = self.db.fetch_all(sql, (user_id,))
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

    def get_all_recipe_ids(self, user_id: int) -> List[int]:
        rows = self.query.find_all({'user_id': user_id}, fields=['recipe_id'])
        return [r['recipe_id'] for r in rows]

    @classmethod
    def migrate_add_user_id(cls) -> bool:
        db = get_db()
        table_name = cls.TABLE_NAME
        try:
            columns = db.fetch_all(f"PRAGMA table_info({table_name})")
            col_names = [c['name'] for c in columns]
            if 'user_id' in col_names:
                return False

            db.execute(f"ALTER TABLE {table_name} ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1")
            try:
                db.execute(f"CREATE INDEX idx_{table_name}_user_id ON {table_name}(user_id)")
            except Exception:
                pass
            return True
        except Exception:
            return False
