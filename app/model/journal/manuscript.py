from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
from datetime import datetime


class ManuscriptStatus:
    DRAFT = 'draft'
    SUBMITTED = 'submitted'
    UNDER_REVIEW = 'under_review'
    REVIEW_COMPLETED = 'review_completed'
    ACCEPTED = 'accepted'
    REVISION_REQUIRED = 'revision_required'
    REJECTED = 'rejected'
    PUBLISHED = 'published'

    STATUS_MAP = {
        DRAFT: '草稿',
        SUBMITTED: '待分配',
        UNDER_REVIEW: '审稿中',
        REVIEW_COMPLETED: '审稿完成',
        ACCEPTED: '已录用',
        REVISION_REQUIRED: '需修改',
        REJECTED: '已退稿',
        PUBLISHED: '已发表'
    }

    STEP_MAP = {
        DRAFT: 1,
        SUBMITTED: 2,
        UNDER_REVIEW: 3,
        REVIEW_COMPLETED: 4,
        ACCEPTED: 5,
        REVISION_REQUIRED: 5,
        REJECTED: 5,
        PUBLISHED: 6
    }

    TOTAL_STEPS = 6

    STEP_NAMES = ['投稿', '提交', '审稿中', '审稿完成', '编辑决定', '发表/结束']


class ManuscriptModel:
    TABLE_NAME = 'tb_journal_manuscript'

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
                title TEXT NOT NULL,
                abstract TEXT DEFAULT '',
                file_path TEXT DEFAULT '',
                file_name TEXT DEFAULT '',
                keywords TEXT DEFAULT '',
                author_name TEXT DEFAULT '',
                author_email TEXT DEFAULT '',
                author_phone TEXT DEFAULT '',
                author_affiliation TEXT DEFAULT '',
                section_id INTEGER DEFAULT 0,
                author_user_id INTEGER DEFAULT 0,
                status TEXT DEFAULT 'draft',
                editor_decision TEXT DEFAULT '',
                editor_comment TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                submitted_at TIMESTAMP,
                decided_at TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_author ON {cls.TABLE_NAME}(author_user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_section ON {cls.TABLE_NAME}(section_id)"
        db.execute(index_sql3)

    def create(self, title: str, abstract: str, file_path: str, file_name: str,
               keywords: str, section_id: int, author_user_id: int,
               author_name: str = '', author_email: str = '',
               author_phone: str = '', author_affiliation: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'title': title,
            'abstract': abstract,
            'file_path': file_path,
            'file_name': file_name,
            'keywords': keywords,
            'section_id': section_id,
            'author_user_id': author_user_id,
            'author_name': author_name,
            'author_email': author_email,
            'author_phone': author_phone,
            'author_affiliation': author_affiliation,
            'status': ManuscriptStatus.DRAFT,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_author(self, author_user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'author_user_id': author_user_id},
            order_by='created_at DESC'
        )

    def get_by_status(self, status: str) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'status': status},
            order_by='created_at DESC'
        )

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='created_at DESC')

    def update_status(self, record_id: int, status: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        if status == ManuscriptStatus.SUBMITTED:
            data['submitted_at'] = now
        if status in [ManuscriptStatus.ACCEPTED, ManuscriptStatus.REJECTED, ManuscriptStatus.REVISION_REQUIRED, ManuscriptStatus.PUBLISHED]:
            data['decided_at'] = now
        return self.exec.update_by_id(record_id, data)

    def update(self, record_id: int, title: str = None, abstract: str = None,
               file_path: str = None, file_name: str = None, keywords: str = None,
               section_id: int = None, author_name: str = None,
               author_email: str = None, author_phone: str = None,
               author_affiliation: str = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        if title is not None:
            data['title'] = title
        if abstract is not None:
            data['abstract'] = abstract
        if file_path is not None:
            data['file_path'] = file_path
        if file_name is not None:
            data['file_name'] = file_name
        if keywords is not None:
            data['keywords'] = keywords
        if section_id is not None:
            data['section_id'] = section_id
        if author_name is not None:
            data['author_name'] = author_name
        if author_email is not None:
            data['author_email'] = author_email
        if author_phone is not None:
            data['author_phone'] = author_phone
        if author_affiliation is not None:
            data['author_affiliation'] = author_affiliation
        return self.exec.update_by_id(record_id, data)

    def set_editor_decision(self, record_id: int, decision: str, comment: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'editor_decision': decision,
            'editor_comment': comment,
            'status': decision,
            'decided_at': now,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def paginate_by_author(self, author_user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(
            page=page,
            page_size=page_size,
            conditions={'author_user_id': author_user_id},
            order_by='created_at DESC'
        )

    def paginate_all(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(
            page=page,
            page_size=page_size,
            order_by='created_at DESC'
        )

    def paginate_by_status(self, status: str, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(
            page=page,
            page_size=page_size,
            conditions={'status': status},
            order_by='created_at DESC'
        )
