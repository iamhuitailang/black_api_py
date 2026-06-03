from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class EquipmentModel:
    TABLE_NAME = 'tb_hd_model_equipment'

    TYPE_WEAPON = 1
    TYPE_ARMOR = 2
    TYPE_ACCESSORY = 3

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
                type INTEGER NOT NULL,
                level INTEGER DEFAULT 1,
                attack INTEGER DEFAULT 0,
                defense INTEGER DEFAULT 0,
                hp INTEGER DEFAULT 0,
                chakra INTEGER DEFAULT 0,
                price INTEGER DEFAULT 0,
                icon TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_level ON {cls.TABLE_NAME}(level)"
        db.execute(index_sql)

    @classmethod
    def init_default_equipments(cls):
        model = cls()
        if model.count() > 0:
            return

        default_equipments = [
            {
                'name': '铁剑',
                'description': '普通的铁制长剑，入门级武器。',
                'type': cls.TYPE_WEAPON,
                'level': 1,
                'attack': 10,
                'defense': 0,
                'hp': 0,
                'chakra': 0,
                'price': 100,
                'icon': '🗡️'
            },
            {
                'name': '精钢刀',
                'description': '由精钢打造的利刃，攻击力不俗。',
                'type': cls.TYPE_WEAPON,
                'level': 3,
                'attack': 25,
                'defense': 0,
                'hp': 0,
                'chakra': 5,
                'price': 300,
                'icon': '⚔️'
            },
            {
                'name': '布衣',
                'description': '粗布缝制的衣服，聊胜于无。',
                'type': cls.TYPE_ARMOR,
                'level': 1,
                'attack': 0,
                'defense': 5,
                'hp': 10,
                'chakra': 0,
                'price': 50,
                'icon': '👕'
            },
            {
                'name': '皮甲',
                'description': '由兽皮缝制的护甲，防护性尚可。',
                'type': cls.TYPE_ARMOR,
                'level': 2,
                'attack': 0,
                'defense': 15,
                'hp': 30,
                'chakra': 0,
                'price': 200,
                'icon': '🦺'
            },
            {
                'name': '木簪',
                'description': '普通的木制发簪，略有灵气。',
                'type': cls.TYPE_ACCESSORY,
                'level': 1,
                'attack': 0,
                'defense': 0,
                'hp': 0,
                'chakra': 10,
                'price': 80,
                'icon': '📿'
            },
            {
                'name': '玉佩',
                'description': '温润的玉佩，蕴含微量灵气。',
                'type': cls.TYPE_ACCESSORY,
                'level': 2,
                'attack': 3,
                'defense': 3,
                'hp': 20,
                'chakra': 15,
                'price': 250,
                'icon': '💎'
            }
        ]

        now = datetime.now().isoformat()
        data_list = []
        for eq in default_equipments:
            data = eq.copy()
            data['created_at'] = now
            data_list.append(data)

        model.exec.insert_many(data_list)

    def create(self, name: str, description: str = '', type: int = TYPE_WEAPON,
               level: int = 1, attack: int = 0, defense: int = 0, hp: int = 0,
               chakra: int = 0, price: int = 0, icon: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'type': type,
            'level': level,
            'attack': attack,
            'defense': defense,
            'hp': hp,
            'chakra': chakra,
            'price': price,
            'icon': icon,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_type(self, type: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'type': type}, order_by='level ASC, id ASC')

    def get_all(self, page: int = 1, page_size: int = 10, type: int = None,
                level: int = None) -> Dict[str, Any]:
        conditions = {}
        if type is not None:
            conditions['type'] = type
        if level is not None:
            conditions['level'] = level
        return self.query.paginate(page, page_size, conditions, order_by='level ASC, id ASC')

    def update(self, record_id: int, name: str = None, description: str = None,
               type: int = None, level: int = None, attack: int = None,
               defense: int = None, hp: int = None, chakra: int = None,
               price: int = None, icon: str = None) -> int:
        data = {}
        if name is not None:
            data['name'] = name
        if description is not None:
            data['description'] = description
        if type is not None:
            data['type'] = type
        if level is not None:
            data['level'] = level
        if attack is not None:
            data['attack'] = attack
        if defense is not None:
            data['defense'] = defense
        if hp is not None:
            data['hp'] = hp
        if chakra is not None:
            data['chakra'] = chakra
        if price is not None:
            data['price'] = price
        if icon is not None:
            data['icon'] = icon
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()

    def get_type_text(self, type: int) -> str:
        type_map = {
            self.TYPE_WEAPON: '武器',
            self.TYPE_ARMOR: '防具',
            self.TYPE_ACCESSORY: '饰品'
        }
        return type_map.get(type, '未知')
