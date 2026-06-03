from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ToolModel:
    TABLE_NAME = 'tb_hd_model_tool'

    TYPE_ATTACK = 1
    TYPE_SUPPORT = 2
    TYPE_HEAL = 3
    TYPE_TRAP = 4

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
                effect TEXT DEFAULT '',
                damage INTEGER DEFAULT 0,
                heal INTEGER DEFAULT 0,
                duration INTEGER DEFAULT 0,
                price INTEGER DEFAULT 0,
                icon TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_price ON {cls.TABLE_NAME}(price)"
        db.execute(index_sql)

    @classmethod
    def init_default_tools(cls):
        model = cls()
        if model.count() > 0:
            return

        default_tools = [
            {
                'name': '苦无',
                'description': '忍者常用的短刀，近距离攻击武器，锋利无比。',
                'type': cls.TYPE_ATTACK,
                'effect': '对单体造成伤害',
                'damage': 15,
                'heal': 0,
                'duration': 0,
                'price': 50,
                'icon': '🔪'
            },
            {
                'name': '手里剑',
                'description': '远程投掷武器，可在远距离攻击敌人。',
                'type': cls.TYPE_ATTACK,
                'effect': '对远程单体造成伤害',
                'damage': 10,
                'heal': 0,
                'duration': 0,
                'price': 30,
                'icon': '🗡️'
            },
            {
                'name': '烟雾弹',
                'description': '释放烟雾遮蔽视野，可用于撤退或潜行。',
                'type': cls.TYPE_SUPPORT,
                'effect': '降低敌人命中',
                'damage': 0,
                'heal': 0,
                'duration': 3,
                'price': 80,
                'icon': '💨'
            },
            {
                'name': '闪光弹',
                'description': '瞬间释放强光，使敌人暂时失明。',
                'type': cls.TYPE_SUPPORT,
                'effect': '使敌人眩晕1回合',
                'damage': 0,
                'heal': 0,
                'duration': 1,
                'price': 100,
                'icon': '💫'
            },
            {
                'name': '兵粮丸',
                'description': '忍者专用口粮，食用后恢复查克拉。',
                'type': cls.TYPE_HEAL,
                'effect': '恢复查克拉',
                'damage': 0,
                'heal': 30,
                'duration': 0,
                'price': 60,
                'icon': '🍙'
            },
            {
                'name': '解毒剂',
                'description': '调配的草药药剂，可解除中毒状态并恢复生命。',
                'type': cls.TYPE_HEAL,
                'effect': '解除中毒，恢复生命值',
                'damage': 0,
                'heal': 50,
                'duration': 0,
                'price': 120,
                'icon': '💊'
            },
            {
                'name': '起爆符',
                'description': '贴有符咒的纸片，引爆后造成范围伤害。',
                'type': cls.TYPE_ATTACK,
                'effect': '对范围内敌人造成伤害',
                'damage': 25,
                'heal': 0,
                'duration': 0,
                'price': 150,
                'icon': '💥'
            },
            {
                'name': '陷阱',
                'description': '布置在地面的机关，敌人踩中后受到伤害并减速。',
                'type': cls.TYPE_TRAP,
                'effect': '造成伤害并减速敌人2回合',
                'damage': 20,
                'heal': 0,
                'duration': 2,
                'price': 200,
                'icon': '🪤'
            }
        ]

        now = datetime.now().isoformat()
        data_list = []
        for tool in default_tools:
            data = tool.copy()
            data['created_at'] = now
            data_list.append(data)

        model.exec.insert_many(data_list)

    def create(self, name: str, description: str = '', type: int = TYPE_ATTACK,
               effect: str = '', damage: int = 0, heal: int = 0, duration: int = 0,
               price: int = 0, icon: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'type': type,
            'effect': effect,
            'damage': damage,
            'heal': heal,
            'duration': duration,
            'price': price,
            'icon': icon,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_type(self, type: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'type': type}, order_by='price ASC, id ASC')

    def get_all(self, page: int = 1, page_size: int = 10, type: int = None) -> Dict[str, Any]:
        conditions = {}
        if type is not None:
            conditions['type'] = type
        return self.query.paginate(page, page_size, conditions, order_by='price ASC, id ASC')

    def update(self, record_id: int, name: str = None, description: str = None,
               type: int = None, effect: str = None, damage: int = None,
               heal: int = None, duration: int = None, price: int = None,
               icon: str = None) -> int:
        data = {}
        if name is not None:
            data['name'] = name
        if description is not None:
            data['description'] = description
        if type is not None:
            data['type'] = type
        if effect is not None:
            data['effect'] = effect
        if damage is not None:
            data['damage'] = damage
        if heal is not None:
            data['heal'] = heal
        if duration is not None:
            data['duration'] = duration
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
            self.TYPE_ATTACK: '攻击',
            self.TYPE_SUPPORT: '辅助',
            self.TYPE_HEAL: '恢复',
            self.TYPE_TRAP: '陷阱'
        }
        return type_map.get(type, '未知')
