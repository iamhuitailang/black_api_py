from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class EquipmentModel:
    TABLE_NAME = 'tb_wangzhe_model_equipments'

    STATUS_ACTIVE = 0
    STATUS_DISABLED = 1

    TYPE_ATTACK = 'attack'
    TYPE_MAGIC = 'magic'
    TYPE_DEFENSE = 'defense'
    TYPE_MOVEMENT = 'movement'
    TYPE_COMMON = 'common'

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
                type TEXT DEFAULT 'common',
                price INTEGER DEFAULT 2000,
                icon TEXT DEFAULT '',
                hp INTEGER DEFAULT 0,
                mp INTEGER DEFAULT 0,
                attack INTEGER DEFAULT 0,
                magic_attack INTEGER DEFAULT 0,
                defense INTEGER DEFAULT 0,
                magic_defense INTEGER DEFAULT 0,
                speed REAL DEFAULT 0,
                attack_speed REAL DEFAULT 0,
                crit_rate REAL DEFAULT 0,
                life_steal REAL DEFAULT 0,
                cooldown_reduction REAL DEFAULT 0,
                description TEXT DEFAULT '',
                passive TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    @classmethod
    def init_default_equipments(cls):
        model = cls()
        default_equipments = [
            {
                'name': '无尽战刃',
                'type': cls.TYPE_ATTACK,
                'price': 2140,
                'attack': 130,
                'crit_rate': 0.4,
                'description': '+130物理攻击，+40%暴击率',
                'passive': '唯一被动：增加50%暴击效果'
            },
            {
                'name': '破晓',
                'type': cls.TYPE_ATTACK,
                'price': 3400,
                'attack': 50,
                'attack_speed': 0.35,
                'crit_rate': 0.15,
                'description': '+50物理攻击，+35%攻速，+15%暴击率',
                'passive': '唯一被动：普通攻击对防御塔造成额外伤害'
            },
            {
                'name': '魔女斗篷',
                'type': cls.TYPE_DEFENSE,
                'price': 2080,
                'hp': 1000,
                'magic_defense': 360,
                'description': '+1000生命，+360法术防御',
                'passive': '唯一被动：获得一个可以吸收法术伤害的护盾'
            },
            {
                'name': '不祥征兆',
                'type': cls.TYPE_DEFENSE,
                'price': 2180,
                'hp': 1200,
                'defense': 270,
                'description': '+1200生命，+270物理防御',
                'passive': '唯一被动：受到攻击会减少攻击者攻速和移速'
            },
            {
                'name': '博学者之怒',
                'type': cls.TYPE_MAGIC,
                'price': 2300,
                'magic_attack': 240,
                'description': '+240法术攻击',
                'passive': '唯一被动：提升35%法术攻击'
            },
            {
                'name': '回响之杖',
                'type': cls.TYPE_MAGIC,
                'price': 2100,
                'magic_attack': 240,
                'speed': 0.07,
                'description': '+240法术攻击，+7%移速',
                'passive': '唯一被动：技能命中会触发小范围爆炸'
            },
            {
                'name': '抵抗之靴',
                'type': cls.TYPE_MOVEMENT,
                'price': 710,
                'speed': 0.3,
                'magic_defense': 110,
                'description': '+30移速，+110法术防御',
                'passive': '唯一被动：增加35%韧性，减少被控制时间'
            },
            {
                'name': '急速战靴',
                'type': cls.TYPE_MOVEMENT,
                'price': 710,
                'speed': 0.3,
                'attack_speed': 0.25,
                'description': '+30移速，+25%攻速',
                'passive': '唯一被动：增加移动速度'
            },
            {
                'name': '泣血之刃',
                'type': cls.TYPE_ATTACK,
                'price': 1800,
                'attack': 100,
                'life_steal': 0.25,
                'description': '+100物理攻击，+25%物理吸血',
                'passive': '普通攻击回复生命值'
            },
            {
                'name': '破军',
                'type': cls.TYPE_ATTACK,
                'price': 2950,
                'attack': 180,
                'description': '+180物理攻击',
                'passive': '唯一被动：对生命值低于50%的敌人造成额外伤害'
            },
            {
                'name': '贤者之书',
                'type': cls.TYPE_MAGIC,
                'price': 2990,
                'magic_attack': 400,
                'hp': 1400,
                'description': '+400法术攻击，+1400生命',
                'passive': '大幅度提升法术强度'
            },
            {
                'name': '不死鸟之眼',
                'type': cls.TYPE_DEFENSE,
                'price': 2100,
                'hp': 1200,
                'magic_defense': 240,
                'mp': 100,
                'description': '+1200生命，+240法术防御，+每5秒回复100生命',
                'passive': '唯一被动：增加治疗效果'
            }
        ]

        for equip in default_equipments:
            existing = model.get_by_name(equip['name'])
            if not existing:
                model.create(**equip)

    def create(self, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = kwargs.copy()
        data['created_at'] = now
        data['updated_at'] = now
        data['status'] = self.STATUS_ACTIVE
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'name': name})

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = data.copy()
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 50, type: str = None,
                keyword: str = None, status: int = None) -> Dict[str, Any]:
        conditions = {}
        if type:
            conditions['type'] = type
        if status is not None:
            conditions['status'] = status

        if keyword:
            return self.search(keyword, page, page_size, type, status)

        return self.query.paginate(page, page_size, conditions, order_by='price ASC')

    def search(self, keyword: str, page: int = 1, page_size: int = 50,
               type: str = None, status: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if type:
            where_clauses.append("type = ?")
            params.append(type)
        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        where_clauses.append("name LIKE ?")
        like_pattern = f"%{keyword}%"
        params.append(like_pattern)

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY price ASC 
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, tuple(params))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_type_text(self, type: str) -> str:
        type_map = {
            self.TYPE_ATTACK: '攻击',
            self.TYPE_MAGIC: '法术',
            self.TYPE_DEFENSE: '防御',
            self.TYPE_MOVEMENT: '移动',
            self.TYPE_COMMON: '通用'
        }
        return type_map.get(type, '未知')

    def to_public_dict(self, equipment: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': equipment.get('id'),
            'name': equipment.get('name'),
            'type': equipment.get('type'),
            'type_text': self.get_type_text(equipment.get('type', '')),
            'price': equipment.get('price'),
            'icon': equipment.get('icon'),
            'attributes': {
                'hp': equipment.get('hp', 0),
                'mp': equipment.get('mp', 0),
                'attack': equipment.get('attack', 0),
                'magic_attack': equipment.get('magic_attack', 0),
                'defense': equipment.get('defense', 0),
                'magic_defense': equipment.get('magic_defense', 0),
                'speed': equipment.get('speed', 0),
                'attack_speed': equipment.get('attack_speed', 0),
                'crit_rate': equipment.get('crit_rate', 0),
                'life_steal': equipment.get('life_steal', 0),
                'cooldown_reduction': equipment.get('cooldown_reduction', 0)
            },
            'description': equipment.get('description'),
            'passive': equipment.get('passive'),
            'status': equipment.get('status'),
            'created_at': equipment.get('created_at')
        }
