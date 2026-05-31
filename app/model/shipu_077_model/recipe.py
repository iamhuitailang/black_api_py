from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class RecipeModel:
    TABLE_NAME = 'tb_shipu_077_model_recipes'

    STATUS_PENDING = 0
    STATUS_APPROVED = 1
    STATUS_REJECTED = 2

    DIFFICULTY_EASY = 'easy'
    DIFFICULTY_MEDIUM = 'medium'
    DIFFICULTY_HARD = 'hard'

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
                category_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                cover_image TEXT DEFAULT '',
                description TEXT DEFAULT '',
                ingredients TEXT DEFAULT '',
                steps TEXT DEFAULT '',
                tips TEXT DEFAULT '',
                cook_time INTEGER DEFAULT 0,
                servings INTEGER DEFAULT 1,
                difficulty TEXT DEFAULT 'easy',
                status INTEGER DEFAULT 0,
                view_count INTEGER DEFAULT 0,
                favorite_count INTEGER DEFAULT 0,
                comment_count INTEGER DEFAULT 0,
                is_deleted INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category_id ON {cls.TABLE_NAME}(category_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_deleted ON {cls.TABLE_NAME}(is_deleted)"
        db.execute(index_sql)

    def create(self, user_id: int, category_id: int, title: str,
               cover_image: str = '', description: str = '',
               ingredients: List = None, steps: List = None, tips: str = '',
               cook_time: int = 0, servings: int = 1, difficulty: str = DIFFICULTY_EASY) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'category_id': category_id,
            'title': title,
            'cover_image': cover_image,
            'description': description,
            'ingredients': json.dumps(ingredients or [], ensure_ascii=False),
            'steps': json.dumps(steps or [], ensure_ascii=False),
            'tips': tips,
            'cook_time': cook_time,
            'servings': servings,
            'difficulty': difficulty,
            'status': self.STATUS_PENDING,
            'view_count': 0,
            'favorite_count': 0,
            'comment_count': 0,
            'is_deleted': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        result = self.query.find_by_id(record_id)
        if result and result.get('is_deleted') == 0:
            return result
        return None

    def increment_view_count(self, recipe_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET view_count = view_count + 1 WHERE id = ?"
        cursor = self.db.execute(sql, (recipe_id,))
        return cursor.rowcount

    def increment_favorite_count(self, recipe_id: int, delta: int = 1) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET favorite_count = favorite_count + ? WHERE id = ?"
        cursor = self.db.execute(sql, (delta, recipe_id))
        return cursor.rowcount

    def increment_comment_count(self, recipe_id: int, delta: int = 1) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET comment_count = comment_count + ? WHERE id = ?"
        cursor = self.db.execute(sql, (delta, recipe_id))
        return cursor.rowcount

    def update_status(self, recipe_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(recipe_id, data)

    def update(self, recipe_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'category_id', 'title', 'cover_image', 'description',
            'ingredients', 'steps', 'tips', 'cook_time', 'servings', 'difficulty'
        ]}
        if 'ingredients' in update_data and isinstance(update_data['ingredients'], list):
            update_data['ingredients'] = json.dumps(update_data['ingredients'], ensure_ascii=False)
        if 'steps' in update_data and isinstance(update_data['steps'], list):
            update_data['steps'] = json.dumps(update_data['steps'], ensure_ascii=False)
        update_data['updated_at'] = now
        return self.exec.update_by_id(recipe_id, update_data)

    def delete(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'is_deleted': 1,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10,
                    status: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id, 'is_deleted': 0}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_list(self, page: int = 1, page_size: int = 10,
                 category_id: int = None, status: int = None,
                 keyword: str = None, difficulty: str = None,
                 order_by: str = 'created_at DESC') -> Dict[str, Any]:
        conditions = {'is_deleted': 0}
        if category_id:
            conditions['category_id'] = category_id
        if status is not None:
            conditions['status'] = status
        if difficulty:
            conditions['difficulty'] = difficulty

        if keyword:
            return self.search(keyword, page, page_size, category_id, status, difficulty, order_by)

        return self.query.paginate(page, page_size, conditions, order_by=order_by)

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               category_id: int = None, status: int = None,
               difficulty: str = None, order_by: str = 'created_at DESC') -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["is_deleted = 0"]
        params = []

        if category_id:
            where_clauses.append("category_id = ?")
            params.append(category_id)

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        if difficulty:
            where_clauses.append("difficulty = ?")
            params.append(difficulty)

        where_clauses.append("(title LIKE ? OR description LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern])

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY {order_by}
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, tuple(params))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_PENDING: '待审核',
            self.STATUS_APPROVED: '已通过',
            self.STATUS_REJECTED: '已拒绝'
        }
        return status_map.get(status, '未知')

    def get_difficulty_text(self, difficulty: str) -> str:
        difficulty_map = {
            self.DIFFICULTY_EASY: '简单',
            self.DIFFICULTY_MEDIUM: '中等',
            self.DIFFICULTY_HARD: '困难'
        }
        return difficulty_map.get(difficulty, '未知')

    def to_dict(self, recipe: Dict[str, Any]) -> Dict[str, Any]:
        ingredients = recipe.get('ingredients', '[]')
        steps = recipe.get('steps', '[]')
        try:
            ingredients = json.loads(ingredients) if ingredients else []
        except (json.JSONDecodeError, TypeError):
            ingredients = []
        try:
            steps = json.loads(steps) if steps else []
        except (json.JSONDecodeError, TypeError):
            steps = []

        return {
            'id': recipe.get('id'),
            'user_id': recipe.get('user_id'),
            'category_id': recipe.get('category_id'),
            'title': recipe.get('title'),
            'cover_image': recipe.get('cover_image'),
            'description': recipe.get('description'),
            'ingredients': ingredients,
            'steps': steps,
            'tips': recipe.get('tips'),
            'cook_time': recipe.get('cook_time'),
            'servings': recipe.get('servings'),
            'difficulty': recipe.get('difficulty'),
            'difficulty_text': self.get_difficulty_text(recipe.get('difficulty')),
            'status': recipe.get('status'),
            'status_text': self.get_status_text(recipe.get('status')),
            'view_count': recipe.get('view_count'),
            'favorite_count': recipe.get('favorite_count'),
            'comment_count': recipe.get('comment_count'),
            'created_at': recipe.get('created_at'),
            'updated_at': recipe.get('updated_at')
        }

    def get_statistics(self) -> Dict[str, Any]:
        sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE is_deleted = 0"
        total_result = self.db.fetch_one(sql)
        total = total_result['total'] if total_result else 0

        sql = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME} WHERE is_deleted = 0 AND status = ?"
        pending_result = self.db.fetch_one(sql, (self.STATUS_PENDING,))
        pending = pending_result['count'] if pending_result else 0

        approved_result = self.db.fetch_one(sql, (self.STATUS_APPROVED,))
        approved = approved_result['count'] if approved_result else 0

        sql = f"SELECT category_id, COUNT(*) as count FROM {self.TABLE_NAME} WHERE is_deleted = 0 GROUP BY category_id"
        category_stats = self.db.fetch_all(sql)

        return {
            'total': total,
            'pending': pending,
            'approved': approved,
            'category_stats': category_stats
        }
