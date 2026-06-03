from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class SatisfactionModel:
    TABLE_NAME = 'tb_jt_model_satisfaction'

    PERIOD_DAILY = 'daily'
    PERIOD_WEEKLY = 'weekly'
    PERIOD_MONTHLY = 'monthly'

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
                city_id INTEGER NOT NULL,
                overall_score INTEGER DEFAULT 70,
                traffic_score INTEGER DEFAULT 50,
                transit_score INTEGER DEFAULT 50,
                safety_score INTEGER DEFAULT 70,
                environment_score INTEGER DEFAULT 60,
                comment TEXT DEFAULT '',
                period TEXT DEFAULT 'daily',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_city_id ON {cls.TABLE_NAME}(city_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_period ON {cls.TABLE_NAME}(period)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql)

    def create(self, city_id: int, overall_score: int = 70, traffic_score: int = 50,
               transit_score: int = 50, safety_score: int = 70, environment_score: int = 60,
               comment: str = '', period: str = 'daily') -> int:
        now = datetime.now().isoformat()
        data = {
            'city_id': city_id,
            'overall_score': overall_score,
            'traffic_score': traffic_score,
            'transit_score': transit_score,
            'safety_score': safety_score,
            'environment_score': environment_score,
            'comment': comment,
            'period': period,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_latest_by_city_id(self, city_id: int, period: str = None) -> Optional[Dict[str, Any]]:
        conditions = {'city_id': city_id}
        if period:
            conditions['period'] = period
        return self.query.find_one(conditions, order_by='created_at DESC')

    def get_history(self, city_id: int, period: str = 'daily', limit: int = 30) -> List[Dict[str, Any]]:
        conditions = {'city_id': city_id, 'period': period}
        return self.query.find_all(conditions, order_by='created_at DESC', limit=limit)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_period_text(self, period: str) -> str:
        period_map = {
            self.PERIOD_DAILY: '每日',
            self.PERIOD_WEEKLY: '每周',
            self.PERIOD_MONTHLY: '每月'
        }
        return period_map.get(period, '未知')
