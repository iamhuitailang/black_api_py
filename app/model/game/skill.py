from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class SkillModel:
    TABLE_NAME = 'tb_game_skill'

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
                skill_type TEXT NOT NULL DEFAULT 'attack',
                cooldown INTEGER NOT NULL DEFAULT 3,
                energy_cost INTEGER NOT NULL DEFAULT 0,
                damage_multiplier REAL NOT NULL DEFAULT 1.0,
                flat_damage INTEGER NOT NULL DEFAULT 0,
                heal_hull INTEGER NOT NULL DEFAULT 0,
                heal_shield INTEGER NOT NULL DEFAULT 0,
                defense_buff INTEGER NOT NULL DEFAULT 0,
                evasion_buff INTEGER NOT NULL DEFAULT 0,
                debuff_enemy_defense INTEGER NOT NULL DEFAULT 0,
                stun_chance INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

    @classmethod
    def seed_data(cls):
        model = cls()
        if model.query.count() > 0:
            return
        skills = [
            {'name': '集火齐射', 'description': '将所有武器对准敌方弱点，造成额外伤害。', 'skill_type': 'attack',
             'cooldown': 3, 'damage_multiplier': 1.8, 'flat_damage': 10},
            {'name': '精准打击', 'description': '精确瞄准护盾发生器，有概率穿透护盾直接伤害船体。', 'skill_type': 'attack',
             'cooldown': 4, 'damage_multiplier': 1.2, 'flat_damage': 15, 'debuff_enemy_defense': 3},
            {'name': '过载护盾', 'description': '短时间过载护盾系统，恢复大量护盾。', 'skill_type': 'defense',
             'cooldown': 4, 'heal_shield': 60, 'defense_buff': 5},
            {'name': '紧急维修', 'description': '快速启动船体内的纳米修复机。', 'skill_type': 'heal',
             'cooldown': 5, 'heal_hull': 40},
            {'name': '全系统防御', 'description': '提升所有防御系统等级，大幅减伤。', 'skill_type': 'defense',
             'cooldown': 5, 'defense_buff': 10, 'evasion_buff': 5},
            {'name': 'EMP脉冲', 'description': '释放电磁脉冲，有概率瘫痪敌舰。', 'skill_type': 'control',
             'cooldown': 6, 'damage_multiplier': 0.5, 'stun_chance': 50},
        ]
        for s in skills:
            model.create(**s)

    def create(self, name: str, description: str = '', skill_type: str = 'attack',
               cooldown: int = 3, energy_cost: int = 0, damage_multiplier: float = 1.0,
               flat_damage: int = 0, heal_hull: int = 0, heal_shield: int = 0,
               defense_buff: int = 0, evasion_buff: int = 0, debuff_enemy_defense: int = 0,
               stun_chance: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'skill_type': skill_type,
            'cooldown': cooldown,
            'energy_cost': energy_cost,
            'damage_multiplier': damage_multiplier,
            'flat_damage': flat_damage,
            'heal_hull': heal_hull,
            'heal_shield': heal_shield,
            'defense_buff': defense_buff,
            'evasion_buff': evasion_buff,
            'debuff_enemy_defense': debuff_enemy_defense,
            'stun_chance': stun_chance,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='skill_type ASC, id ASC')

    def get_by_type(self, skill_type: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'skill_type': skill_type}, order_by='id ASC')

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
