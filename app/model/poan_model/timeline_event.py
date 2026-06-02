from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TimelineEventModel:
    TABLE_NAME = 'tb_poan_model_timeline_event'

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
                event_name TEXT NOT NULL,
                event_time TEXT DEFAULT '',
                description TEXT DEFAULT '',
                order_num INTEGER DEFAULT 0,
                is_hidden INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_case_id ON {cls.TABLE_NAME}(case_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_order_num ON {cls.TABLE_NAME}(order_num)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_hidden ON {cls.TABLE_NAME}(is_hidden)"
        db.execute(index_sql)

    def create(self, case_id: int, event_name: str, event_time: str = '',
               description: str = '', order_num: int = 0, is_hidden: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'case_id': case_id,
            'event_name': event_name,
            'event_time': event_time,
            'description': description,
            'order_num': order_num,
            'is_hidden': is_hidden,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'event_name', 'event_time', 'description',
            'order_num', 'is_hidden'
        ]}
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_by_case(self, case_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'case_id': case_id}, order_by='order_num ASC')

    def get_visible_by_case(self, case_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'case_id': case_id, 'is_hidden': 0}, order_by='order_num ASC')

    def to_dict(self, event: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': event.get('id'),
            'case_id': event.get('case_id'),
            'event_name': event.get('event_name'),
            'event_time': event.get('event_time'),
            'description': event.get('description'),
            'order_num': event.get('order_num'),
            'is_hidden': event.get('is_hidden'),
            'created_at': event.get('created_at')
        }
