from datetime import datetime
from typing import Dict, Any, List, Optional
import json
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ReviewModel:
    TABLE_NAME = 'tb_course_reviews'

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
                course_id INTEGER NOT NULL,
                content_quality INTEGER NOT NULL DEFAULT 3,
                clarity INTEGER NOT NULL DEFAULT 3,
                homework INTEGER NOT NULL DEFAULT 3,
                grading INTEGER NOT NULL DEFAULT 3,
                comment TEXT DEFAULT '',
                tags TEXT DEFAULT '[]',
                upvotes INTEGER DEFAULT 0,
                hidden INTEGER DEFAULT 0,
                hidden_reason TEXT DEFAULT '',
                client_id TEXT DEFAULT '',
                user_id INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_course_id ON {cls.TABLE_NAME}(course_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_upvotes ON {cls.TABLE_NAME}(upvotes)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql3)

    @classmethod
    def migrate_add_user_id(cls):
        db = get_db()
        try:
            db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN user_id INTEGER DEFAULT 0")
        except Exception:
            pass
        try:
            db.execute(f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)")
        except Exception:
            pass

    def create(self, course_id: int, content_quality: int, clarity: int,
               homework: int, grading: int, comment: str, tags: List[str],
               client_id: str = '', user_id: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'course_id': course_id,
            'content_quality': content_quality,
            'clarity': clarity,
            'homework': homework,
            'grading': grading,
            'comment': comment,
            'tags': json.dumps(tags, ensure_ascii=False),
            'upvotes': 0,
            'hidden': 0,
            'hidden_reason': '',
            'client_id': client_id,
            'user_id': user_id,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        row = self.query.find_by_id(record_id)
        if row:
            row['tags'] = json.loads(row.get('tags', '[]')) if row.get('tags') else []
        return row

    def get_by_course_id(self, course_id: int, include_hidden: bool = False) -> List[Dict[str, Any]]:
        conditions = {'course_id': course_id}
        if not include_hidden:
            conditions['hidden'] = 0
        rows = self.query.find_all(conditions, order_by='upvotes DESC, created_at DESC')
        for row in rows:
            row['tags'] = json.loads(row.get('tags', '[]')) if row.get('tags') else []
        return rows

    def count_by_course_id(self, course_id: int, include_hidden: bool = False) -> int:
        conditions = {'course_id': course_id}
        if not include_hidden:
            conditions['hidden'] = 0
        return self.query.count(conditions)

    def get_all(self, include_hidden: bool = True) -> List[Dict[str, Any]]:
        conditions = None
        if not include_hidden:
            conditions = {'hidden': 0}
        rows = self.query.find_all(conditions, order_by='created_at DESC')
        for row in rows:
            row['tags'] = json.loads(row.get('tags', '[]')) if row.get('tags') else []
        return rows

    def increment_upvote(self, record_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET upvotes = upvotes + 1 WHERE id = ?"
        self.db.execute(sql, (record_id,))
        updated = self.get_by_id(record_id)
        return updated.get('upvotes', 0) if updated else 0

    def hide_review(self, record_id: int, reason: str) -> int:
        return self.exec.update_by_id(record_id, {'hidden': 1, 'hidden_reason': reason})

    def restore_review(self, record_id: int) -> int:
        return self.exec.update_by_id(record_id, {'hidden': 0, 'hidden_reason': ''})

    def has_reviewed(self, course_id: int, client_id: str = '', user_id: int = 0) -> bool:
        if user_id and user_id > 0:
            return self.query.exists({'course_id': course_id, 'user_id': user_id})
        if client_id:
            return self.query.exists({'course_id': course_id, 'client_id': client_id, 'user_id': 0})
        return False

    def get_avg_scores_by_course(self, course_id: int) -> Optional[Dict[str, Any]]:
        sql = f"""
            SELECT 
                AVG(content_quality) as avg_content_quality,
                AVG(clarity) as avg_clarity,
                AVG(homework) as avg_homework,
                AVG(grading) as avg_grading,
                COUNT(*) as review_count
            FROM {self.TABLE_NAME}
            WHERE course_id = ? AND hidden = 0
        """
        result = self.db.fetch_one(sql, (course_id,))
        if result:
            avg_cq = result.get('avg_content_quality') or 0
            avg_cl = result.get('avg_clarity') or 0
            avg_hw = result.get('avg_homework') or 0
            avg_gr = result.get('avg_grading') or 0
            overall = (avg_cq + avg_cl + avg_hw + avg_gr) / 4 if result.get('review_count', 0) > 0 else 0
            return {
                'content_quality': round(avg_cq, 2),
                'clarity': round(avg_cl, 2),
                'homework': round(avg_hw, 2),
                'grading': round(avg_gr, 2),
                'overall': round(overall, 2),
                'review_count': result.get('review_count', 0)
            }
        return None

    def get_tags_frequency(self, course_id: int) -> List[Dict[str, Any]]:
        sql = f"SELECT tags FROM {self.TABLE_NAME} WHERE course_id = ? AND hidden = 0"
        rows = self.db.fetch_all(sql, (course_id,))
        tag_counts = {}
        for row in rows:
            tags = json.loads(row.get('tags', '[]')) if row.get('tags') else []
            for tag in tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
        result = [{'tag': k, 'count': v} for k, v in tag_counts.items()]
        result.sort(key=lambda x: x['count'], reverse=True)
        return result

    def has_voted(self, review_id: int, client_id: str) -> bool:
        sql = "SELECT COUNT(*) as total FROM tb_course_votes WHERE review_id = ? AND client_id = ?"
        result = self.db.fetch_one(sql, (review_id, client_id))
        return result.get('total', 0) > 0 if result else False

    def add_vote(self, review_id: int, client_id: str) -> bool:
        sql = "INSERT INTO tb_course_votes (review_id, client_id, created_at) VALUES (?, ?, ?)"
        try:
            self.db.execute(sql, (review_id, client_id, datetime.now().isoformat()))
            return True
        except Exception:
            return False

    @classmethod
    def create_vote_table(cls):
        db = get_db()
        sql = """
            CREATE TABLE IF NOT EXISTS tb_course_votes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                review_id INTEGER NOT NULL,
                client_id TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = "CREATE INDEX IF NOT EXISTS idx_tb_course_votes_review_client ON tb_course_votes(review_id, client_id)"
        db.execute(index_sql)
