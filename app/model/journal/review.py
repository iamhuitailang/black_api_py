from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
from datetime import datetime


class ReviewRecommendation:
    ACCEPT = 'accept'
    MINOR_REVISION = 'minor_revision'
    MAJOR_REVISION = 'major_revision'
    REJECT = 'reject'

    LABEL_MAP = {
        ACCEPT: '录用',
        MINOR_REVISION: '小修',
        MAJOR_REVISION: '大修',
        REJECT: '退稿'
    }


class ReviewModel:
    TABLE_NAME = 'tb_journal_review'

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
                manuscript_id INTEGER NOT NULL,
                assignment_id INTEGER NOT NULL,
                reviewer_user_id INTEGER NOT NULL,
                reviewer_name TEXT DEFAULT '',
                recommendation TEXT DEFAULT '',
                originality_score INTEGER DEFAULT 0,
                scientific_score INTEGER DEFAULT 0,
                language_score INTEGER DEFAULT 0,
                overall_score INTEGER DEFAULT 0,
                comment_to_author TEXT DEFAULT '',
                comment_to_editor TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_manuscript ON {cls.TABLE_NAME}(manuscript_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_reviewer ON {cls.TABLE_NAME}(reviewer_user_id)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_assignment ON {cls.TABLE_NAME}(assignment_id)"
        db.execute(index_sql3)

    def create(self, manuscript_id: int, assignment_id: int, reviewer_user_id: int,
               reviewer_name: str, recommendation: str,
               originality_score: int, scientific_score: int,
               language_score: int, overall_score: int,
               comment_to_author: str = '', comment_to_editor: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'manuscript_id': manuscript_id,
            'assignment_id': assignment_id,
            'reviewer_user_id': reviewer_user_id,
            'reviewer_name': reviewer_name,
            'recommendation': recommendation,
            'originality_score': originality_score,
            'scientific_score': scientific_score,
            'language_score': language_score,
            'overall_score': overall_score,
            'comment_to_author': comment_to_author,
            'comment_to_editor': comment_to_editor,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_manuscript(self, manuscript_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'manuscript_id': manuscript_id},
            order_by='created_at DESC'
        )

    def get_by_reviewer(self, reviewer_user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'reviewer_user_id': reviewer_user_id},
            order_by='created_at DESC'
        )

    def get_by_assignment(self, assignment_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'assignment_id': assignment_id})

    def update(self, record_id: int, recommendation: str = None,
               originality_score: int = None, scientific_score: int = None,
               language_score: int = None, overall_score: int = None,
               comment_to_author: str = None, comment_to_editor: str = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        if recommendation is not None:
            data['recommendation'] = recommendation
        if originality_score is not None:
            data['originality_score'] = originality_score
        if scientific_score is not None:
            data['scientific_score'] = scientific_score
        if language_score is not None:
            data['language_score'] = language_score
        if overall_score is not None:
            data['overall_score'] = overall_score
        if comment_to_author is not None:
            data['comment_to_author'] = comment_to_author
        if comment_to_editor is not None:
            data['comment_to_editor'] = comment_to_editor
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def exists_by_assignment(self, assignment_id: int) -> bool:
        return self.query.exists({'assignment_id': assignment_id})

    def get_average_score_by_manuscript(self, manuscript_id: int) -> Optional[Dict[str, Any]]:
        sql = f"""
            SELECT 
                AVG(originality_score) as avg_originality,
                AVG(scientific_score) as avg_scientific,
                AVG(language_score) as avg_language,
                AVG(overall_score) as avg_overall,
                COUNT(*) as review_count
            FROM {self.TABLE_NAME} 
            WHERE manuscript_id = ?
        """
        return self.db.fetch_one(sql, (manuscript_id,))
