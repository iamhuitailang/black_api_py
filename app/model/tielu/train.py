from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class TieluTrainModel:
    TABLE_NAME = 'tb_tielu_trains'

    STATUS_IDLE = 'idle'
    STATUS_MOVING = 'moving'
    STATUS_MAINTENANCE = 'maintenance'

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
                train_type TEXT NOT NULL,
                level INTEGER DEFAULT 1,
                status TEXT DEFAULT 'idle',
                current_city TEXT DEFAULT '起点镇',
                destination TEXT DEFAULT NULL,
                cargo TEXT DEFAULT '[]',
                departure_time TIMESTAMP DEFAULT NULL,
                estimated_arrival TIMESTAMP DEFAULT NULL,
                fuel_consumed INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql2)

    def create(self, user_id: int, train_type: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'train_type': train_type,
            'level': 1,
            'status': self.STATUS_IDLE,
            'current_city': '起点镇',
            'destination': None,
            'cargo': '[]',
            'departure_time': None,
            'estimated_arrival': None,
            'fuel_consumed': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='id DESC')

    def get_by_user_and_status(self, user_id: int, status: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id, 'status': status}, order_by='id DESC')

    def update_status(self, train_id: int, status: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(train_id, data)

    def update_location(self, train_id: int, current_city: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'current_city': current_city,
            'updated_at': now
        }
        return self.exec.update_by_id(train_id, data)

    def start_journey(self, train_id: int, destination: str, cargo: List[Dict], 
                      estimated_arrival: datetime) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_MOVING,
            'destination': destination,
            'cargo': json.dumps(cargo, ensure_ascii=False),
            'departure_time': now,
            'estimated_arrival': estimated_arrival.isoformat() if estimated_arrival else None,
            'updated_at': now
        }
        return self.exec.update_by_id(train_id, data)

    def complete_journey(self, train_id: int) -> Dict[str, Any]:
        train = self.get_by_id(train_id)
        if not train:
            return {'success': False, 'msg': '火车不存在'}

        cargo_json = train.get('cargo', '[]')
        try:
            cargo = json.loads(cargo_json) if cargo_json else []
        except:
            cargo = []

        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_IDLE,
            'current_city': train.get('destination', '起点镇'),
            'destination': None,
            'cargo': '[]',
            'departure_time': None,
            'estimated_arrival': None,
            'updated_at': now
        }
        self.exec.update_by_id(train_id, data)

        return {
            'success': True,
            'msg': '行程完成',
            'cargo': cargo,
            'destination': train.get('destination')
        }

    def set_cargo(self, train_id: int, cargo: List[Dict]) -> int:
        now = datetime.now().isoformat()
        data = {
            'cargo': json.dumps(cargo, ensure_ascii=False),
            'updated_at': now
        }
        return self.exec.update_by_id(train_id, data)

    def add_level(self, train_id: int) -> Dict[str, Any]:
        train = self.get_by_id(train_id)
        if not train:
            return {'success': False, 'msg': '火车不存在'}

        current_level = train.get('level', 1)
        if current_level >= 10:
            return {'success': False, 'msg': '已达到最高等级'}

        now = datetime.now().isoformat()
        data = {
            'level': current_level + 1,
            'updated_at': now
        }
        self.exec.update_by_id(train_id, data)

        return {
            'success': True,
            'msg': '火车升级成功',
            'old_level': current_level,
            'new_level': current_level + 1
        }

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_moving_trains(self) -> List[Dict[str, Any]]:
        return self.query.find_all({'status': self.STATUS_MOVING}, order_by='estimated_arrival ASC')

    def to_public_dict(self, train: Dict[str, Any]) -> Dict[str, Any]:
        cargo_json = train.get('cargo', '[]')
        try:
            cargo = json.loads(cargo_json) if cargo_json else []
        except:
            cargo = []

        return {
            'id': train.get('id'),
            'user_id': train.get('user_id'),
            'train_type': train.get('train_type'),
            'level': train.get('level'),
            'status': train.get('status'),
            'current_city': train.get('current_city'),
            'destination': train.get('destination'),
            'cargo': cargo,
            'departure_time': train.get('departure_time'),
            'estimated_arrival': train.get('estimated_arrival'),
            'created_at': train.get('created_at')
        }
