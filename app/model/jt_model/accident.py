from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class AccidentModel:
    TABLE_NAME = 'tb_jt_model_accident'

    TYPE_COLLISION = 'collision'
    TYPE_BREAKDOWN = 'breakdown'
    TYPE_SPILL = 'spill'
    TYPE_CONSTRUCTION = 'construction'

    SEVERITY_MINOR = 1
    SEVERITY_MODERATE = 2
    SEVERITY_MAJOR = 3

    STATUS_ACTIVE = 'active'
    STATUS_RESPONDING = 'responding'
    STATUS_RESOLVED = 'resolved'

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
                city_id INTEGER NOT NULL,
                road_id INTEGER,
                accident_type TEXT DEFAULT 'collision',
                severity INTEGER DEFAULT 1,
                position_x REAL DEFAULT 0,
                position_y REAL DEFAULT 0,
                description TEXT DEFAULT '',
                status TEXT DEFAULT 'active',
                response_time INTEGER DEFAULT 0,
                resolved_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_city_id ON {cls.TABLE_NAME}(city_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_road_id ON {cls.TABLE_NAME}(road_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, city_id: int, road_id: int = None, accident_type: str = 'collision',
               severity: int = 1, position_x: float = 0, position_y: float = 0,
               description: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'city_id': city_id,
            'road_id': road_id,
            'accident_type': accident_type,
            'severity': severity,
            'position_x': position_x,
            'position_y': position_y,
            'description': description,
            'status': self.STATUS_ACTIVE,
            'response_time': 0,
            'resolved_at': None,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_active_by_city_id(self, city_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(
            {'city_id': city_id, 'status': self.STATUS_ACTIVE},
            order_by='severity DESC, created_at DESC'
        )

    def resolve(self, accident_id: int, response_time: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_RESOLVED,
            'response_time': response_time,
            'resolved_at': now,
            'updated_at': now
        }
        return self.exec.update_by_id(accident_id, data)

    def update(self, accident_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'road_id', 'accident_type', 'severity', 'position_x',
            'position_y', 'description', 'status', 'response_time',
            'resolved_at'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(accident_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_by_city_id(self, city_id: int, page: int = 1, page_size: int = 10,
                       status: str = None) -> Dict[str, Any]:
        conditions = {'city_id': city_id}
        if status:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_accident_type_text(self, accident_type: str) -> str:
        type_map = {
            self.TYPE_COLLISION: '碰撞事故',
            self.TYPE_BREAKDOWN: '车辆故障',
            self.TYPE_SPILL: '洒漏事故',
            self.TYPE_CONSTRUCTION: '施工事故'
        }
        return type_map.get(accident_type, '未知')

    def get_severity_text(self, severity: int) -> str:
        severity_map = {
            self.SEVERITY_MINOR: '轻微',
            self.SEVERITY_MODERATE: '中等',
            self.SEVERITY_MAJOR: '严重'
        }
        return severity_map.get(severity, '未知')

    def get_status_text(self, status: str) -> str:
        status_map = {
            self.STATUS_ACTIVE: '发生中',
            self.STATUS_RESPONDING: '处理中',
            self.STATUS_RESOLVED: '已解决'
        }
        return status_map.get(status, '未知')
