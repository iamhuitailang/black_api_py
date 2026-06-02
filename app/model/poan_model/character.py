from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CharacterModel:
    TABLE_NAME = 'tb_poan_model_character'

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
                case_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                title TEXT DEFAULT '',
                description TEXT DEFAULT '',
                personality TEXT DEFAULT '',
                dialogue_style TEXT DEFAULT '',
                avatar TEXT DEFAULT '',
                order_num INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_case_id ON {cls.TABLE_NAME}(case_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_order_num ON {cls.TABLE_NAME}(order_num)"
        db.execute(index_sql)

    def create(self, case_id: int, name: str, title: str = '', description: str = '',
               personality: str = '', dialogue_style: str = '', avatar: str = '',
               order_num: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'case_id': case_id,
            'name': name,
            'title': title,
            'description': description,
            'personality': personality,
            'dialogue_style': dialogue_style,
            'avatar': avatar,
            'order_num': order_num,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'title', 'description', 'personality',
            'dialogue_style', 'avatar', 'order_num'
        ]}
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_by_case(self, case_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'case_id': case_id}, order_by='order_num ASC')

    def to_dict(self, character: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': character.get('id'),
            'case_id': character.get('case_id'),
            'name': character.get('name'),
            'title': character.get('title'),
            'description': character.get('description'),
            'personality': character.get('personality'),
            'dialogue_style': character.get('dialogue_style'),
            'avatar': character.get('avatar'),
            'order_num': character.get('order_num'),
            'created_at': character.get('created_at')
        }
