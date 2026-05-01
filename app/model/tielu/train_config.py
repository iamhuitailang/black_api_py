from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TieluTrainConfigModel:
    TABLE_NAME = 'tb_tielu_train_config'

    DEFAULT_TRAINS = [
        {'name': '蒸汽机车', 'emoji': '🚂', 'price': 300, 'speed': 60, 'capacity': 10, 
         'fuel_type': '煤', 'fuel_cost': 3, 'min_level': 1, 'description': '经典蒸汽动力，适合初期运营'},
        {'name': '内燃机车', 'emoji': '🚄', 'price': 800, 'speed': 100, 'capacity': 20, 
         'fuel_type': '燃油', 'fuel_cost': 5, 'min_level': 5, 'description': '柴油动力，速度更快载货更多'},
        {'name': '电力机车', 'emoji': '🚅', 'price': 2000, 'speed': 150, 'capacity': 35, 
         'fuel_type': '电', 'fuel_cost': 8, 'min_level': 10, 'description': '电力驱动，高效环保运力强'},
        {'name': '磁悬浮', 'emoji': '🚝', 'price': 5000, 'speed': 250, 'capacity': 50, 
         'fuel_type': '电', 'fuel_cost': 12, 'min_level': 15, 'description': '科技巅峰，极速运输'},
    ]

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
                name TEXT NOT NULL UNIQUE,
                emoji TEXT DEFAULT '',
                price INTEGER DEFAULT 0,
                speed INTEGER DEFAULT 0,
                capacity INTEGER DEFAULT 0,
                fuel_type TEXT DEFAULT '',
                fuel_cost INTEGER DEFAULT 0,
                min_level INTEGER DEFAULT 1,
                description TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_name ON {cls.TABLE_NAME}(name)"
        db.execute(index_sql)

    @classmethod
    def init_default_data(cls):
        model = TieluTrainConfigModel()
        existing = model.query.count()
        if existing > 0:
            return

        now = datetime.now().isoformat()
        trains_data = []
        for train in cls.DEFAULT_TRAINS:
            trains_data.append({
                'name': train['name'],
                'emoji': train['emoji'],
                'price': train['price'],
                'speed': train['speed'],
                'capacity': train['capacity'],
                'fuel_type': train['fuel_type'],
                'fuel_cost': train['fuel_cost'],
                'min_level': train['min_level'],
                'description': train['description'],
                'created_at': now
            })

        model.exec.insert_many(trains_data)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='min_level ASC')

    def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'name': name})

    def get_available_for_level(self, level: int) -> List[Dict[str, Any]]:
        all_trains = self.get_all()
        return [t for t in all_trains if t.get('min_level', 1) <= level]

    def to_public_dict(self, train: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': train.get('id'),
            'name': train.get('name'),
            'emoji': train.get('emoji'),
            'price': train.get('price'),
            'speed': train.get('speed'),
            'capacity': train.get('capacity'),
            'fuel_type': train.get('fuel_type'),
            'fuel_cost': train.get('fuel_cost'),
            'min_level': train.get('min_level'),
            'description': train.get('description')
        }
