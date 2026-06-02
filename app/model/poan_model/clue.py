from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ClueModel:
    TABLE_NAME = 'tb_poan_model_clue'

    PHYSICAL = 'physical'
    DOCUMENT = 'document'
    TESTIMONY = 'testimony'
    OTHER = 'other'

    TYPES = {
        PHYSICAL: '物证',
        DOCUMENT: '书证',
        TESTIMONY: '证言',
        OTHER: '其他'
    }

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
                description TEXT DEFAULT '',
                location TEXT DEFAULT '',
                type TEXT NOT NULL,
                content TEXT DEFAULT '',
                is_critical INTEGER DEFAULT 0,
                image TEXT DEFAULT '',
                order_num INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_case_id ON {cls.TABLE_NAME}(case_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_critical ON {cls.TABLE_NAME}(is_critical)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_order_num ON {cls.TABLE_NAME}(order_num)"
        db.execute(index_sql)

    def create(self, case_id: int, name: str, type: str, description: str = '',
               location: str = '', content: str = '', is_critical: int = 0,
               image: str = '', order_num: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'case_id': case_id,
            'name': name,
            'description': description,
            'location': location,
            'type': type,
            'content': content,
            'is_critical': is_critical,
            'image': image,
            'order_num': order_num,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'location', 'type', 'content',
            'is_critical', 'image', 'order_num'
        ]}
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_by_case(self, case_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'case_id': case_id}, order_by='order_num ASC')

    def get_by_type(self, case_id: int, clue_type: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'case_id': case_id, 'type': clue_type}, order_by='order_num ASC')

    def to_dict(self, clue: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': clue.get('id'),
            'case_id': clue.get('case_id'),
            'name': clue.get('name'),
            'description': clue.get('description'),
            'location': clue.get('location'),
            'type': clue.get('type'),
            'type_name': self.TYPES.get(clue.get('type'), '其他'),
            'content': clue.get('content'),
            'is_critical': clue.get('is_critical'),
            'image': clue.get('image'),
            'order_num': clue.get('order_num'),
            'created_at': clue.get('created_at')
        }
