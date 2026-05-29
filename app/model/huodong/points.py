from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class PointsModel:
    TABLE_NAME = 'tb_huodong_model_points'

    TYPE_SIGNUP = 'signup'
    TYPE_CHECKIN = 'checkin'
    TYPE_REVIEW = 'review'
    TYPE_PUBLISH = 'publish'
    TYPE_SHARE = 'share'
    TYPE_REDEEM = 'redeem'

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
                points INTEGER NOT NULL,
                point_type TEXT NOT NULL,
                reference_id INTEGER DEFAULT 0,
                description TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_point_type ON {cls.TABLE_NAME}(point_type)"
        db.execute(index_sql)

    def add(self, user_id: int, points: int, point_type: str, reference_id: int = 0,
            description: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'points': points,
            'point_type': point_type,
            'reference_id': reference_id,
            'description': description,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_total_by_user(self, user_id: int) -> int:
        sql = f"SELECT SUM(points) as total FROM {self.TABLE_NAME} WHERE user_id = ?"
        result = self.db.fetch_one(sql, (user_id,))
        return result['total'] if result and result['total'] else 0

    def to_dict(self, record: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': record.get('id'),
            'user_id': record.get('user_id'),
            'points': record.get('points'),
            'point_type': record.get('point_type'),
            'reference_id': record.get('reference_id'),
            'description': record.get('description'),
            'created_at': record.get('created_at')
        }
