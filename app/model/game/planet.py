from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class PlanetModel:
    TABLE_NAME = 'tb_game_planet'

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
                description TEXT DEFAULT '',
                faction TEXT NOT NULL DEFAULT 'neutral',
                pos_x REAL NOT NULL DEFAULT 0,
                pos_y REAL NOT NULL DEFAULT 0,
                polygon_color TEXT NOT NULL DEFAULT '#4a90d9',
                size INTEGER NOT NULL DEFAULT 30,
                has_shop INTEGER NOT NULL DEFAULT 1,
                has_mission_board INTEGER NOT NULL DEFAULT 1,
                has_repair INTEGER NOT NULL DEFAULT 1,
                danger_level INTEGER NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

    @classmethod
    def seed_data(cls):
        model = cls()
        if model.query.count() > 0:
            return
        planets = [
            {'name': '新伊甸空间站', 'description': '银河系边缘的走私者天堂，各种灰色交易的集散地。', 'faction': 'neutral',
             'pos_x': 50, 'pos_y': 50, 'polygon_color': '#6c7a89', 'size': 35, 'danger_level': 1},
            {'name': '天狼星军事港', 'description': '联邦正规军的前哨基地，严格的军事管制区域。', 'faction': 'military',
             'pos_x': 20, 'pos_y': 25, 'polygon_color': '#2e86de', 'size': 40, 'danger_level': 2},
            {'name': '暗礁海盗据点', 'description': '臭名昭著的海盗巢穴，小心行事。', 'faction': 'pirate',
             'pos_x': 78, 'pos_y': 72, 'polygon_color': '#e74c3c', 'size': 32, 'danger_level': 5},
            {'name': '织女科研站', 'description': '前沿科技研究基地，出售稀有装备。', 'faction': 'corporate',
             'pos_x': 15, 'pos_y': 70, 'polygon_color': '#9b59b6', 'size': 28, 'danger_level': 1},
            {'name': '猎户矿场', 'description': '富含稀有矿物的采矿殖民地。', 'faction': 'corporate',
             'pos_x': 85, 'pos_y': 30, 'polygon_color': '#f39c12', 'size': 38, 'danger_level': 3},
            {'name': '自由港', 'description': '无主之地，谁有枪谁说了算。', 'faction': 'neutral',
             'pos_x': 45, 'pos_y': 85, 'polygon_color': '#16a085', 'size': 30, 'danger_level': 4},
            {'name': '废墟站-7', 'description': '被遗弃的空间站，传闻藏有失落的科技。', 'faction': 'ruin',
             'pos_x': 65, 'pos_y': 10, 'polygon_color': '#7f8c8d', 'size': 25, 'danger_level': 5},
        ]
        for p in planets:
            model.create(**p)

    def create(self, name: str, description: str = '', faction: str = 'neutral',
               pos_x: float = 0, pos_y: float = 0, polygon_color: str = '#4a90d9',
               size: int = 30, has_shop: int = 1, has_mission_board: int = 1,
               has_repair: int = 1, danger_level: int = 1) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'faction': faction,
            'pos_x': pos_x,
            'pos_y': pos_y,
            'polygon_color': polygon_color,
            'size': size,
            'has_shop': has_shop,
            'has_mission_board': has_mission_board,
            'has_repair': has_repair,
            'danger_level': danger_level,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id ASC')

    def get_by_faction(self, faction: str) -> List[Dict[str, Any]]:
        return self.query.find_all_by_field('faction', faction)

    def update(self, record_id: int, **kwargs) -> int:
        data = {}
        for key, value in kwargs.items():
            if value is not None:
                data[key] = value
        if not data:
            return 0
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()
