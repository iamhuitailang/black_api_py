from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ActivityModel:
    TABLE_NAME = 'tb_bm_activities'

    STATUS_REGISTERING = 1
    STATUS_ONGOING = 2
    STATUS_ENDED = 3
    STATUS_CANCELLED = 4

    APPROVAL_NO = 0
    APPROVAL_YES = 1

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
                description TEXT DEFAULT '',
                cover_image TEXT DEFAULT '',
                location TEXT NOT NULL,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP NOT NULL,
                registration_start TIMESTAMP NOT NULL,
                registration_end TIMESTAMP NOT NULL,
                total_quota INTEGER NOT NULL,
                remaining_quota INTEGER NOT NULL,
                version INTEGER DEFAULT 0,
                need_approval INTEGER DEFAULT 0,
                status INTEGER DEFAULT 1,
                created_by INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_start_time ON {cls.TABLE_NAME}(start_time)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_by ON {cls.TABLE_NAME}(created_by)"
        db.execute(index_sql)

    def create(self, title: str, description: str, cover_image: str, location: str,
               start_time: str, end_time: str, registration_start: str, registration_end: str,
               total_quota: int, need_approval: int = APPROVAL_NO, created_by: int = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'title': title,
            'description': description,
            'cover_image': cover_image,
            'location': location,
            'start_time': start_time,
            'end_time': end_time,
            'registration_start': registration_start,
            'registration_end': registration_end,
            'total_quota': total_quota,
            'remaining_quota': total_quota,
            'version': 0,
            'need_approval': need_approval,
            'status': self.STATUS_REGISTERING,
            'created_by': created_by,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'title', 'description', 'cover_image', 'location',
            'start_time', 'end_time', 'registration_start', 'registration_end',
            'total_quota', 'need_approval', 'status'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def decrease_quota_with_version(self, activity_id: int, current_version: int) -> bool:
        sql = f"""
            UPDATE {self.TABLE_NAME} 
            SET remaining_quota = remaining_quota - 1, version = version + 1
            WHERE id = ? AND version = ? AND remaining_quota > 0
        """
        cursor = self.db.execute(sql, (activity_id, current_version))
        return cursor.rowcount > 0

    def increase_quota(self, activity_id: int) -> int:
        sql = f"""
            UPDATE {self.TABLE_NAME} 
            SET remaining_quota = remaining_quota + 1
            WHERE id = ? AND remaining_quota < total_quota
        """
        cursor = self.db.execute(sql, (activity_id,))
        return cursor.rowcount

    def update_status(self, activity_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(activity_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None,
                keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status

        if keyword:
            return self.search(keyword, page, page_size, status)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               status: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        where_clauses.append("(title LIKE ? OR description LIKE ? OR location LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern, like_pattern])

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

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_REGISTERING: '报名中',
            self.STATUS_ONGOING: '进行中',
            self.STATUS_ENDED: '已结束',
            self.STATUS_CANCELLED: '已取消'
        }
        return status_map.get(status, '未知')

    def to_dict(self, activity: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': activity.get('id'),
            'title': activity.get('title'),
            'description': activity.get('description'),
            'cover_image': activity.get('cover_image'),
            'location': activity.get('location'),
            'start_time': activity.get('start_time'),
            'end_time': activity.get('end_time'),
            'registration_start': activity.get('registration_start'),
            'registration_end': activity.get('registration_end'),
            'total_quota': activity.get('total_quota'),
            'remaining_quota': activity.get('remaining_quota'),
            'need_approval': activity.get('need_approval'),
            'need_approval_text': '需要审核' if activity.get('need_approval') == self.APPROVAL_YES else '无需审核',
            'status': activity.get('status'),
            'status_text': self.get_status_text(activity.get('status')),
            'created_by': activity.get('created_by'),
            'created_at': activity.get('created_at')
        }
