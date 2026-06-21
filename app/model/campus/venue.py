from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class VenueModel:
    TABLE_NAME = 'tb_campus_venue'

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
                location TEXT,
                capacity INTEGER DEFAULT 50,
                type TEXT DEFAULT '普通教室',
                equipment TEXT,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

        cls._seed_initial_data()

    @classmethod
    def _seed_initial_data(cls):
        model = cls()
        if model.query.count() == 0:
            venues = [
                {'name': '学术报告厅A', 'location': '行政楼1层', 'capacity': 300, 'type': '报告厅', 'equipment': '投影仪,音响,麦克风'},
                {'name': '学术报告厅B', 'location': '行政楼2层', 'capacity': 200, 'type': '报告厅', 'equipment': '投影仪,音响'},
                {'name': '多功能体育馆', 'location': '体育中心', 'capacity': 1000, 'type': '体育馆', 'equipment': '篮球架,羽毛球网,音响'},
                {'name': '学生活动中心', 'location': '东区1号楼', 'capacity': 500, 'type': '活动中心', 'equipment': '舞台,灯光,音响'},
                {'name': '第一会议室', 'location': '行政楼3层', 'capacity': 50, 'type': '会议室', 'equipment': '投影仪,白板'},
                {'name': '第二会议室', 'location': '行政楼3层', 'capacity': 30, 'type': '会议室', 'equipment': '投影仪,白板'},
                {'name': '图书馆报告厅', 'location': '图书馆B1层', 'capacity': 150, 'type': '报告厅', 'equipment': '投影仪,音响'},
                {'name': '阶梯教室101', 'location': '教学楼A座', 'capacity': 120, 'type': '教室', 'equipment': '投影仪,麦克风'},
                {'name': '阶梯教室201', 'location': '教学楼A座', 'capacity': 120, 'type': '教室', 'equipment': '投影仪,麦克风'},
                {'name': '志愿服务基地', 'location': '西区服务楼', 'capacity': 80, 'type': '活动室', 'equipment': '桌椅'}
            ]
            now = datetime.now().isoformat()
            for v in venues:
                v['created_at'] = now
                v['updated_at'] = now
            model.exec.insert_many(venues)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        data['updated_at'] = now
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self, status: int = None) -> List[Dict[str, Any]]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        return self.query.find_all(conditions, order_by='id ASC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        data['updated_at'] = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.update_by_id(record_id, {'status': 0, 'updated_at': datetime.now().isoformat()})
