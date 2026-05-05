from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ActivityModel:
    TABLE_NAME = 'tb_qx_activities'

    STATUS_RECRUITING = '招募中'
    STATUS_FULL = '已满'
    STATUS_IN_PROGRESS = '进行中'
    STATUS_COMPLETED = '已结束'

    STATUSES = [STATUS_RECRUITING, STATUS_FULL, STATUS_IN_PROGRESS, STATUS_COMPLETED]

    DIFFICULTY_EASY = '初级'
    DIFFICULTY_MEDIUM = '中级'
    DIFFICULTY_HARD = '高级'
    DIFFICULTY_CHALLENGE = '挑战'

    DIFFICULTIES = [DIFFICULTY_EASY, DIFFICULTY_MEDIUM, DIFFICULTY_HARD, DIFFICULTY_CHALLENGE]

    def __init__(self):
        self.db = get_db()
        self.query = ORMQuery(self.TABLE_NAME)
        self.exec = ORMExec(self.TABLE_NAME)

    @classmethod
    def _get_columns(cls, db, table_name):
        cursor = db.execute(f"PRAGMA table_info({table_name})")
        columns = [row['name'] for row in cursor.fetchall()]
        return columns

    @classmethod
    def _add_column_if_not_exists(cls, db, table_name, column_def):
        column_name = column_def.split()[0]
        columns = cls._get_columns(db, table_name)
        if column_name not in columns:
            try:
                db.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_def}")
                return True
            except:
                return False
        return False

    @classmethod
    def create_table(cls):
        db = get_db()
        sql = f"""
            CREATE TABLE IF NOT EXISTS {cls.TABLE_NAME} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                leader_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                route TEXT DEFAULT '',
                distance REAL DEFAULT 0.0,
                elevation INTEGER DEFAULT 0,
                pace TEXT DEFAULT '',
                difficulty TEXT DEFAULT '初级',
                meeting_time TIMESTAMP,
                meeting_point TEXT DEFAULT '',
                meeting_lng REAL DEFAULT 0.0,
                meeting_lat REAL DEFAULT 0.0,
                max_people INTEGER DEFAULT 10,
                current_people INTEGER DEFAULT 0,
                cost REAL DEFAULT 0.0,
                description TEXT DEFAULT '',
                status TEXT DEFAULT '招募中',
                is_checked INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        cls._add_column_if_not_exists(db, cls.TABLE_NAME, "is_checked INTEGER DEFAULT 1")
        cls._add_column_if_not_exists(db, cls.TABLE_NAME, "current_people INTEGER DEFAULT 0")
        cls._add_column_if_not_exists(db, cls.TABLE_NAME, "meeting_lng REAL DEFAULT 0.0")
        cls._add_column_if_not_exists(db, cls.TABLE_NAME, "meeting_lat REAL DEFAULT 0.0")

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_leader_id ON {cls.TABLE_NAME}(leader_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_difficulty ON {cls.TABLE_NAME}(difficulty)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_meeting_time ON {cls.TABLE_NAME}(meeting_time)"
        db.execute(index_sql)

    def create(self, leader_id: int, title: str, route: str = '', distance: float = 0.0,
               elevation: int = 0, pace: str = '', difficulty: str = DIFFICULTY_EASY,
               meeting_time: str = None, meeting_point: str = '', meeting_lng: float = 0.0,
               meeting_lat: float = 0.0, max_people: int = 10, cost: float = 0.0,
               description: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'leader_id': leader_id,
            'title': title,
            'route': route,
            'distance': distance,
            'elevation': elevation,
            'pace': pace,
            'difficulty': difficulty,
            'meeting_time': meeting_time,
            'meeting_point': meeting_point,
            'meeting_lng': meeting_lng,
            'meeting_lat': meeting_lat,
            'max_people': max_people,
            'current_people': 1,
            'cost': cost,
            'description': description,
            'status': self.STATUS_RECRUITING,
            'is_checked': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, activity_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'title', 'route', 'distance', 'elevation', 'pace', 'difficulty',
            'meeting_time', 'meeting_point', 'meeting_lng', 'meeting_lat',
            'max_people', 'cost', 'description'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(activity_id, update_data)

    def update_status(self, activity_id: int, status: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(activity_id, data)

    def update_check_status(self, activity_id: int, is_checked: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'is_checked': is_checked,
            'updated_at': now
        }
        return self.exec.update_by_id(activity_id, data)

    def increment_people(self, activity_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET current_people = current_people + 1 WHERE id = ? AND current_people < max_people"
        cursor = self.db.execute(sql, (activity_id,))
        return cursor.rowcount

    def decrement_people(self, activity_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET current_people = current_people - 1 WHERE id = ? AND current_people > 0"
        cursor = self.db.execute(sql, (activity_id,))
        return cursor.rowcount

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_by_leader(self, leader_id: int, page: int = 1, page_size: int = 10,
                      status: str = None) -> Dict[str, Any]:
        conditions = {'leader_id': leader_id}
        if status:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='meeting_time DESC')

    def get_list(self, page: int = 1, page_size: int = 10,
                 status: str = None, difficulty: str = None,
                 is_checked: int = None, keyword: str = None,
                 order_by: str = 'meeting_time DESC') -> Dict[str, Any]:
        conditions = {}
        if status:
            conditions['status'] = status
        if difficulty:
            conditions['difficulty'] = difficulty
        if is_checked is not None:
            conditions['is_checked'] = is_checked

        if keyword:
            return self.search(keyword, page, page_size, status, difficulty, is_checked, order_by)

        return self.query.paginate(page, page_size, conditions, order_by=order_by)

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               status: str = None, difficulty: str = None,
               is_checked: int = None, order_by: str = 'meeting_time DESC') -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if status:
            where_clauses.append("status = ?")
            params.append(status)

        if difficulty:
            where_clauses.append("difficulty = ?")
            params.append(difficulty)

        if is_checked is not None:
            where_clauses.append("is_checked = ?")
            params.append(is_checked)

        where_clauses.append("(title LIKE ? OR route LIKE ? OR meeting_point LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern, like_pattern])

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY {order_by}
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

    def get_status_text(self, status: str) -> str:
        return status or '未知'

    def get_difficulty_text(self, difficulty: str) -> str:
        return difficulty or '未知'

    def to_dict(self, activity: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': activity.get('id'),
            'leader_id': activity.get('leader_id'),
            'title': activity.get('title'),
            'route': activity.get('route'),
            'distance': activity.get('distance'),
            'elevation': activity.get('elevation'),
            'pace': activity.get('pace'),
            'difficulty': activity.get('difficulty'),
            'difficulty_text': self.get_difficulty_text(activity.get('difficulty')),
            'meeting_time': activity.get('meeting_time'),
            'meeting_point': activity.get('meeting_point'),
            'meeting_lng': activity.get('meeting_lng'),
            'meeting_lat': activity.get('meeting_lat'),
            'max_people': activity.get('max_people'),
            'current_people': activity.get('current_people'),
            'cost': activity.get('cost'),
            'description': activity.get('description'),
            'status': activity.get('status'),
            'status_text': self.get_status_text(activity.get('status')),
            'is_checked': activity.get('is_checked'),
            'created_at': activity.get('created_at'),
            'updated_at': activity.get('updated_at')
        }
