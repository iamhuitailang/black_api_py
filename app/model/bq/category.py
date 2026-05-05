from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class BqCategoryModel:
    TABLE_NAME = 'tb_bq_categories'

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
                name TEXT NOT NULL,
                color TEXT DEFAULT '#FFF9C4',
                sort INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_sort ON {cls.TABLE_NAME}(sort)"
        db.execute(index_sql)

    @classmethod
    def init_default_categories(cls):
        from app.model.bq.note import BqNoteModel
        default_categories = BqNoteModel.CATEGORIES
        for cat in default_categories:
            existing = ORMQuery(cls.TABLE_NAME).find_one({'name': cat['name'], 'user_id': 0})
            if not existing:
                ORMExec(cls.TABLE_NAME).insert({
                    'user_id': 0,
                    'name': cat['name'],
                    'color': '#FFF9C4',
                    'sort': 0,
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat()
                })

    def create(self, user_id: int, name: str, color: str = '#FFF9C4', sort: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'name': name,
            'color': color,
            'sort': sort,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_id_and_user(self, record_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'id': record_id, 'user_id': user_id})

    def get_by_name_and_user(self, name: str, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'name': name, 'user_id': user_id})

    def update(self, category_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'color', 'sort'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(category_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_user_categories(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(
            {'user_id': user_id},
            order_by='sort ASC, id ASC'
        )

    def get_all_with_default(self, user_id: int) -> List[Dict[str, Any]]:
        from app.model.bq.note import BqNoteModel
        
        default_cats = [
            {'id': 0, 'user_id': 0, 'name': cat['name'], 'code': cat['code'], 'color': '#FFF9C4', 'sort': 0, 'is_default': True}
            for cat in BqNoteModel.CATEGORIES
        ]
        
        user_cats = self.get_user_categories(user_id)
        user_cats_with_flag = [
            {**cat, 'is_default': False}
            for cat in user_cats
        ]
        
        return default_cats + user_cats_with_flag

    def to_dict(self, category: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': category.get('id'),
            'user_id': category.get('user_id'),
            'name': category.get('name'),
            'color': category.get('color', '#FFF9C4'),
            'sort': category.get('sort', 0),
            'created_at': category.get('created_at'),
            'updated_at': category.get('updated_at')
        }
