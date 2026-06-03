from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class SignalModel:
    TABLE_NAME = 'tb_jt_model_signal'

    TYPE_FIXED = 'fixed'
    TYPE_ADAPTIVE = 'adaptive'
    TYPE_PEDESTRIAN = 'pedestrian'

    STATE_RED = 'red'
    STATE_GREEN = 'green'
    STATE_YELLOW = 'yellow'

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
                position_x REAL DEFAULT 0,
                position_y REAL DEFAULT 0,
                signal_type TEXT DEFAULT 'fixed',
                red_duration INTEGER DEFAULT 30,
                green_duration INTEGER DEFAULT 30,
                yellow_duration INTEGER DEFAULT 5,
                current_state TEXT DEFAULT 'red',
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_city_id ON {cls.TABLE_NAME}(city_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_road_id ON {cls.TABLE_NAME}(road_id)"
        db.execute(index_sql)

    def create(self, city_id: int, road_id: int = None, position_x: float = 0,
               position_y: float = 0, signal_type: str = 'fixed',
               red_duration: int = 30, green_duration: int = 30,
               yellow_duration: int = 5) -> int:
        now = datetime.now().isoformat()
        data = {
            'city_id': city_id,
            'road_id': road_id,
            'position_x': position_x,
            'position_y': position_y,
            'signal_type': signal_type,
            'red_duration': red_duration,
            'green_duration': green_duration,
            'yellow_duration': yellow_duration,
            'current_state': self.STATE_RED,
            'is_active': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_city_id(self, city_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'city_id': city_id}, order_by='id ASC')

    def update_state(self, signal_id: int, current_state: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'current_state': current_state,
            'updated_at': now
        }
        return self.exec.update_by_id(signal_id, data)

    def update(self, signal_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'road_id', 'position_x', 'position_y', 'signal_type',
            'red_duration', 'green_duration', 'yellow_duration',
            'current_state', 'is_active'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(signal_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_signal_type_text(self, signal_type: str) -> str:
        type_map = {
            self.TYPE_FIXED: '固定配时',
            self.TYPE_ADAPTIVE: '自适应',
            self.TYPE_PEDESTRIAN: '行人信号'
        }
        return type_map.get(signal_type, '未知')

    def get_state_text(self, state: str) -> str:
        state_map = {
            self.STATE_RED: '红灯',
            self.STATE_GREEN: '绿灯',
            self.STATE_YELLOW: '黄灯'
        }
        return state_map.get(state, '未知')
