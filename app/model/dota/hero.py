from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class DotaHeroModel:
    TABLE_NAME = 'tb_dota_heroes'

    TYPE_AGILITY = 'agility'
    TYPE_STRENGTH = 'strength'
    TYPE_INTELLIGENCE = 'intelligence'

    TYPE_NAMES = {
        TYPE_AGILITY: '敏捷',
        TYPE_STRENGTH: '力量',
        TYPE_INTELLIGENCE: '智力'
    }

    DEFAULT_HEROES = [
        {'id': 1, 'name': '敌法师', 'hero_type': TYPE_AGILITY, 'base_attack': 25, 'base_hp': 500, 'base_defense': 5, 'price': 0, 'icon': '🗡️'},
        {'id': 2, 'name': '莉娜', 'hero_type': TYPE_INTELLIGENCE, 'base_attack': 30, 'base_hp': 420, 'base_defense': 3, 'price': 1000, 'icon': '🔥'},
        {'id': 3, 'name': '斧王', 'hero_type': TYPE_STRENGTH, 'base_attack': 22, 'base_hp': 650, 'base_defense': 8, 'price': 0, 'icon': '🛡️'},
        {'id': 4, 'name': '卓尔游侠', 'hero_type': TYPE_AGILITY, 'base_attack': 28, 'base_hp': 480, 'base_defense': 4, 'price': 800, 'icon': '🏹'},
        {'id': 5, 'name': '宙斯', 'hero_type': TYPE_INTELLIGENCE, 'base_attack': 35, 'base_hp': 400, 'base_defense': 2, 'price': 1200, 'icon': '⚡'},
        {'id': 6, 'name': '狼人', 'hero_type': TYPE_STRENGTH, 'base_attack': 26, 'base_hp': 580, 'base_defense': 6, 'price': 1500, 'icon': '🐺'},
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
                hero_type TEXT NOT NULL,
                base_attack INTEGER DEFAULT 20,
                base_hp INTEGER DEFAULT 500,
                base_defense INTEGER DEFAULT 5,
                price INTEGER DEFAULT 0,
                icon TEXT DEFAULT '',
                description TEXT DEFAULT ''
            )
        """
        db.execute(sql)

    @classmethod
    def init_default_heroes(cls):
        model = DotaHeroModel()
        for hero in cls.DEFAULT_HEROES:
            existing = model.get_by_id(hero['id'])
            if not existing:
                model.exec.insert(hero)

    def get_by_id(self, hero_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(hero_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id ASC')

    def get_by_type(self, hero_type: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'hero_type': hero_type}, order_by='id ASC')

    def get_available_heroes(self, user_gold: int) -> List[Dict[str, Any]]:
        all_heroes = self.get_all()
        return [h for h in all_heroes if h.get('price', 0) <= user_gold or h.get('price', 0) == 0]

    def get_level_bonus(self, hero_type: str, level: int) -> Dict[str, int]:
        attack_per_level = {
            self.TYPE_AGILITY: 5,
            self.TYPE_INTELLIGENCE: 7,
            self.TYPE_STRENGTH: 4,
        }
        hp_per_level = {
            self.TYPE_AGILITY: 30,
            self.TYPE_INTELLIGENCE: 25,
            self.TYPE_STRENGTH: 45,
        }
        defense_per_level = {
            self.TYPE_AGILITY: 2,
            self.TYPE_INTELLIGENCE: 1,
            self.TYPE_STRENGTH: 3,
        }

        return {
            'attack_bonus': attack_per_level.get(hero_type, 5) * (level - 1),
            'hp_bonus': hp_per_level.get(hero_type, 30) * (level - 1),
            'defense_bonus': defense_per_level.get(hero_type, 2) * (level - 1)
        }

    def to_dict(self, hero: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': hero.get('id'),
            'name': hero.get('name'),
            'hero_type': hero.get('hero_type'),
            'hero_type_name': self.TYPE_NAMES.get(hero.get('hero_type'), '未知'),
            'base_attack': hero.get('base_attack'),
            'base_hp': hero.get('base_hp'),
            'base_defense': hero.get('base_defense'),
            'price': hero.get('price'),
            'icon': hero.get('icon'),
            'description': hero.get('description')
        }
