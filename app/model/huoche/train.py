from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TrainModel:
    TABLE_NAME = 'tb_huoche_train'
    
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
                train_type_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                level INTEGER DEFAULT 1,
                experience INTEGER DEFAULT 0,
                speed_level INTEGER DEFAULT 1,
                capacity_level INTEGER DEFAULT 1,
                efficiency_level INTEGER DEFAULT 1,
                reliability_level INTEGER DEFAULT 1,
                current_condition REAL DEFAULT 100.0,
                total_distance REAL DEFAULT 0,
                total_passengers INTEGER DEFAULT 0,
                total_cargo REAL DEFAULT 0,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES tb_auth_user(id),
                FOREIGN KEY (train_type_id) REFERENCES tb_huoche_train_type(id)
            )
        """
        db.execute(sql)
        
        index_sql1 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql1)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_train_type_id ON {cls.TABLE_NAME}(train_type_id)"
        db.execute(index_sql2)

    def create(self, user_id: int, train_type_id: int, name: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'train_type_id': train_type_id,
            'name': name,
            'level': 1,
            'experience': 0,
            'speed_level': 1,
            'capacity_level': 1,
            'efficiency_level': 1,
            'reliability_level': 1,
            'current_condition': 100.0,
            'total_distance': 0,
            'total_passengers': 0,
            'total_cargo': 0,
            'status': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def has_train_type(self, user_id: int, train_type_id: int) -> bool:
        return self.query.exists({'user_id': user_id, 'train_type_id': train_type_id, 'status': 1})

    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id, 'status': 1}, order_by='level DESC')

    def get_user_train_with_type(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT t.*, tt.name as type_name, tt.type_code, tt.base_speed, tt.max_speed, 
                   tt.capacity as base_capacity, tt.fuel_efficiency, tt.reliability as base_reliability
            FROM {self.TABLE_NAME} t
            LEFT JOIN tb_huoche_train_type tt ON t.train_type_id = tt.id
            WHERE t.user_id = ? AND t.status = 1
            ORDER BY t.level DESC
        """
        return self.db.fetch_all(sql, (user_id,))

    def update_level(self, record_id: int, level: int) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, {'level': level, 'updated_at': now})

    def add_experience(self, record_id: int, exp: int) -> int:
        train = self.get_by_id(record_id)
        if train:
            new_exp = train.get('experience', 0) + exp
            now = datetime.now().isoformat()
            return self.exec.update_by_id(record_id, {'experience': new_exp, 'updated_at': now})
        return 0

    def upgrade_attribute(self, record_id: int, attribute: str) -> int:
        valid_attributes = ['speed_level', 'capacity_level', 'efficiency_level', 'reliability_level']
        if attribute not in valid_attributes:
            return 0
        train = self.get_by_id(record_id)
        if train:
            current_level = train.get(attribute, 1)
            if current_level >= 10:
                return 0
            now = datetime.now().isoformat()
            return self.exec.update_by_id(record_id, {attribute: current_level + 1, 'updated_at': now})
        return 0

    def update_condition(self, record_id: int, condition: float) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, {'current_condition': condition, 'updated_at': now})

    def add_stats(self, record_id: int, distance: float = 0, passengers: int = 0, cargo: float = 0) -> int:
        train = self.get_by_id(record_id)
        if train:
            now = datetime.now().isoformat()
            data = {
                'total_distance': train.get('total_distance', 0) + distance,
                'total_passengers': train.get('total_passengers', 0) + passengers,
                'total_cargo': train.get('total_cargo', 0) + cargo,
                'updated_at': now
            }
            return self.exec.update_by_id(record_id, data)
        return 0

    def delete(self, record_id: int) -> int:
        return self.exec.update_by_id(record_id, {'status': 0})
