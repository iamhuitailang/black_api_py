from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ActivityModel:
    TABLE_NAME = 'tb_yeyou_activities'

    TYPE_HIKE = 'hike'
    TYPE_CAMP = 'camp'
    TYPE_CYCLE = 'cycle'
    TYPE_PICNIC = 'picnic'
    TYPE_CLIMB = 'climb'

    DIFFICULTY_BEGINNER = 'beginner'
    DIFFICULTY_INTERMEDIATE = 'intermediate'
    DIFFICULTY_ADVANCED = 'advanced'

    STATUS_RECRUITING = 'recruiting'
    STATUS_FULL = 'full'
    STATUS_ONGOING = 'ongoing'
    STATUS_FINISHED = 'finished'
    STATUS_CANCELLED = 'cancelled'

    COST_FREE = 'free'
    COST_AA = 'aa'
    COST_PAID = 'paid'

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
                organizer_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                type TEXT NOT NULL,
                difficulty TEXT NOT NULL,
                start_time TIMESTAMP NOT NULL,
                location TEXT NOT NULL,
                location_lng DECIMAL(10,7),
                location_lat DECIMAL(10,7),
                meeting_point TEXT DEFAULT '',
                max_people INTEGER DEFAULT 10,
                current_people INTEGER DEFAULT 0,
                cost_type TEXT DEFAULT 'free',
                cost_amount DECIMAL(10,2) DEFAULT 0.00,
                route_desc TEXT DEFAULT '',
                route_images TEXT DEFAULT '[]',
                status TEXT DEFAULT 'recruiting',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_organizer ON {cls.TABLE_NAME}(organizer_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_start_time ON {cls.TABLE_NAME}(start_time)"
        db.execute(index_sql)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        insert_data = {
            'organizer_id': data.get('organizer_id'),
            'title': data.get('title'),
            'type': data.get('type', self.TYPE_HIKE),
            'difficulty': data.get('difficulty', self.DIFFICULTY_BEGINNER),
            'start_time': data.get('start_time'),
            'location': data.get('location'),
            'location_lng': data.get('location_lng'),
            'location_lat': data.get('location_lat'),
            'meeting_point': data.get('meeting_point', ''),
            'max_people': data.get('max_people', 10),
            'current_people': 0,
            'cost_type': data.get('cost_type', self.COST_FREE),
            'cost_amount': data.get('cost_amount', 0.00),
            'route_desc': data.get('route_desc', ''),
            'route_images': data.get('route_images', '[]'),
            'status': self.STATUS_RECRUITING,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(insert_data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'title', 'type', 'difficulty', 'start_time', 'location',
            'location_lng', 'location_lat', 'meeting_point', 'max_people',
            'cost_type', 'cost_amount', 'route_desc', 'route_images', 'status'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def update_status(self, record_id: int, status: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def update_people_count(self, record_id: int, delta: int) -> int:
        activity = self.get_by_id(record_id)
        if not activity:
            return 0

        current = activity.get('current_people', 0) or 0
        max_people = activity.get('max_people', 10) or 10
        new_count = max(0, min(max_people, current + delta))

        data = {'current_people': new_count}
        if new_count >= max_people:
            data['status'] = self.STATUS_FULL
        elif new_count < max_people and activity.get('status') == self.STATUS_FULL:
            data['status'] = self.STATUS_RECRUITING

        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_list(self, page: int = 1, page_size: int = 10,
                 activity_type: str = None, status: str = None,
                 difficulty: str = None, keyword: str = None,
                 organizer_id: int = None) -> Dict[str, Any]:
        conditions = {}
        if activity_type:
            conditions['type'] = activity_type
        if status:
            conditions['status'] = status
        if difficulty:
            conditions['difficulty'] = difficulty
        if organizer_id:
            conditions['organizer_id'] = organizer_id

        if keyword:
            return self.search(keyword, page, page_size, activity_type, status, difficulty, organizer_id)

        return self.query.paginate(page, page_size, conditions, order_by='start_time DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               activity_type: str = None, status: str = None,
               difficulty: str = None, organizer_id: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if activity_type:
            where_clauses.append("type = ?")
            params.append(activity_type)
        if status:
            where_clauses.append("status = ?")
            params.append(status)
        if difficulty:
            where_clauses.append("difficulty = ?")
            params.append(difficulty)
        if organizer_id:
            where_clauses.append("organizer_id = ?")
            params.append(organizer_id)

        where_clauses.append("(title LIKE ? OR location LIKE ? OR route_desc LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern, like_pattern])

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY start_time DESC 
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

    def get_type_text(self, activity_type: str) -> str:
        type_map = {
            self.TYPE_HIKE: '徒步',
            self.TYPE_CAMP: '露营',
            self.TYPE_CYCLE: '骑行',
            self.TYPE_PICNIC: '野餐',
            self.TYPE_CLIMB: '攀岩',
        }
        return type_map.get(activity_type, '其他')

    def get_type_icon(self, activity_type: str) -> str:
        icon_map = {
            self.TYPE_HIKE: '🥾',
            self.TYPE_CAMP: '🏕️',
            self.TYPE_CYCLE: '🚴',
            self.TYPE_PICNIC: '🧺',
            self.TYPE_CLIMB: '🧗',
        }
        return icon_map.get(activity_type, '🎒')

    def get_difficulty_text(self, difficulty: str) -> str:
        difficulty_map = {
            self.DIFFICULTY_BEGINNER: '初级',
            self.DIFFICULTY_INTERMEDIATE: '中级',
            self.DIFFICULTY_ADVANCED: '高级',
        }
        return difficulty_map.get(difficulty, '初级')

    def get_status_text(self, status: str) -> str:
        status_map = {
            self.STATUS_RECRUITING: '招募中',
            self.STATUS_FULL: '已满',
            self.STATUS_ONGOING: '进行中',
            self.STATUS_FINISHED: '已结束',
            self.STATUS_CANCELLED: '已取消',
        }
        return status_map.get(status, '未知')

    def get_cost_type_text(self, cost_type: str) -> str:
        cost_map = {
            self.COST_FREE: '免费',
            self.COST_AA: 'AA',
            self.COST_PAID: '付费',
        }
        return cost_map.get(cost_type, '免费')

    def to_public_dict(self, activity: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': activity.get('id'),
            'organizer_id': activity.get('organizer_id'),
            'title': activity.get('title'),
            'type': activity.get('type'),
            'type_text': self.get_type_text(activity.get('type')),
            'type_icon': self.get_type_icon(activity.get('type')),
            'difficulty': activity.get('difficulty'),
            'difficulty_text': self.get_difficulty_text(activity.get('difficulty')),
            'start_time': activity.get('start_time'),
            'location': activity.get('location'),
            'location_lng': activity.get('location_lng'),
            'location_lat': activity.get('location_lat'),
            'meeting_point': activity.get('meeting_point'),
            'max_people': activity.get('max_people'),
            'current_people': activity.get('current_people'),
            'cost_type': activity.get('cost_type'),
            'cost_type_text': self.get_cost_type_text(activity.get('cost_type')),
            'cost_amount': activity.get('cost_amount'),
            'route_desc': activity.get('route_desc'),
            'route_images': activity.get('route_images', '[]'),
            'status': activity.get('status'),
            'status_text': self.get_status_text(activity.get('status')),
            'created_at': activity.get('created_at')
        }
