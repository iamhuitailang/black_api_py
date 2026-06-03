from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class SkillModel:
    TABLE_NAME = 'tb_yp_model_skill'

    SKILL_TYPE_PASSIVE = 1
    SKILL_TYPE_ACTIVE = 2

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
                icon TEXT DEFAULT '',
                skill_type INTEGER DEFAULT 1,
                tree_position TEXT DEFAULT '',
                max_level INTEGER DEFAULT 5,
                base_price INTEGER DEFAULT 100,
                effect_type TEXT DEFAULT '',
                effect_value REAL DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_skill_type ON {cls.TABLE_NAME}(skill_type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_active ON {cls.TABLE_NAME}(is_active)"
        db.execute(index_sql)

    @classmethod
    def init_default_skills(cls):
        model = cls()
        default_skills = [
            {
                'name': '双倍得分',
                'description': '得分加成提升',
                'icon': 'score_boost',
                'skill_type': cls.SKILL_TYPE_PASSIVE,
                'tree_position': 'root',
                'max_level': 5,
                'base_price': 200,
                'effect_type': 'score_multiplier',
                'effect_value': 0.1
            },
            {
                'name': '疾风步',
                'description': '移动速度提升',
                'icon': 'speed_boost',
                'skill_type': cls.SKILL_TYPE_PASSIVE,
                'tree_position': 'left1',
                'max_level': 5,
                'base_price': 200,
                'effect_type': 'speed_multiplier',
                'effect_value': 0.05
            },
            {
                'name': '弹簧鞋',
                'description': '跳跃高度提升',
                'icon': 'jump_boost',
                'skill_type': cls.SKILL_TYPE_PASSIVE,
                'tree_position': 'right1',
                'max_level': 5,
                'base_price': 200,
                'effect_type': 'jump_multiplier',
                'effect_value': 0.05
            },
            {
                'name': '磁铁',
                'description': '自动吸附附近音符',
                'icon': 'magnet',
                'skill_type': cls.SKILL_TYPE_PASSIVE,
                'tree_position': 'left2',
                'max_level': 3,
                'base_price': 500,
                'effect_type': 'magnet_range',
                'effect_value': 30
            },
            {
                'name': '护盾',
                'description': '可抵挡一次伤害',
                'icon': 'shield',
                'skill_type': cls.SKILL_TYPE_ACTIVE,
                'tree_position': 'right2',
                'max_level': 3,
                'base_price': 500,
                'effect_type': 'shield_duration',
                'effect_value': 3
            },
            {
                'name': '节拍大师',
                'description': '节拍判定范围扩大',
                'icon': 'rhythm_master',
                'skill_type': cls.SKILL_TYPE_PASSIVE,
                'tree_position': 'center1',
                'max_level': 3,
                'base_price': 800,
                'effect_type': 'beat_window',
                'effect_value': 0.05
            },
            {
                'name': '复活币',
                'description': '死亡后可复活一次',
                'icon': 'revive',
                'skill_type': cls.SKILL_TYPE_ACTIVE,
                'tree_position': 'center2',
                'max_level': 1,
                'base_price': 2000,
                'effect_type': 'revive_count',
                'effect_value': 1
            }
        ]

        for skill in default_skills:
            existing = model.query.find_one({'name': skill['name']})
            if not existing:
                now = datetime.now().isoformat()
                skill['created_at'] = now
                skill['updated_at'] = now
                skill['is_active'] = 1
                model.exec.insert(skill)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        data['updated_at'] = now
        data['is_active'] = 1
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all_active(self) -> List[Dict[str, Any]]:
        return self.query.find_all({'is_active': 1}, order_by='skill_type ASC, id ASC')

    def get_all(self, page: int = 1, page_size: int = 10, skill_type: int = None) -> Dict[str, Any]:
        conditions = {}
        if skill_type is not None:
            conditions['skill_type'] = skill_type
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'icon', 'skill_type', 'tree_position',
            'max_level', 'base_price', 'effect_type', 'effect_value', 'is_active'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.update_by_id(record_id, {'is_active': 0, 'updated_at': datetime.now().isoformat()})

    def get_skill_type_text(self, skill_type: int) -> str:
        type_map = {
            self.SKILL_TYPE_PASSIVE: '被动技能',
            self.SKILL_TYPE_ACTIVE: '主动技能'
        }
        return type_map.get(skill_type, '未知')

    def calculate_upgrade_price(self, base_price: int, current_level: int) -> int:
        return int(base_price * (1.5 ** current_level))

    def to_public_dict(self, skill: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': skill.get('id'),
            'name': skill.get('name'),
            'description': skill.get('description'),
            'icon': skill.get('icon'),
            'skill_type': skill.get('skill_type'),
            'skill_type_text': self.get_skill_type_text(skill.get('skill_type')),
            'tree_position': skill.get('tree_position'),
            'max_level': skill.get('max_level'),
            'base_price': skill.get('base_price'),
            'effect_type': skill.get('effect_type'),
            'effect_value': skill.get('effect_value'),
            'is_active': skill.get('is_active')
        }
