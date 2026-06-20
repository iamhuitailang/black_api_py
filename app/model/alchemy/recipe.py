from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class AlchemyRecipeModel:
    TABLE_NAME = 'tb_alchemy_recipe'

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
                name TEXT NOT NULL,
                material_1 TEXT NOT NULL,
                material_2 TEXT NOT NULL,
                ideal_temp INTEGER NOT NULL,
                base_score INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

    @classmethod
    def seed_data(cls):
        db = get_db()
        count_sql = f"SELECT COUNT(*) as total FROM {cls.TABLE_NAME}"
        result = db.fetch_one(count_sql)
        if result and result['total'] > 0:
            return
        recipes = [
            {'name': '青铜剑', 'material_1': '铜锭', 'material_2': '铁锭', 'ideal_temp': 800, 'base_score': 100},
            {'name': '秘银盾', 'material_1': '秘银条', 'material_2': '铁锭', 'ideal_temp': 1200, 'base_score': 200},
            {'name': '烈焰锤', 'material_1': '铜锭', 'material_2': '秘银条', 'ideal_temp': 1000, 'base_score': 250},
            {'name': '玄铁甲', 'material_1': '铁锭', 'material_2': '铁锭', 'ideal_temp': 1100, 'base_score': 150},
            {'name': '星辰冠', 'material_1': '秘银条', 'material_2': '秘银条', 'ideal_temp': 1500, 'base_score': 350},
            {'name': '铜护腕', 'material_1': '铜锭', 'material_2': '铜锭', 'ideal_temp': 500, 'base_score': 80},
        ]
        now = datetime.now().isoformat()
        for recipe in recipes:
            data = {**recipe, 'created_at': now}
            db.execute(
                f"INSERT INTO {cls.TABLE_NAME} (name, material_1, material_2, ideal_temp, base_score, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (data['name'], data['material_1'], data['material_2'], data['ideal_temp'], data['base_score'], data['created_at'])
            )

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='base_score ASC')

    def find_by_materials(self, mat1: str, mat2: str) -> Optional[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE (material_1 = ? AND material_2 = ?) OR (material_1 = ? AND material_2 = ?)"
        return self.db.fetch_one(sql, (mat1, mat2, mat2, mat1))
