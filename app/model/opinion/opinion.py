from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class OpinionModel:
    TABLE_NAME = 'tb_opinion'
    
    STATUS_PENDING = 'pending'
    STATUS_CLAIMED = 'claimed'
    STATUS_PROCESSING = 'processing'
    STATUS_RESOLVED = 'resolved'
    STATUS_ESCALATED = 'escalated'
    STATUS_CLOSED = 'closed'
    
    CATEGORY_ENVIRONMENT = 'environment'
    CATEGORY_SECURITY = 'security'
    CATEGORY_FACILITY = 'facility'
    CATEGORY_OTHER = 'other'
    
    CATEGORY_MAP = {
        CATEGORY_ENVIRONMENT: '环境卫生',
        CATEGORY_SECURITY: '治安',
        CATEGORY_FACILITY: '设施',
        CATEGORY_OTHER: '其他'
    }
    
    STATUS_MAP = {
        STATUS_PENDING: '待认领',
        STATUS_CLAIMED: '已认领',
        STATUS_PROCESSING: '处理中',
        STATUS_RESOLVED: '已解决',
        STATUS_ESCALATED: '已升级',
        STATUS_CLOSED: '已关闭'
    }

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
                category TEXT NOT NULL,
                description TEXT NOT NULL,
                photos TEXT,
                status TEXT NOT NULL DEFAULT 'pending',
                submitter_id INTEGER NOT NULL,
                submitter_name TEXT,
                community TEXT,
                handler_id INTEGER,
                handler_name TEXT,
                escalated INTEGER DEFAULT 0,
                assigned_at TIMESTAMP,
                claimed_at TIMESTAMP,
                resolved_at TIMESTAMP,
                closed_at TIMESTAMP,
                response_days INTEGER,
                rating INTEGER,
                is_public INTEGER DEFAULT 0,
                supervision_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category ON {cls.TABLE_NAME}(category)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_submitter ON {cls.TABLE_NAME}(submitter_id)"
        db.execute(index_sql3)
        index_sql4 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_handler ON {cls.TABLE_NAME}(handler_id)"
        db.execute(index_sql4)
        index_sql5 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql5)
        index_sql6 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_public ON {cls.TABLE_NAME}(is_public)"
        db.execute(index_sql6)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        insert_data = {
            'title': data.get('title'),
            'category': data.get('category'),
            'description': data.get('description'),
            'photos': data.get('photos'),
            'status': self.STATUS_PENDING,
            'submitter_id': data.get('submitter_id'),
            'submitter_name': data.get('submitter_name'),
            'community': data.get('community'),
            'assigned_at': now,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(insert_data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_list(self, conditions: Dict[str, Any] = None, page: int = 1, page_size: int = 20, 
                 order_by: str = 'created_at DESC') -> Dict[str, Any]:
        return self.query.paginate(page, page_size, conditions, order_by=order_by)

    def get_by_submitter(self, submitter_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, {'submitter_id': submitter_id}, order_by='created_at DESC')

    def get_by_handler(self, handler_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, {'handler_id': handler_id}, order_by='created_at DESC')

    def get_pending_list(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, {'status': self.STATUS_PENDING}, order_by='created_at DESC')

    def get_public_list(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, {'is_public': 1}, order_by='closed_at DESC')

    def update_status(self, record_id: int, status: str, extra_data: Dict[str, Any] = None) -> int:
        now = datetime.now().isoformat()
        data = {'status': status, 'updated_at': now}
        
        if status == self.STATUS_CLAIMED:
            data['claimed_at'] = now
        elif status == self.STATUS_RESOLVED:
            data['resolved_at'] = now
            opinion = self.get_by_id(record_id)
            if opinion and opinion.get('claimed_at'):
                try:
                    claimed = datetime.fromisoformat(opinion['claimed_at'])
                    resolved = datetime.fromisoformat(now)
                    data['response_days'] = (resolved - claimed).days
                except:
                    pass
        elif status == self.STATUS_CLOSED:
            data['closed_at'] = now
        
        if extra_data:
            data.update(extra_data)
        
        return self.exec.update_by_id(record_id, data)

    def assign_handler(self, record_id: int, handler_id: int, handler_name: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'handler_id': handler_id,
            'handler_name': handler_name,
            'status': self.STATUS_CLAIMED,
            'claimed_at': now,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def set_rating(self, record_id: int, rating: int) -> int:
        now = datetime.now().isoformat()
        is_public = 1 if rating >= 4 else 0
        data = {
            'rating': rating,
            'is_public': is_public,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def set_escalated(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'escalated': 1,
            'status': self.STATUS_ESCALATED,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def get_unclaimed_overdue(self, days: int = 5) -> List[Dict[str, Any]]:
        cutoff = (datetime.now() - timedelta(days=days)).isoformat()
        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE status = ? AND created_at < ? AND escalated = 0
        """
        return self.db.fetch_all(sql, (self.STATUS_PENDING, cutoff))

    def get_category_stats(self) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT category, COUNT(*) as count 
            FROM {self.TABLE_NAME} 
            GROUP BY category
        """
        return self.db.fetch_all(sql)

    def get_status_stats(self) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT status, COUNT(*) as count 
            FROM {self.TABLE_NAME} 
            GROUP BY status
        """
        return self.db.fetch_all(sql)

    def get_monthly_stats(self, months: int = 6) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT 
                strftime('%Y-%m', created_at) as month,
                COUNT(*) as count,
                AVG(CASE WHEN response_days IS NOT NULL THEN response_days END) as avg_response_days
            FROM {self.TABLE_NAME} 
            WHERE created_at >= date('now', ?)
            GROUP BY strftime('%Y-%m', created_at)
            ORDER BY month DESC
        """
        return self.db.fetch_all(sql, (f'-{months} months',))

    def get_rating_stats(self) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT rating, COUNT(*) as count 
            FROM {self.TABLE_NAME} 
            WHERE rating IS NOT NULL
            GROUP BY rating
            ORDER BY rating
        """
        return self.db.fetch_all(sql)

    def get_avg_rating(self) -> float:
        sql = f"SELECT AVG(rating) as avg_rating FROM {self.TABLE_NAME} WHERE rating IS NOT NULL"
        result = self.db.fetch_one(sql)
        return result.get('avg_rating', 0) or 0

    def get_avg_response_days(self) -> float:
        sql = f"SELECT AVG(response_days) as avg_days FROM {self.TABLE_NAME} WHERE response_days IS NOT NULL"
        result = self.db.fetch_one(sql)
        return result.get('avg_days', 0) or 0

    def get_total_count(self) -> int:
        return self.query.count()

    def get_resolved_count(self) -> int:
        return self.query.count({'status': self.STATUS_RESOLVED}) + self.query.count({'status': self.STATUS_CLOSED})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
