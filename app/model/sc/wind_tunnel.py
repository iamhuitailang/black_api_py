from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ScWindTunnelModel:
    TABLE_NAME = 'tb_sc_model_wind_tunnel'

    TEST_TYPE_DRAG = 'drag'
    TEST_TYPE_DOWNFORCE = 'downforce'
    TEST_TYPE_BALANCE = 'balance'

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
                user_id INTEGER NOT NULL,
                car_id INTEGER NOT NULL,
                test_type TEXT NOT NULL DEFAULT 'drag',
                drag_coefficient REAL DEFAULT 0.0,
                downforce REAL DEFAULT 0.0,
                balance_score REAL DEFAULT 0.0,
                front_downforce REAL DEFAULT 0.0,
                rear_downforce REAL DEFAULT 0.0,
                top_speed_estimate REAL DEFAULT 0.0,
                test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_car_id ON {cls.TABLE_NAME}(car_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_test_type ON {cls.TABLE_NAME}(test_type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_test_date ON {cls.TABLE_NAME}(test_date)"
        db.execute(index_sql)

    def create(self, user_id: int, car_id: int, test_type: str,
               drag_coefficient: float = 0.0, downforce: float = 0.0,
               balance_score: float = 0.0, front_downforce: float = 0.0,
               rear_downforce: float = 0.0, top_speed_estimate: float = 0.0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'car_id': car_id,
            'test_type': test_type,
            'drag_coefficient': drag_coefficient,
            'downforce': downforce,
            'balance_score': balance_score,
            'front_downforce': front_downforce,
            'rear_downforce': rear_downforce,
            'top_speed_estimate': top_speed_estimate,
            'test_date': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='test_date DESC')

    def get_by_car_id(self, car_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'car_id': car_id}, order_by='test_date DESC')

    def get_latest_by_car(self, car_id: int, test_type: str = None) -> Optional[Dict[str, Any]]:
        conditions = {'car_id': car_id}
        if test_type:
            conditions['test_type'] = test_type
        results = self.query.find_all(conditions, order_by='test_date DESC', limit=1)
        return results[0] if results else None

    def get_all(self, page: int = 1, page_size: int = 10,
                user_id: int = None, car_id: int = None,
                test_type: str = None) -> Dict[str, Any]:
        conditions = {}
        if user_id is not None:
            conditions['user_id'] = user_id
        if car_id is not None:
            conditions['car_id'] = car_id
        if test_type:
            conditions['test_type'] = test_type

        return self.query.paginate(page, page_size, conditions, order_by='test_date DESC')

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_test_type_text(self, test_type: str) -> str:
        type_map = {
            self.TEST_TYPE_DRAG: '风阻测试',
            self.TEST_TYPE_DOWNFORCE: '下压力测试',
            self.TEST_TYPE_BALANCE: '平衡性测试'
        }
        return type_map.get(test_type, '未知')
