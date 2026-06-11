from datetime import datetime
from typing import Dict, Any, List, Optional
import json
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
from .ingredient import IngredientModel


class RecipeModel:
    TABLE_NAME = 'recipes'

    def __init__(self):
        self.db = get_db()
        self.query = ORMQuery(self.TABLE_NAME)
        self.exec = ORMExec(self.TABLE_NAME)
        self.ingredient_model = IngredientModel()

    @classmethod
    def create_table(cls):
        db = get_db()
        sql = f"""
            CREATE TABLE IF NOT EXISTS {cls.TABLE_NAME} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                difficulty TEXT NOT NULL DEFAULT '简单',
                cook_time INTEGER NOT NULL DEFAULT 0,
                tags TEXT DEFAULT '[]',
                steps TEXT DEFAULT '[]',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_name ON {cls.TABLE_NAME}(name)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_difficulty ON {cls.TABLE_NAME}(difficulty)"
        db.execute(index_sql2)

    def create(self, name: str, difficulty: str, cook_time: int,
               tags: List[str], steps: List[str],
               ingredients: List[Dict[str, str]]) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'difficulty': difficulty,
            'cook_time': cook_time,
            'tags': json.dumps(tags, ensure_ascii=False),
            'steps': json.dumps(steps, ensure_ascii=False),
            'created_at': now,
            'updated_at': now
        }
        recipe_id = self.exec.insert(data)

        if ingredients:
            ing_data_list = [
                {'recipe_id': recipe_id, 'name': ing['name'], 'amount': ing.get('amount', '')}
                for ing in ingredients
            ]
            self.ingredient_model.exec.insert_many(ing_data_list)

        return recipe_id

    def update(self, record_id: int, name: str, difficulty: str, cook_time: int,
               tags: List[str], steps: List[str],
               ingredients: List[Dict[str, str]]) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'difficulty': difficulty,
            'cook_time': cook_time,
            'tags': json.dumps(tags, ensure_ascii=False),
            'steps': json.dumps(steps, ensure_ascii=False),
            'updated_at': now
        }
        affected = self.exec.update_by_id(record_id, data)

        self.ingredient_model.exec.delete({'recipe_id': record_id})
        if ingredients:
            ing_data_list = [
                {'recipe_id': record_id, 'name': ing['name'], 'amount': ing.get('amount', '')}
                for ing in ingredients
            ]
            self.ingredient_model.exec.insert_many(ing_data_list)

        return affected

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        record = self.query.find_by_id(record_id)
        if record:
            return self._parse_record(record)
        return None

    def _parse_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        try:
            record['tags'] = json.loads(record['tags']) if record.get('tags') else []
        except (json.JSONDecodeError, TypeError):
            record['tags'] = []
        try:
            record['steps'] = json.loads(record['steps']) if record.get('steps') else []
        except (json.JSONDecodeError, TypeError):
            record['steps'] = []
        return record

    def get_all(self, difficulty: str = None, tag: str = None,
                keyword: str = None, limit: int = 100) -> List[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE 1=1"
        params = []

        if difficulty:
            sql += " AND difficulty = ?"
            params.append(difficulty)

        if tag:
            sql += " AND tags LIKE ?"
            params.append(f'%{tag}%')

        if keyword:
            sql += " AND name LIKE ?"
            params.append(f'%{keyword}%')

        sql += " ORDER BY id DESC"
        if limit:
            sql += f" LIMIT {limit}"

        records = self.db.fetch_all(sql, tuple(params) if params else None)
        return [self._parse_record(r) for r in records]

    def delete(self, record_id: int) -> int:
        self.ingredient_model.exec.delete({'recipe_id': record_id})
        return self.exec.delete_by_id(record_id)

    def get_with_ingredients(self, record_id: int) -> Optional[Dict[str, Any]]:
        recipe = self.get_by_id(record_id)
        if recipe:
            recipe['ingredients'] = self.ingredient_model.get_by_recipe_id(record_id)
        return recipe

    def search_by_ingredients(self, ingredient_names: List[str]) -> List[Dict[str, Any]]:
        if not ingredient_names:
            return []

        placeholders = ','.join(['?' for _ in ingredient_names])
        sql = f"""
            SELECT 
                r.id,
                r.name,
                r.difficulty,
                r.cook_time,
                r.tags,
                r.steps,
                r.created_at,
                r.updated_at,
                COUNT(DISTINCT i.id) as matched_count,
                (SELECT COUNT(*) FROM ingredients WHERE recipe_id = r.id) as total_count
            FROM {self.TABLE_NAME} r
            LEFT JOIN ingredients i ON r.id = i.recipe_id AND i.name IN ({placeholders})
            WHERE r.id IN (
                SELECT DISTINCT recipe_id FROM ingredients WHERE name IN ({placeholders})
            )
            GROUP BY r.id
            ORDER BY matched_count DESC, total_count ASC
        """
        all_params = ingredient_names + ingredient_names
        records = self.db.fetch_all(sql, tuple(all_params))
        results = []
        for r in records:
            parsed = self._parse_record(dict(r))
            matched = r.get('matched_count', 0)
            total = r.get('total_count', 1)
            parsed['match_count'] = matched
            parsed['total_ingredients'] = total
            parsed['match_percentage'] = round((matched / total * 100), 1) if total > 0 else 0
            results.append(parsed)
        return results

    def count(self) -> int:
        return self.query.count()
