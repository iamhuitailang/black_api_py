from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class DotaEnemyModel:
    TABLE_NAME = 'tb_dota_enemies'

    TYPE_MINION = 'minion'
    TYPE_ELITE = 'elite'
    TYPE_BOSS = 'boss'

    DEFAULT_ENEMIES = [
        {'id': 1, 'name': '小兵', 'enemy_type': TYPE_MINION, 'base_attack': 10, 'base_hp': 100, 'base_defense': 2, 'gold_drop': 10, 'exp_drop': 5, 'icon': '🧟', 'description': '普通小兵'},
        {'id': 2, 'name': '巨魔精英', 'enemy_type': TYPE_ELITE, 'base_attack': 25, 'base_hp': 300, 'base_defense': 8, 'gold_drop': 50, 'exp_drop': 30, 'icon': '👹', 'description': '巨魔战将精英'},
        {'id': 3, 'name': '肉山', 'enemy_type': TYPE_BOSS, 'base_attack': 40, 'base_hp': 800, 'base_defense': 15, 'gold_drop': 200, 'exp_drop': 100, 'icon': '👾', 'description': '不朽守护肉山'},
        {'id': 4, 'name': '熊战士', 'enemy_type': TYPE_ELITE, 'base_attack': 30, 'base_hp': 400, 'base_defense': 10, 'gold_drop': 60, 'exp_drop': 40, 'icon': '🐻', 'description': '拍拍熊精英'},
        {'id': 5, 'name': '死灵法师', 'enemy_type': TYPE_ELITE, 'base_attack': 35, 'base_hp': 350, 'base_defense': 8, 'gold_drop': 70, 'exp_drop': 45, 'icon': '💀', 'description': '死灵法师精英'},
        {'id': 6, 'name': '影魔', 'enemy_type': TYPE_BOSS, 'base_attack': 55, 'base_hp': 1000, 'base_defense': 18, 'gold_drop': 300, 'exp_drop': 150, 'icon': '👻', 'description': '影魔 BOSS'},
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
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                enemy_type TEXT NOT NULL,
                base_attack INTEGER DEFAULT 10,
                base_hp INTEGER DEFAULT 100,
                base_defense INTEGER DEFAULT 2,
                gold_drop INTEGER DEFAULT 10,
                exp_drop INTEGER DEFAULT 5,
                icon TEXT DEFAULT '',
                description TEXT DEFAULT ''
            )
        """
        db.execute(sql)

    @classmethod
    def init_default_enemies(cls):
        model = DotaEnemyModel()
        for enemy in cls.DEFAULT_ENEMIES:
            existing = model.get_by_id(enemy['id'])
            if not existing:
                model.exec.insert(enemy)

    def get_by_id(self, enemy_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(enemy_id)

    def get_by_type(self, enemy_type: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'enemy_type': enemy_type}, order_by='id ASC')

    def get_enemy_for_stage(self, stage_type: str, enemy_level: int) -> Dict[str, Any]:
        enemies = self.get_by_type(stage_type)
        if enemies:
            base_enemy = enemies[0]
        else:
            minions = self.get_by_type(self.TYPE_MINION)
            base_enemy = minions[0] if minions else self.DEFAULT_ENEMIES[0]

        level_multiplier = 1 + (enemy_level - 1) * 0.15

        return {
            'id': base_enemy.get('id'),
            'name': base_enemy.get('name'),
            'enemy_type': base_enemy.get('enemy_type'),
            'level': enemy_level,
            'attack': int(base_enemy.get('base_attack', 10) * level_multiplier),
            'max_hp': int(base_enemy.get('base_hp', 100) * level_multiplier),
            'current_hp': int(base_enemy.get('base_hp', 100) * level_multiplier),
            'defense': int(base_enemy.get('base_defense', 2) * level_multiplier),
            'gold_drop': int(base_enemy.get('gold_drop', 10) * level_multiplier),
            'exp_drop': int(base_enemy.get('exp_drop', 5) * level_multiplier),
            'icon': base_enemy.get('icon', '🧟')
        }

    def to_dict(self, enemy: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': enemy.get('id'),
            'name': enemy.get('name'),
            'enemy_type': enemy.get('enemy_type'),
            'base_attack': enemy.get('base_attack'),
            'base_hp': enemy.get('base_hp'),
            'base_defense': enemy.get('base_defense'),
            'gold_drop': enemy.get('gold_drop'),
            'exp_drop': enemy.get('exp_drop'),
            'icon': enemy.get('icon'),
            'description': enemy.get('description')
        }
