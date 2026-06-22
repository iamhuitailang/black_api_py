from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class OpinionRatingModel:
    TABLE_NAME = 'tb_opinion_rating'

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
                opinion_id INTEGER NOT NULL UNIQUE,
                rating INTEGER NOT NULL,
                comment TEXT,
                rater_id INTEGER NOT NULL,
                rater_name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_opinion ON {cls.TABLE_NAME}(opinion_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_rater ON {cls.TABLE_NAME}(rater_id)"
        db.execute(index_sql2)

    def create(self, opinion_id: int, rating: int, comment: str = None, 
               rater_id: int = None, rater_name: str = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'opinion_id': opinion_id,
            'rating': rating,
            'comment': comment,
            'rater_id': rater_id,
            'rater_name': rater_name,
            'created_at': now
        }
        return self.exec.upsert(data, ['opinion_id'])

    def get_by_opinion_id(self, opinion_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'opinion_id': opinion_id})

    def get_by_rater(self, rater_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'rater_id': rater_id}, order_by='created_at DESC')
