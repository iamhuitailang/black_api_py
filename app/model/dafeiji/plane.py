from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class PlaneModel:
    TABLE_NAME = 'tb_dafeiji_plane'

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
                plane_id TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                description TEXT,
                speed REAL NOT NULL,
                hp INTEGER NOT NULL,
                weapon_type TEXT NOT NULL,
                weapon_damage INTEGER NOT NULL,
                weapon_fire_rate REAL NOT NULL,
                skill_name TEXT NOT NULL,
                skill_description TEXT,
                skill_cooldown REAL NOT NULL,
                color TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_plane_id ON {cls.TABLE_NAME}(plane_id)"
        db.execute(index_sql)

        planes = [
            {
                'plane_id': 'lightning',
                'name': '闪电-轻型战机',
                'type': 'light',
                'description': '高速轻型战机，机动性极强，但装甲薄弱',
                'speed': 320,
                'hp': 80,
                'weapon_type': 'laser',
                'weapon_damage': 10,
                'weapon_fire_rate': 0.12,
                'skill_name': '闪避冲刺',
                'skill_description': '瞬间无敌并向前冲刺一段距离',
                'skill_cooldown': 8,
                'color': '#00d4ff'
            },
            {
                'plane_id': 'vanguard',
                'name': '先锋-中型战机',
                'type': 'medium',
                'description': '均衡型战机，各项属性平衡，适合新手',
                'speed': 220,
                'hp': 150,
                'weapon_type': 'plasma',
                'weapon_damage': 18,
                'weapon_fire_rate': 0.2,
                'skill_name': '护盾爆发',
                'skill_description': '释放能量护盾，抵挡所有伤害3秒',
                'skill_cooldown': 12,
                'color': '#ff8c00'
            },
            {
                'plane_id': 'titan',
                'name': '泰坦-重型战机',
                'type': 'heavy',
                'description': '重型装甲战机，火力强大但移动缓慢',
                'speed': 140,
                'hp': 300,
                'weapon_type': 'missile',
                'weapon_damage': 35,
                'weapon_fire_rate': 0.4,
                'skill_name': '毁灭轰炸',
                'skill_description': '发射多枚追踪导弹，对全屏敌人造成伤害',
                'skill_cooldown': 15,
                'color': '#ff3333'
            }
        ]

        for plane in planes:
            existing = db.fetch_one(f"SELECT id FROM {cls.TABLE_NAME} WHERE plane_id = ?", (plane['plane_id'],))
            if not existing:
                now = datetime.now().isoformat()
                db.execute(
                    f"""INSERT INTO {cls.TABLE_NAME} 
                    (plane_id, name, type, description, speed, hp, weapon_type, weapon_damage, 
                     weapon_fire_rate, skill_name, skill_description, skill_cooldown, color, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (plane['plane_id'], plane['name'], plane['type'], plane['description'],
                     plane['speed'], plane['hp'], plane['weapon_type'], plane['weapon_damage'],
                     plane['weapon_fire_rate'], plane['skill_name'], plane['skill_description'],
                     plane['skill_cooldown'], plane['color'], now, now)
                )

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id ASC')

    def get_by_plane_id(self, plane_id: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'plane_id': plane_id})

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        data['updated_at'] = now
        return self.exec.insert(data)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['updated_at'] = now
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
