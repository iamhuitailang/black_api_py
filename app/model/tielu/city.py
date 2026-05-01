from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TieluCityModel:
    TABLE_NAME = 'tb_tielu_cities'

    DEFAULT_CITIES = [
        {'name': '起点镇', 'unlocked': True, 'station_level': 1, 'distance': 0, 'goods_type': '木材', 'unlock_cost': 0, 'emoji': '🏘️'},
        {'name': '铁矿镇', 'unlocked': False, 'station_level': 1, 'distance': 100, 'goods_type': '铁矿', 'unlock_cost': 500, 'emoji': '⛏️'},
        {'name': '粮仓市', 'unlocked': False, 'station_level': 1, 'distance': 200, 'goods_type': '粮食', 'unlock_cost': 800, 'emoji': '🌾'},
        {'name': '工业城', 'unlocked': False, 'station_level': 1, 'distance': 350, 'goods_type': '机械零件', 'unlock_cost': 1500, 'emoji': '⚙️'},
        {'name': '钻石港', 'unlocked': False, 'station_level': 1, 'distance': 500, 'goods_type': '钻石', 'unlock_cost': 3000, 'emoji': '💎'},
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
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                emoji TEXT DEFAULT '',
                unlocked INTEGER DEFAULT 0,
                station_level INTEGER DEFAULT 1,
                distance INTEGER DEFAULT 0,
                goods_type TEXT DEFAULT '',
                unlock_cost INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_name ON {cls.TABLE_NAME}(name)"
        db.execute(index_sql2)

    def init_user_cities(self, user_id: int) -> int:
        existing = self.query.find_one({'user_id': user_id, 'name': '起点镇'})
        if existing:
            return 0

        now = datetime.now().isoformat()
        cities_data = []
        for city in self.DEFAULT_CITIES:
            cities_data.append({
                'user_id': user_id,
                'name': city['name'],
                'emoji': city['emoji'],
                'unlocked': 1 if city['unlocked'] else 0,
                'station_level': city['station_level'],
                'distance': city['distance'],
                'goods_type': city['goods_type'],
                'unlock_cost': city['unlock_cost'],
                'created_at': now,
                'updated_at': now
            })

        return self.exec.insert_many(cities_data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='distance ASC')

    def get_by_name(self, user_id: int, name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'name': name})

    def get_unlocked_cities(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id, 'unlocked': 1}, order_by='distance ASC')

    def unlock_city(self, user_id: int, city_name: str) -> Dict[str, Any]:
        city = self.get_by_name(user_id, city_name)
        if not city:
            return {'success': False, 'msg': '城市不存在'}

        if city.get('unlocked', 0) == 1:
            return {'success': False, 'msg': '该城市已解锁'}

        now = datetime.now().isoformat()
        data = {
            'unlocked': 1,
            'updated_at': now
        }
        affected = self.exec.update_by_id(city.get('id'), data)

        if affected > 0:
            return {
                'success': True,
                'msg': f'{city_name} 解锁成功',
                'city': city_name
            }

        return {'success': False, 'msg': '解锁失败'}

    def upgrade_station(self, user_id: int, city_name: str) -> Dict[str, Any]:
        city = self.get_by_name(user_id, city_name)
        if not city:
            return {'success': False, 'msg': '城市不存在'}

        if city.get('unlocked', 0) != 1:
            return {'success': False, 'msg': '请先解锁该城市'}

        current_level = city.get('station_level', 1)
        if current_level >= 4:
            return {'success': False, 'msg': '车站已达到最高等级'}

        upgrade_costs = {
            1: 1000,
            2: 2000,
            3: 3000,
            4: 4000
        }
        cost = upgrade_costs.get(current_level, 1000)

        now = datetime.now().isoformat()
        data = {
            'station_level': current_level + 1,
            'updated_at': now
        }
        self.exec.update_by_id(city.get('id'), data)

        return {
            'success': True,
            'msg': '车站升级成功',
            'old_level': current_level,
            'new_level': current_level + 1,
            'cost': cost
        }

    def to_public_dict(self, city: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': city.get('id'),
            'user_id': city.get('user_id'),
            'name': city.get('name'),
            'emoji': city.get('emoji'),
            'unlocked': city.get('unlocked') == 1,
            'station_level': city.get('station_level'),
            'distance': city.get('distance'),
            'goods_type': city.get('goods_type'),
            'unlock_cost': city.get('unlock_cost')
        }
