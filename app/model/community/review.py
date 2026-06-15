from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ReviewModel:
    TABLE_NAME = 'tb_community_review'

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
                record_id INTEGER NOT NULL,
                reviewer_id INTEGER NOT NULL,
                target_user_id INTEGER NOT NULL,
                rating INTEGER NOT NULL,
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        db.execute(f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_record_id ON {cls.TABLE_NAME}(record_id)")
        db.execute(f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_reviewer_id ON {cls.TABLE_NAME}(reviewer_id)")
        db.execute(f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_target_user_id ON {cls.TABLE_NAME}(target_user_id)")

    def create(self, record_id: int, reviewer_id: int, target_user_id: int,
               rating: int, comment: str = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'record_id': record_id,
            'reviewer_id': reviewer_id,
            'target_user_id': target_user_id,
            'rating': rating,
            'comment': comment,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_record_and_reviewer(self, record_id: int, reviewer_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({
            'record_id': record_id,
            'reviewer_id': reviewer_id
        })

    def get_list_by_record(self, record_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'record_id': record_id}, order_by='id DESC')

    def get_list_by_item(self, item_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT r.* FROM {self.TABLE_NAME} r
            INNER JOIN tb_community_borrow_record br ON r.record_id = br.id
            INNER JOIN tb_community_borrow_request brr ON br.request_id = brr.id
            WHERE brr.item_id = ?
            ORDER BY r.id DESC
        """
        return self.db.fetch_all(sql, (item_id,))

    def get_list_by_target_user(self, target_user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'target_user_id': target_user_id}, order_by='id DESC')

    def get_list_by_reviewer(self, reviewer_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'reviewer_id': reviewer_id}, order_by='id DESC')

    def get_average_rating(self, user_id: int) -> Dict[str, Any]:
        sql = f"""
            SELECT 
                COUNT(*) as total_count,
                AVG(rating) as avg_rating,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
            FROM {self.TABLE_NAME}
            WHERE target_user_id = ?
        """
        result = self.db.fetch_one(sql, (user_id,))
        if result:
            avg = result.get('avg_rating')
            result['avg_rating'] = round(float(avg), 1) if avg else 0.0
        return result or {
            'total_count': 0,
            'avg_rating': 0.0,
            'five_star': 0,
            'four_star': 0,
            'three_star': 0,
            'two_star': 0,
            'one_star': 0
        }
