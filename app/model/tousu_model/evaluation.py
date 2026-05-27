from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class EvaluationModel:
    TABLE_NAME = 'tb_tousu_model_evaluations'

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
                complaint_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                rating INTEGER NOT NULL DEFAULT 5,
                content TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_complaint_id ON {cls.TABLE_NAME}(complaint_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)

    def create(self, complaint_id: int, user_id: int, rating: int, content: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'complaint_id': complaint_id,
            'user_id': user_id,
            'rating': rating,
            'content': content,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_complaint(self, complaint_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'complaint_id': complaint_id})

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_statistics(self, department_id: int = None) -> Dict[str, Any]:
        where_clauses = ["1=1"]
        params = []

        if department_id:
            where_clauses.append("c.department_id = ?")
            params.append(department_id)

        sql = f"""
            SELECT 
                COUNT(*) as total,
                AVG(e.rating) as avg_rating,
                SUM(CASE WHEN e.rating >= 4 THEN 1 ELSE 0 END) as good_count,
                SUM(CASE WHEN e.rating <= 2 THEN 1 ELSE 0 END) as bad_count
            FROM {self.TABLE_NAME} e
            JOIN tb_tousu_model_complaints c ON e.complaint_id = c.id
            WHERE {' AND '.join(where_clauses)}
        """
        result = self.db.fetch_one(sql, tuple(params) if params else None)
        
        return {
            'total': result['total'] if result else 0,
            'avg_rating': round(result['avg_rating'] or 0, 2),
            'good_count': result['good_count'] if result else 0,
            'bad_count': result['bad_count'] if result else 0
        }

    def to_dict(self, evaluation: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': evaluation.get('id'),
            'complaint_id': evaluation.get('complaint_id'),
            'user_id': evaluation.get('user_id'),
            'rating': evaluation.get('rating'),
            'content': evaluation.get('content'),
            'created_at': evaluation.get('created_at')
        }