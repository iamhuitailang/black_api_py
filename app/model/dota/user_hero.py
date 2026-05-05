from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class DotaUserHeroModel:
    TABLE_NAME = 'tb_dota_user_heroes'

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
                user_id INTEGER NOT NULL,
                hero_id INTEGER NOT NULL,
                level INTEGER DEFAULT 1,
                exp INTEGER DEFAULT 0,
                skill_points INTEGER DEFAULT 0,
                skills TEXT DEFAULT '[]',
                current_hp INTEGER DEFAULT 500,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, hero_id)
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_hero_id ON {cls.TABLE_NAME}(hero_id)"
        db.execute(index_sql2)

    def create(self, user_id: int, hero_id: int, base_hp: int = 500) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'hero_id': hero_id,
            'level': 1,
            'exp': 0,
            'skill_points': 0,
            'skills': '[]',
            'current_hp': base_hp,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_user_hero(self, user_id: int, hero_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'hero_id': hero_id})

    def get_by_user(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='id ASC')

    def get_hero_ids_by_user(self, user_id: int) -> List[int]:
        user_heroes = self.get_by_user(user_id)
        return [h.get('hero_id') for h in user_heroes]

    def update_level(self, user_id: int, hero_id: int, new_level: int, skill_points_add: int = 1) -> int:
        user_hero = self.get_by_user_hero(user_id, hero_id)
        if not user_hero:
            return 0

        current_level = user_hero.get('level', 1)
        if new_level <= current_level:
            return 0

        skill_points = user_hero.get('skill_points', 0) + skill_points_add
        now = datetime.now().isoformat()
        data = {
            'level': new_level,
            'skill_points': skill_points,
            'updated_at': now
        }
        return self.exec.update_by_condition(
            {'user_id': user_id, 'hero_id': hero_id},
            data
        )

    def update_exp(self, user_id: int, hero_id: int, exp_gain: int) -> Dict[str, Any]:
        user_hero = self.get_by_user_hero(user_id, hero_id)
        if not user_hero:
            return {'leveled_up': False, 'new_level': 1}

        current_level = user_hero.get('level', 1)
        current_exp = user_hero.get('exp', 0)
        new_exp = current_exp + exp_gain

        from app.model.dota.user import DotaUserModel
        exp_required = DotaUserModel.get_exp_required(current_level)

        leveled_up = False
        new_level = current_level
        levels_gained = 0

        while new_exp >= exp_required and new_level < 30:
            new_exp -= exp_required
            new_level += 1
            levels_gained += 1
            leveled_up = True
            exp_required = DotaUserModel.get_exp_required(new_level)

        now = datetime.now().isoformat()
        skill_points = user_hero.get('skill_points', 0) + levels_gained
        data = {
            'level': new_level,
            'exp': new_exp,
            'skill_points': skill_points,
            'updated_at': now
        }
        self.exec.update_by_condition(
            {'user_id': user_id, 'hero_id': hero_id},
            data
        )

        return {
            'leveled_up': leveled_up,
            'new_level': new_level,
            'remaining_exp': new_exp,
            'exp_required': DotaUserModel.get_exp_required(new_level),
            'skill_points': skill_points
        }

    def update_hp(self, user_id: int, hero_id: int, current_hp: int, max_hp: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'current_hp': max(0, min(current_hp, max_hp)),
            'updated_at': now
        }
        return self.exec.update_by_condition(
            {'user_id': user_id, 'hero_id': hero_id},
            data
        )

    def heal_hero(self, user_id: int, hero_id: int, max_hp: int) -> int:
        return self.update_hp(user_id, hero_id, max_hp, max_hp)

    def update_skills(self, user_id: int, hero_id: int, skills: List[Dict[str, Any]]) -> int:
        import json
        now = datetime.now().isoformat()
        data = {
            'skills': json.dumps(skills, ensure_ascii=False),
            'updated_at': now
        }
        return self.exec.update_by_condition(
            {'user_id': user_id, 'hero_id': hero_id},
            data
        )

    def use_skill_point(self, user_id: int, hero_id: int) -> int:
        user_hero = self.get_by_user_hero(user_id, hero_id)
        if not user_hero or user_hero.get('skill_points', 0) <= 0:
            return 0

        now = datetime.now().isoformat()
        data = {
            'skill_points': user_hero.get('skill_points', 0) - 1,
            'updated_at': now
        }
        return self.exec.update_by_condition(
            {'user_id': user_id, 'hero_id': hero_id},
            data
        )

    def delete(self, user_id: int, hero_id: int) -> int:
        return self.exec.execute_raw(
            f"DELETE FROM {self.TABLE_NAME} WHERE user_id = ? AND hero_id = ?",
            (user_id, hero_id)
        )

    def to_dict(self, user_hero: Dict[str, Any]) -> Dict[str, Any]:
        import json
        skills_str = user_hero.get('skills', '[]')
        try:
            skills = json.loads(skills_str)
        except (json.JSONDecodeError, TypeError):
            skills = []

        return {
            'id': user_hero.get('id'),
            'user_id': user_hero.get('user_id'),
            'hero_id': user_hero.get('hero_id'),
            'level': user_hero.get('level'),
            'exp': user_hero.get('exp'),
            'skill_points': user_hero.get('skill_points'),
            'skills': skills,
            'current_hp': user_hero.get('current_hp')
        }
