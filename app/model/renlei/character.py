from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CharacterModel:
    TABLE_NAME = 'tb_renlei_model_character'
    
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
                description TEXT,
                color TEXT DEFAULT '#FFB6C1',
                head_color TEXT DEFAULT '#FFE4E1',
                body_color TEXT DEFAULT '#FFB6C1',
                unlock_condition TEXT,
                is_default INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        cls.init_default_characters(db)

    @classmethod
    def init_default_characters(cls, db):
        existing = db.fetch_one(f"SELECT COUNT(*) as count FROM {cls.TABLE_NAME}")
        if existing and existing['count'] > 0:
            return

        default_characters = [
            ('粉色布偶', '可爱的粉色布偶小人，软绵绵的很萌', '#FFB6C1', '#FFE4E1', '#FFB6C1', None, 1),
            ('蓝色精灵', '活泼的蓝色布偶，跳跃力超强', '#87CEEB', '#E0F7FF', '#87CEEB', None, 1),
            ('绿色萌宠', '清新的绿色布偶，平衡力极佳', '#90EE90', '#F0FFF0', '#90EE90', None, 1),
            ('橙色小丑', '搞怪的橙色布偶，自带滑稽属性', '#FFA500', '#FFEFD5', '#FFA500', None, 1)
        ]

        now = datetime.now().isoformat()
        for char in default_characters:
            db.execute(
                f"INSERT INTO {cls.TABLE_NAME} (name, description, color, head_color, body_color, unlock_condition, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                char + (now,)
            )

    def create(self, name: str, description: str = None, color: str = '#FFB6C1',
               head_color: str = '#FFE4E1', body_color: str = '#FFB6C1',
               unlock_condition: str = None, is_default: bool = False) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'color': color,
            'head_color': head_color,
            'body_color': body_color,
            'unlock_condition': unlock_condition,
            'is_default': 1 if is_default else 0,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id ASC')

    def get_default_characters(self) -> List[Dict[str, Any]]:
        return self.query.find_all({'is_default': 1}, order_by='id ASC')

    def update(self, record_id: int, **kwargs) -> int:
        return self.exec.update_by_id(record_id, kwargs)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()
