from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class SkillModel:
    TABLE_NAME = 'tb_hd_model_skill'

    TYPE_FIRE = 1
    TYPE_WATER = 2
    TYPE_WIND = 3
    TYPE_THUNDER = 4
    TYPE_EARTH = 5
    TYPE_TAIJUTSU = 6
    TYPE_GENJUTSU = 7

    TYPE_MAP = {
        TYPE_FIRE: '火遁',
        TYPE_WATER: '水遁',
        TYPE_WIND: '风遁',
        TYPE_THUNDER: '雷遁',
        TYPE_EARTH: '土遁',
        TYPE_TAIJUTSU: '体术',
        TYPE_GENJUTSU: '幻术'
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
                name TEXT NOT NULL UNIQUE,
                description TEXT DEFAULT '',
                type INTEGER NOT NULL,
                level INTEGER DEFAULT 1,
                damage INTEGER DEFAULT 0,
                chakra_cost INTEGER DEFAULT 0,
                cooldown INTEGER DEFAULT 0,
                unlock_exp INTEGER DEFAULT 0,
                icon TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_level ON {cls.TABLE_NAME}(level)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_name ON {cls.TABLE_NAME}(name)"
        db.execute(index_sql)

        cls.init_default_skills()

    @classmethod
    def init_default_skills(cls):
        db = get_db()
        now = datetime.now().isoformat()

        default_skills = [
            {
                'name': '豪火球之术',
                'description': '将查克拉聚集在喉咙后，从口中向前方喷吐巨大的火球，将敌人炸飞到空中。',
                'type': cls.TYPE_FIRE,
                'level': 1,
                'damage': 50,
                'chakra_cost': 20,
                'cooldown': 3,
                'unlock_exp': 0,
                'icon': 'fire_ball',
                'created_at': now
            },
            {
                'name': '水龙弹之术',
                'description': '把大量的查克拉灌入水源中，将水以龙的形态攻击对方。',
                'type': cls.TYPE_WATER,
                'level': 1,
                'damage': 45,
                'chakra_cost': 25,
                'cooldown': 4,
                'unlock_exp': 0,
                'icon': 'water_dragon',
                'created_at': now
            },
            {
                'name': '风遁·螺旋丸',
                'description': '将风属性查克拉形态变化为螺旋状，具有强大的切割力。',
                'type': cls.TYPE_WIND,
                'level': 2,
                'damage': 65,
                'chakra_cost': 30,
                'cooldown': 5,
                'unlock_exp': 100,
                'icon': 'rasengan',
                'created_at': now
            },
            {
                'name': '雷切',
                'description': '将雷属性查克拉集中在手上，以极速突刺对手。',
                'type': cls.TYPE_THUNDER,
                'level': 2,
                'damage': 70,
                'chakra_cost': 35,
                'cooldown': 4,
                'unlock_exp': 150,
                'icon': 'raikiri',
                'created_at': now
            },
            {
                'name': '土遁·土流壁',
                'description': '从口中吐出岩浆性质的土，形成一道坚固的岩壁防御攻击。',
                'type': cls.TYPE_EARTH,
                'level': 1,
                'damage': 30,
                'chakra_cost': 15,
                'cooldown': 2,
                'unlock_exp': 50,
                'icon': 'earth_wall',
                'created_at': now
            },
            {
                'name': '影分身之术',
                'description': '创造出和施术者一样的分身，具有实体战斗力。',
                'type': cls.TYPE_TAIJUTSU,
                'level': 2,
                'damage': 40,
                'chakra_cost': 40,
                'cooldown': 6,
                'unlock_exp': 200,
                'icon': 'shadow_clone',
                'created_at': now
            },
            {
                'name': '写轮眼·幻术',
                'description': '通过写轮眼发动的幻术，使敌人陷入虚幻世界中。',
                'type': cls.TYPE_GENJUTSU,
                'level': 3,
                'damage': 55,
                'chakra_cost': 45,
                'cooldown': 8,
                'unlock_exp': 300,
                'icon': 'sharingan',
                'created_at': now
            },
            {
                'name': '螺旋手里剑',
                'description': '风遁螺旋手里剑，风遁·螺旋丸的完成版，具有毁灭性的杀伤力。',
                'type': cls.TYPE_WIND,
                'level': 3,
                'damage': 100,
                'chakra_cost': 60,
                'cooldown': 10,
                'unlock_exp': 500,
                'icon': 'rasenshuriken',
                'created_at': now
            }
        ]

        for skill in default_skills:
            exists = db.fetch_one(f"SELECT id FROM {cls.TABLE_NAME} WHERE name = ?", (skill['name'],))
            if not exists:
                placeholders = ', '.join(['?' for _ in skill])
                fields = ', '.join(skill.keys())
                db.execute(
                    f"INSERT INTO {cls.TABLE_NAME} ({fields}) VALUES ({placeholders})",
                    tuple(skill.values())
                )

    def create(self, name: str, description: str, skill_type: int, level: int,
                 damage: int, chakra_cost: int, cooldown: int,
                 unlock_exp: int, icon: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'type': skill_type,
            'level': level,
            'damage': damage,
            'chakra_cost': chakra_cost,
            'cooldown': cooldown,
            'unlock_exp': unlock_exp,
            'icon': icon,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'name': name})

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'type', 'level', 'damage',
            'chakra_cost', 'cooldown', 'unlock_exp', 'icon'
        ]}
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10,
                skill_type: int = None, level: int = None,
                order_by: str = 'id ASC') -> Dict[str, Any]:
        conditions = {}
        if skill_type:
            conditions['type'] = skill_type
        if level:
            conditions['level'] = level
        return self.query.paginate(page, page_size, conditions, order_by=order_by)

    def get_by_type(self, skill_type: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'type': skill_type}, order_by='level ASC')

    def get_available_skills(self, user_exp: int) -> List[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE unlock_exp <= ? ORDER BY level ASC"
        return self.db.fetch_all(sql, (user_exp,))

    def get_type_text(self, skill_type: int) -> str:
        return self.TYPE_MAP.get(skill_type, '未知')

    def to_dict(self, skill: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': skill.get('id'),
            'name': skill.get('name'),
            'description': skill.get('description'),
            'type': skill.get('type'),
            'type_text': self.get_type_text(skill.get('type')),
            'level': skill.get('level'),
            'damage': skill.get('damage'),
            'chakra_cost': skill.get('chakra_cost'),
            'cooldown': skill.get('cooldown'),
            'unlock_exp': skill.get('unlock_exp'),
            'icon': skill.get('icon'),
            'created_at': skill.get('created_at')
        }
