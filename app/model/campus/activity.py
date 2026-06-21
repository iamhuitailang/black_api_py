from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ActivityModel:
    TABLE_NAME = 'tb_campus_activity'

    STATUS_PENDING = 0
    STATUS_APPROVED = 1
    STATUS_REJECTED = 2
    STATUS_CANCELLED = 3
    STATUS_COMPLETED = 4
    STATUS_SUMMARY_SUBMITTED = 5

    TYPE_ACADEMIC = 'academic'
    TYPE_CULTURE = 'culture'
    TYPE_CLUB = 'club'
    TYPE_VOLUNTEER = 'volunteer'

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
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                description TEXT,
                venue_id INTEGER NOT NULL,
                venue_name TEXT,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP NOT NULL,
                expected_count INTEGER DEFAULT 50,
                organizer_id INTEGER,
                organizer_name TEXT,
                organizer_department TEXT,
                contact_person TEXT,
                contact_phone TEXT,
                plan_file TEXT,
                status INTEGER DEFAULT 0,
                reject_reason TEXT,
                cancel_reason TEXT,
                semester TEXT,
                approval_remark TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sqls = [
            f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)",
            f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)",
            f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_venue ON {cls.TABLE_NAME}(venue_id)",
            f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_start_time ON {cls.TABLE_NAME}(start_time)",
            f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_organizer ON {cls.TABLE_NAME}(organizer_id)",
            f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_semester ON {cls.TABLE_NAME}(semester)"
        ]
        for idx_sql in index_sqls:
            db.execute(idx_sql)

        cls._seed_initial_data()

    @classmethod
    def _seed_initial_data(cls):
        model = cls()
        if model.query.count() > 0:
            return

        today = datetime.now()
        base = today.replace(hour=0, minute=0, second=0, microsecond=0)

        def make_activity(offset_days, start_h, end_h, name, atype, venue_id, venue_name, count=80):
            st = base + timedelta(days=offset_days, hours=start_h)
            et = base + timedelta(days=offset_days, hours=end_h)
            sem = f"{today.year}-{today.year + 1}-{'1' if today.month >= 9 or today.month <= 2 else '2'}"
            return {
                'name': name,
                'type': atype,
                'description': f'{name}活动，欢迎广大师生参与。',
                'venue_id': venue_id,
                'venue_name': venue_name,
                'start_time': st.isoformat(),
                'end_time': et.isoformat(),
                'expected_count': count,
                'organizer_id': 1,
                'organizer_name': '学生会',
                'organizer_department': '计算机学院',
                'contact_person': '张同学',
                'contact_phone': '13800138000',
                'plan_file': '',
                'status': cls.STATUS_APPROVED,
                'semester': sem,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }

        seeds = [
            make_activity(1, 14, 16, '人工智能前沿技术讲座', cls.TYPE_ACADEMIC, 1, '学术报告厅A', 200),
            make_activity(2, 9, 11, '新生篮球赛决赛', cls.TYPE_CULTURE, 3, '多功能体育馆', 500),
            make_activity(3, 19, 21, '吉他社年度汇报演出', cls.TYPE_CLUB, 4, '学生活动中心', 300),
            make_activity(5, 13, 17, '社区敬老志愿服务', cls.TYPE_VOLUNTEER, 10, '志愿服务基地', 60),
            make_activity(7, 14, 16, '大数据与云计算学术研讨会', cls.TYPE_ACADEMIC, 7, '图书馆报告厅', 120),
            make_activity(8, 18, 20, '校园歌手大赛', cls.TYPE_CULTURE, 4, '学生活动中心', 400),
            make_activity(10, 14, 16, '摄影社作品展', cls.TYPE_CLUB, 5, '第一会议室', 40),
            make_activity(12, 9, 12, '环保志愿者招募活动', cls.TYPE_VOLUNTEER, 10, '志愿服务基地', 80),
            make_activity(-2, 14, 16, '机器学习入门讲座', cls.TYPE_ACADEMIC, 8, '阶梯教室101', 100),
            make_activity(-5, 19, 21, '舞蹈社展演', cls.TYPE_CLUB, 4, '学生活动中心', 350)
        ]
        model.exec.insert_many(seeds)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        data['updated_at'] = now
        if 'status' not in data:
            data['status'] = self.STATUS_PENDING
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        data['updated_at'] = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def find_approved_in_range(self, start: str, end: str) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE status IN (?, ?) AND start_time < ? AND end_time > ?
            ORDER BY start_time ASC
        """
        return self.query.query_raw(sql, (self.STATUS_APPROVED, self.STATUS_COMPLETED, end, start))

    def find_conflicts(self, venue_id: int, start_time: str, end_time: str, exclude_id: int = None) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE venue_id = ? AND status IN (?, ?) AND start_time < ? AND end_time > ?
        """
        params = [venue_id, self.STATUS_APPROVED, self.STATUS_PENDING, end_time, start_time]
        if exclude_id:
            sql += " AND id != ?"
            params.append(exclude_id)
        sql += " ORDER BY start_time ASC"
        return self.query.query_raw(sql, tuple(params))

    def paginate(self, page: int = 1, page_size: int = 10, status: int = None,
                 activity_type: str = None, department: str = None,
                 semester: str = None, keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE 1=1"
        params = []

        if status is not None:
            sql += " AND status = ?"
            params.append(status)
        if activity_type:
            sql += " AND type = ?"
            params.append(activity_type)
        if department:
            sql += " AND organizer_department = ?"
            params.append(department)
        if semester:
            sql += " AND semester = ?"
            params.append(semester)
        if keyword:
            sql += " AND (name LIKE ? OR description LIKE ?)"
            params.extend([f'%{keyword}%', f'%{keyword}%'])

        sql += " ORDER BY start_time DESC"

        count_sql = sql.replace('SELECT *', 'SELECT COUNT(*) as total')
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        offset = (page - 1) * page_size
        sql += f" LIMIT {page_size} OFFSET {offset}"
        items = self.query.query_raw(sql, tuple(params))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }
