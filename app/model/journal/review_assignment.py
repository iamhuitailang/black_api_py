from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
from datetime import datetime


class ReviewAssignmentStatus:
    PENDING = 'pending'
    ACCEPTED = 'accepted'
    DECLINED = 'declined'
    COMPLETED = 'completed'


class ReviewAssignmentModel:
    TABLE_NAME = 'tb_journal_review_assignment'

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
                reviewer_user_id INTEGER NOT NULL,
                reviewer_name TEXT DEFAULT '',
                status TEXT DEFAULT 'pending',
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                accepted_at TIMESTAMP,
                declined_at TIMESTAMP,
                completed_at TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_manuscript ON {cls.TABLE_NAME}(manuscript_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_reviewer ON {cls.TABLE_NAME}(reviewer_user_id)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql3)

    def create(self, manuscript_id: int, reviewer_user_id: int,
               reviewer_name: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'manuscript_id': manuscript_id,
            'reviewer_user_id': reviewer_user_id,
            'reviewer_name': reviewer_name,
            'status': ReviewAssignmentStatus.PENDING,
            'assigned_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_manuscript(self, manuscript_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'manuscript_id': manuscript_id},
            order_by='assigned_at DESC'
        )

    def get_by_reviewer(self, reviewer_user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'reviewer_user_id': reviewer_user_id},
            order_by='assigned_at DESC'
        )

    def get_by_reviewer_and_status(self, reviewer_user_id: int, status: str) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'reviewer_user_id': reviewer_user_id, 'status': status},
            order_by='assigned_at DESC'
        )

    def update_status(self, record_id: int, status: str) -> int:
        now = datetime.now().isoformat()
        data = {'status': status}
        if status == ReviewAssignmentStatus.ACCEPTED:
            data['accepted_at'] = now
        elif status == ReviewAssignmentStatus.DECLINED:
            data['declined_at'] = now
        elif status == ReviewAssignmentStatus.COMPLETED:
            data['completed_at'] = now
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def exists(self, manuscript_id: int, reviewer_user_id: int) -> bool:
        return self.query.exists({
            'manuscript_id': manuscript_id,
            'reviewer_user_id': reviewer_user_id
        })

    def paginate_by_reviewer(self, reviewer_user_id: int, page: int = 1,
                             page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(
            page=page,
            page_size=page_size,
            conditions={'reviewer_user_id': reviewer_user_id},
            order_by='assigned_at DESC'
        )

    def count_pending_by_reviewer(self, reviewer_user_id: int) -> int:
        return self.query.count({
            'reviewer_user_id': reviewer_user_id,
            'status': ReviewAssignmentStatus.PENDING
        })

    def count_active_by_reviewer(self, reviewer_user_id: int) -> int:
        return self.query.count({
            'reviewer_user_id': reviewer_user_id,
            'status': ReviewAssignmentStatus.ACCEPTED
        })
