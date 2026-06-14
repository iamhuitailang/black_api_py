from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CourseStatsModel:
    TABLE_NAME = 'tb_course_stats'

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
                course_id INTEGER NOT NULL UNIQUE,
                avg_score REAL DEFAULT 0,
                review_count INTEGER DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_course_id ON {cls.TABLE_NAME}(course_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_avg_score ON {cls.TABLE_NAME}(avg_score)"
        db.execute(index_sql2)

    def upsert(self, course_id: int, avg_score: float, review_count: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'course_id': course_id,
            'avg_score': avg_score,
            'review_count': review_count,
            'updated_at': now
        }
        return self.exec.upsert(data, ['course_id'])

    def get_by_course_id(self, course_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'course_id': course_id})

    def get_rankings(self, semester: str, order: str = 'DESC', min_reviews: int = 5, limit: int = 10) -> List[Dict[str, Any]]:
        order_clause = 'DESC' if order.upper() == 'DESC' else 'ASC'
        sql = f"""
            SELECT 
                c.id as course_id,
                c.name,
                c.teacher,
                c.semester,
                c.department,
                s.avg_score,
                s.review_count
            FROM {self.TABLE_NAME} s
            JOIN tb_course_courses c ON s.course_id = c.id
            WHERE c.semester = ? AND s.review_count >= ?
            ORDER BY s.avg_score {order_clause}, s.review_count DESC
            LIMIT ?
        """
        return self.db.fetch_all(sql, (semester, min_reviews, limit))

    def recalculate_all(self):
        sql = f"""
            SELECT 
                r.course_id,
                (AVG(r.content_quality) + AVG(r.clarity) + AVG(r.homework) + AVG(r.grading)) / 4 as avg_score,
                COUNT(*) as review_count
            FROM tb_course_reviews r
            WHERE r.hidden = 0
            GROUP BY r.course_id
        """
        rows = self.db.fetch_all(sql)
        now = datetime.now().isoformat()
        for row in rows:
            course_id = row['course_id']
            avg_score = round(row['avg_score'] or 0, 2)
            review_count = row['review_count']
            data = {
                'course_id': course_id,
                'avg_score': avg_score,
                'review_count': review_count,
                'updated_at': now
            }
            self.exec.upsert(data, ['course_id'])
