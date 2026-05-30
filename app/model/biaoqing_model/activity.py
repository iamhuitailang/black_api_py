from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ActivityModel:
    TABLE_NAME = 'tb_biaoqing_model_activities'

    STATUS_DRAFT = 0
    STATUS_ACTIVE = 1
    STATUS_ENDED = 2
    STATUS_CANCELLED = 3

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
                content TEXT DEFAULT '',
                start_time TIMESTAMP,
                end_time TIMESTAMP,
                points_reward INTEGER DEFAULT 0,
                max_participants INTEGER DEFAULT 0,
                current_participants INTEGER DEFAULT 0,
                view_count INTEGER DEFAULT 0,
                status INTEGER DEFAULT 0,
                created_by INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        try:
            db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN view_count INTEGER DEFAULT 0")
        except Exception:
            pass

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_time ON {cls.TABLE_NAME}(start_time, end_time)"
        db.execute(index_sql)

    def create(self, title: str, description: str = '', cover_image: str = '',
               content: str = '', start_time: str = '', end_time: str = '',
               points_reward: int = 0, max_participants: int = 0,
               created_by: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'title': title,
            'description': description,
            'cover_image': cover_image,
            'content': content,
            'start_time': start_time,
            'end_time': end_time,
            'points_reward': points_reward,
            'max_participants': max_participants,
            'current_participants': 0,
            'status': self.STATUS_DRAFT,
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
            'title', 'description', 'cover_image', 'content',
            'start_time', 'end_time', 'points_reward',
            'max_participants', 'status'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def update_status(self, record_id: int, status: int) -> int:
        return self.update(record_id, {'status': status})

    def increment_participants(self, record_id: int, delta: int = 1) -> int:
        activity = self.get_by_id(record_id)
        if not activity:
            return 0
        new_count = max(0, activity.get('current_participants', 0) + delta)
        return self.exec.update_by_id(record_id, {'current_participants': new_count})

    def increment_view_count(self, record_id: int, delta: int = 1) -> int:
        activity = self.get_by_id(record_id)
        if not activity:
            return 0
        new_count = max(0, activity.get('view_count', 0) + delta)
        return self.exec.update_by_id(record_id, {'view_count': new_count})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 20, status: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_active_list(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        now = datetime.now().isoformat()
        sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE status = ? AND start_time <= ? AND (end_time IS NULL OR end_time >= ?)
            ORDER BY id DESC
            LIMIT {page_size} OFFSET {(page - 1) * page_size}
        """
        items = self.db.fetch_all(sql, (self.STATUS_ACTIVE, now, now))

        count_sql = f"""
            SELECT COUNT(*) as total FROM {self.TABLE_NAME}
            WHERE status = ? AND start_time <= ? AND (end_time IS NULL OR end_time >= ?)
        """
        total_result = self.db.fetch_one(count_sql, (self.STATUS_ACTIVE, now, now))
        total = total_result['total'] if total_result else 0

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_DRAFT: '草稿',
            self.STATUS_ACTIVE: '进行中',
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
            'cover_url': activity.get('cover_image'),
            'content': activity.get('content'),
            'start_time': activity.get('start_time'),
            'end_time': activity.get('end_time'),
            'points_reward': activity.get('points_reward'),
            'reward_desc': f"参与可得 {activity.get('points_reward', 0)} 积分",
            'max_participants': activity.get('max_participants'),
            'current_participants': activity.get('current_participants'),
            'participant_count': activity.get('current_participants'),
            'view_count': activity.get('view_count', 0),
            'status': activity.get('status'),
            'status_text': self.get_status_text(activity.get('status')),
            'created_by': activity.get('created_by'),
            'created_at': activity.get('created_at')
        }
