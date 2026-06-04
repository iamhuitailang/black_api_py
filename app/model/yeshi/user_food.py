from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class UserFoodModel:
    TABLE_NAME = 'tb_yeshi_model_user_food'
    
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
                game_user_id INTEGER NOT NULL,
                food_id INTEGER NOT NULL,
                food_name TEXT NOT NULL,
                proficiency INTEGER DEFAULT 0,
                cook_count INTEGER DEFAULT 0,
                success_count INTEGER DEFAULT 0,
                is_unlocked INTEGER DEFAULT 0,
                unlocked_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(game_user_id, food_id)
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(game_user_id)"
        db.execute(index_sql)

    def create(self, game_user_id: int, food_id: int, food_name: str, is_unlocked: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'game_user_id': game_user_id,
            'food_id': food_id,
            'food_name': food_name,
            'proficiency': 0,
            'cook_count': 0,
            'success_count': 0,
            'is_unlocked': is_unlocked,
            'unlocked_at': now if is_unlocked else None,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_user_and_food(self, game_user_id: int, food_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({
            'game_user_id': game_user_id,
            'food_id': food_id
        })

    def get_by_user_id(self, game_user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'game_user_id': game_user_id}, order_by='id ASC')

    def get_unlocked_by_user_id(self, game_user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({
            'game_user_id': game_user_id,
            'is_unlocked': 1
        }, order_by='id ASC')

    def get_unlocked_foods_with_details(self, game_user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT f.*, uf.proficiency, uf.cook_count, uf.success_count
            FROM {self.TABLE_NAME} uf
            JOIN tb_yeshi_model_food f ON uf.food_id = f.id
            WHERE uf.game_user_id = ? AND uf.is_unlocked = 1
            ORDER BY f.category ASC, f.id ASC
        """
        return self.db.fetch_all(sql, (game_user_id,))

    def unlock_food(self, game_user_id: int, food_id: int) -> int:
        now = datetime.now().isoformat()
        existing = self.get_by_user_and_food(game_user_id, food_id)
        if existing:
            data = {
                'is_unlocked': 1,
                'unlocked_at': now,
                'updated_at': now
            }
            return self.exec.update_by_id(existing['id'], data)
        else:
            from app.model.yeshi.food import FoodModel
            food_model = FoodModel()
            food = food_model.get_by_id(food_id)
            if food:
                return self.create(game_user_id, food_id, food['name'], 1)
        return 0

    def add_cook_count(self, user_food_id: int, success: bool = True) -> Dict[str, Any]:
        record = self.query.find_by_id(user_food_id)
        if not record:
            return {}
        
        now = datetime.now().isoformat()
        new_cook_count = record.get('cook_count', 0) + 1
        new_success_count = record.get('success_count', 0) + (1 if success else 0)
        new_proficiency = min(100, record.get('proficiency', 0) + (2 if success else 1))
        
        data = {
            'cook_count': new_cook_count,
            'success_count': new_success_count,
            'proficiency': new_proficiency,
            'updated_at': now
        }
        self.exec.update_by_id(user_food_id, data)
        
        return {
            'cook_count': new_cook_count,
            'success_count': new_success_count,
            'proficiency': new_proficiency
        }

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['updated_at'] = now
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
