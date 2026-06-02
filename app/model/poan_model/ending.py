from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class EndingModel:
    TABLE_NAME = 'tb_poan_model_ending'

    TRUTH = 'truth'
    PARTIAL = 'partial'
    WRONG = 'wrong'
    HIDDEN = 'hidden'

    ENDING_TYPES = {
        TRUTH: '真相结局',
        PARTIAL: '部分真相结局',
        WRONG: '错误结局',
        HIDDEN: '隐藏结局'
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
                ending_type TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT DEFAULT '',
                condition_desc TEXT DEFAULT '',
                order_num INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_case_id ON {cls.TABLE_NAME}(case_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_ending_type ON {cls.TABLE_NAME}(ending_type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_order_num ON {cls.TABLE_NAME}(order_num)"
        db.execute(index_sql)

    def create(self, case_id: int, ending_type: str, title: str, description: str = '',
               condition_desc: str = '', order_num: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'case_id': case_id,
            'ending_type': ending_type,
            'title': title,
            'description': description,
            'condition_desc': condition_desc,
            'order_num': order_num,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'ending_type', 'title', 'description',
            'condition_desc', 'order_num'
        ]}
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_by_case(self, case_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'case_id': case_id}, order_by='order_num ASC')

    def get_by_type(self, case_id: int, ending_type: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'case_id': case_id, 'ending_type': ending_type}, order_by='order_num ASC')

    def to_dict(self, ending: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': ending.get('id'),
            'case_id': ending.get('case_id'),
            'ending_type': ending.get('ending_type'),
            'ending_type_name': self.ENDING_TYPES.get(ending.get('ending_type'), '未知'),
            'title': ending.get('title'),
            'description': ending.get('description'),
            'condition_desc': ending.get('condition_desc'),
            'order_num': ending.get('order_num'),
            'created_at': ending.get('created_at')
        }
