from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TankeTankModel:
    TABLE_NAME = 'tb_tank_game_tank'

    BASE_HP = 3
    BASE_ATTACK = 1
    BASE_FIRE_RATE = 1000
    BASE_SPEED = 5
    BASE_BULLET_COUNT = 1

    SKIN_INFO = {
        1: {'name': '侦察坦克', 'min_level': 1, 'color': 'green', 'barrels': 1},
        2: {'name': '中型坦克', 'min_level': 5, 'color': 'blue', 'barrels': 2},
        3: {'name': '重型坦克', 'min_level': 10, 'color': 'red', 'barrels': 3},
        4: {'name': '虎式坦克', 'min_level': 15, 'color': 'gray', 'barrels': 3, 'armor': True},
        5: {'name': '未来坦克', 'min_level': 20, 'color': 'purple', 'barrels': 3, 'laser': True},
    }

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
                user_id INTEGER NOT NULL UNIQUE,
                level INTEGER DEFAULT 1,
                exp INTEGER DEFAULT 0,
                hp INTEGER DEFAULT 3,
                attack INTEGER DEFAULT 1,
                fire_rate INTEGER DEFAULT 1000,
                speed INTEGER DEFAULT 5,
                bullet_count INTEGER DEFAULT 1,
                skin_id INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)

    @classmethod
    def calculate_stats_by_level(cls, level: int) -> Dict[str, int]:
        return {
            'hp': cls.BASE_HP + (level - 1),
            'attack': cls.BASE_ATTACK,
            'fire_rate': max(200, cls.BASE_FIRE_RATE - (level - 1) * 200),
            'speed': cls.BASE_SPEED + (level - 1),
            'bullet_count': min(5, cls.BASE_BULLET_COUNT + (level - 1) // 5)
        }

    @classmethod
    def get_available_skin_id(cls, level: int) -> int:
        available_skins = [k for k, v in cls.SKIN_INFO.items() if v['min_level'] <= level]
        return max(available_skins) if available_skins else 1

    def create_default_for_user(self, user_id: int) -> int:
        stats = self.calculate_stats_by_level(1)
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'level': 1,
            'exp': 0,
            'hp': stats['hp'],
            'attack': stats['attack'],
            'fire_rate': stats['fire_rate'],
            'speed': stats['speed'],
            'bullet_count': stats['bullet_count'],
            'skin_id': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_user_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id})

    def get_or_create_for_user(self, user_id: int) -> Dict[str, Any]:
        tank = self.get_by_user_id(user_id)
        if not tank:
            self.create_default_for_user(user_id)
            tank = self.get_by_user_id(user_id)
        return tank

    def add_exp(self, user_id: int, exp: int) -> Dict[str, Any]:
        tank = self.get_by_user_id(user_id)
        if not tank:
            return {'level_up': False, 'new_level': 0}

        current_exp = tank.get('exp', 0) + exp
        current_level = tank.get('level', 1)

        exp_needed = current_level * 100
        level_up = False
        new_level = current_level

        while current_exp >= new_level * 100 and new_level < 20:
            current_exp -= new_level * 100
            new_level += 1
            level_up = True

        now = datetime.now().isoformat()
        if level_up:
            stats = self.calculate_stats_by_level(new_level)
            skin_id = self.get_available_skin_id(new_level)
            data = {
                'level': new_level,
                'exp': current_exp,
                'hp': stats['hp'],
                'attack': stats['attack'],
                'fire_rate': stats['fire_rate'],
                'speed': stats['speed'],
                'bullet_count': stats['bullet_count'],
                'skin_id': skin_id,
                'updated_at': now
            }
        else:
            data = {
                'exp': current_exp,
                'updated_at': now
            }

        self.exec.update_by_id(tank.get('id'), data)

        return {
            'level_up': level_up,
            'new_level': new_level,
            'exp': current_exp
        }

    def update_skin(self, user_id: int, skin_id: int) -> int:
        tank = self.get_by_user_id(user_id)
        if not tank:
            return 0

        skin_info = self.SKIN_INFO.get(skin_id)
        if not skin_info:
            return 0

        current_level = tank.get('level', 1)
        if skin_info['min_level'] > current_level:
            return 0

        now = datetime.now().isoformat()
        data = {
            'skin_id': skin_id,
            'updated_at': now
        }
        return self.exec.update_by_id(tank.get('id'), data)

    def to_public_dict(self, tank: Dict[str, Any]) -> Dict[str, Any]:
        skin_id = tank.get('skin_id', 1)
        skin_info = self.SKIN_INFO.get(skin_id, self.SKIN_INFO[1])
        level = tank.get('level', 1)

        return {
            'id': tank.get('id'),
            'user_id': tank.get('user_id'),
            'level': level,
            'exp': tank.get('exp'),
            'exp_needed': level * 100,
            'hp': tank.get('hp'),
            'attack': tank.get('attack'),
            'fire_rate': tank.get('fire_rate'),
            'speed': tank.get('speed'),
            'bullet_count': tank.get('bullet_count'),
            'skin_id': skin_id,
            'skin_name': skin_info['name'],
            'skin_color': skin_info['color'],
            'barrels': skin_info['barrels'],
            'has_armor': skin_info.get('armor', False),
            'has_laser': skin_info.get('laser', False)
        }
