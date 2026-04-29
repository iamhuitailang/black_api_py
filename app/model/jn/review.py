from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ReviewModel:
    TABLE_NAME = 'tb_jn_reviews'

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
                exchange_id INTEGER NOT NULL,
                from_user INTEGER NOT NULL,
                to_user INTEGER NOT NULL,
                score INTEGER NOT NULL DEFAULT 5,
                content TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_exchange_id ON {cls.TABLE_NAME}(exchange_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_to_user ON {cls.TABLE_NAME}(to_user)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_from_user ON {cls.TABLE_NAME}(from_user)"
        db.execute(index_sql3)

    def create(self, exchange_id: int, from_user: int, to_user: int,
               score: int = 5, content: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'exchange_id': exchange_id,
            'from_user': from_user,
            'to_user': to_user,
            'score': max(1, min(5, score)),
            'content': content,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_exchange(self, exchange_id: int) -> List[Dict[str, Any]]:
        conditions = {'exchange_id': exchange_id}
        return self.query.find_all(conditions, order_by='id DESC')

    def get_by_to_user(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {'to_user': user_id}
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_by_from_user(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {'from_user': user_id}
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_user_avg_score(self, user_id: int) -> float:
        sql = f"""
            SELECT AVG(score) as avg_score 
            FROM {self.TABLE_NAME} 
            WHERE to_user = ?
        """
        result = self.db.fetch_one(sql, (user_id,))
        if result and result.get('avg_score'):
            return round(float(result['avg_score']), 1)
        return 5.0

    def get_user_review_count(self, user_id: int) -> int:
        sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE to_user = ?"
        result = self.db.fetch_one(sql, (user_id,))
        return result.get('total', 0) if result else 0

    def check_exists(self, exchange_id: int, from_user: int) -> bool:
        conditions = {
            'exchange_id': exchange_id,
            'from_user': from_user
        }
        result = self.query.find_one(conditions)
        return result is not None

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10,
                to_user: int = None, keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if to_user:
            conditions['to_user'] = to_user

        if keyword:
            return self.search(keyword, page, page_size, to_user)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               to_user: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if to_user:
            where_clauses.append("to_user = ?")
            params.append(to_user)

        where_clauses.append("content LIKE ?")
        like_pattern = f"%{keyword}%"
        params.append(like_pattern)

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY id DESC 
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, tuple(params))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def to_dict(self, review: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': review.get('id'),
            'exchange_id': review.get('exchange_id'),
            'from_user': review.get('from_user'),
            'to_user': review.get('to_user'),
            'score': review.get('score'),
            'content': review.get('content'),
            'created_at': review.get('created_at')
        }
