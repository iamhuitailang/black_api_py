from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CheckinModel:
    TABLE_NAME = 'tb_huodong_model_checkins'

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
                activity_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                checkin_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                location_text TEXT DEFAULT '',
                remark TEXT DEFAULT ''
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_activity_id ON {cls.TABLE_NAME}(activity_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)

    def create(self, activity_id: int, user_id: int, location_text: str = '', remark: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'activity_id': activity_id,
            'user_id': user_id,
            'checkin_time': now,
            'location_text': location_text,
            'remark': remark
        }
        return self.exec.insert(data)

    def get_by_activity_and_user(self, activity_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'activity_id': activity_id, 'user_id': user_id})

    def get_by_activity(self, activity_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        conditions = {'activity_id': activity_id}
        return self.query.paginate(page, page_size, conditions, order_by='checkin_time DESC')

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        return self.query.paginate(page, page_size, conditions, order_by='checkin_time DESC')

    def count_by_activity(self, activity_id: int) -> int:
        return self.query.count({'activity_id': activity_id})

    def to_dict(self, checkin: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': checkin.get('id'),
            'activity_id': checkin.get('activity_id'),
            'user_id': checkin.get('user_id'),
            'checkin_time': checkin.get('checkin_time'),
            'location_text': checkin.get('location_text'),
            'remark': checkin.get('remark')
        }
