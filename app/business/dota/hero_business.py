from typing import Dict, Any, List, Optional
from app.model.dota import (
    DotaHeroModel, DotaUserHeroModel, DotaSkillModel,
    DotaUserModel, DotaUserEquipmentModel
)


class DotaHeroBusiness:
    def __init__(self):
        self.hero_model = DotaHeroModel()
        self.user_hero_model = DotaUserHeroModel()
        self.skill_model = DotaSkillModel()
        self.user_model = DotaUserModel()
        self.user_equipment_model = DotaUserEquipmentModel()

    def get_all_heroes(self) -> Dict[str, Any]:
        heroes = self.hero_model.get_all()
        return {
            'code': 0,
            'msg': 'success',
            'data': [self.hero_model.to_dict(h) for h in heroes]
        }

    def get_heroes_for_user(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        user_gold = user.get('gold', 0)
        owned_hero_ids = self.user_hero_model.get_hero_ids_by_user(user_id)
        all_heroes = self.hero_model.get_all()

        result = []
        for hero in all_heroes:
            hero_dict = self.hero_model.to_dict(hero)
            hero_id = hero.get('id')
            is_owned = hero_id in owned_hero_ids
            hero_dict['is_owned'] = is_owned
            hero_dict['can_buy'] = hero.get('price', 0) <= user_gold and not is_owned

            if is_owned:
                user_hero = self.user_hero_model.get_by_user_hero(user_id, hero_id)
                if user_hero:
                    hero_dict['user_hero'] = self.user_hero_model.to_dict(user_hero)

            result.append(hero_dict)

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_user_heroes(self, user_id: int) -> Dict[str, Any]:
        user_heroes = self.user_hero_model.get_by_user(user_id)
        result = []
        for uh in user_heroes:
            hero = self.hero_model.get_by_id(uh.get('hero_id'))
            if hero:
                result.append({
                    **self.hero_model.to_dict(hero),
                    'user_hero': self.user_hero_model.to_dict(uh)
                })

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_hero_detail(self, hero_id: int, user_id: int = None) -> Dict[str, Any]:
        hero = self.hero_model.get_by_id(hero_id)
        if not hero:
            return {
                'code': 1,
                'msg': '英雄不存在',
                'data': None
            }

        skills = self.skill_model.get_by_hero(hero_id)

        result = {
            **self.hero_model.to_dict(hero),
            'skills': [self.skill_model.to_dict(s) for s in skills]
        }

        if user_id:
            user_hero = self.user_hero_model.get_by_user_hero(user_id, hero_id)
            if user_hero:
                result['user_hero'] = self.user_hero_model.to_dict(user_hero)

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def buy_hero(self, user_id: int, hero_id: int) -> Dict[str, Any]:
        hero = self.hero_model.get_by_id(hero_id)
        if not hero:
            return {
                'code': 1,
                'msg': '英雄不存在',
                'data': None
            }

        price = hero.get('price', 0)
        if price == 0:
            return {
                'code': 1,
                'msg': '该英雄不可购买',
                'data': None
            }

        existing = self.user_hero_model.get_by_user_hero(user_id, hero_id)
        if existing:
            return {
                'code': 1,
                'msg': '您已拥有该英雄',
                'data': None
            }

        user = self.user_model.get_by_id(user_id)
        if not user or user.get('gold', 0) < price:
            return {
                'code': 1,
                'msg': '金币不足',
                'data': None
            }

        self.user_model.update_gold(user_id, -price)
        base_hp = hero.get('base_hp', 500)
        self.user_hero_model.create(user_id, hero_id, base_hp)

        return {
            'code': 0,
            'msg': '购买成功',
            'data': None
        }

    def select_hero(self, user_id: int, hero_id: int) -> Dict[str, Any]:
        user_hero = self.user_hero_model.get_by_user_hero(user_id, hero_id)
        if not user_hero:
            return {
                'code': 1,
                'msg': '您未拥有该英雄',
                'data': None
            }

        self.user_model.update_profile(user_id, {'current_hero_id': hero_id})

        user = self.user_model.get_by_id(user_id)
        return {
            'code': 0,
            'msg': '选择成功',
            'data': {'current_hero_id': user.get('current_hero_id', 0)}
        }

    def get_hero_battle_stats(self, user_id: int, hero_id: int) -> Dict[str, Any]:
        hero = self.hero_model.get_by_id(hero_id)
        if not hero:
            return {
                'code': 1,
                'msg': '英雄不存在',
                'data': None
            }

        user_hero = self.user_hero_model.get_by_user_hero(user_id, hero_id)
        if not user_hero:
            return {
                'code': 1,
                'msg': '您未拥有该英雄',
                'data': None
            }

        level = user_hero.get('level', 1)
        hero_type = hero.get('hero_type')

        level_bonus = self.hero_model.get_level_bonus(hero_type, level)

        equipment_bonus = self.user_equipment_model.get_total_bonuses(user_id)

        base_hp = hero.get('base_hp', 500)
        base_attack = hero.get('base_attack', 20)
        base_defense = hero.get('base_defense', 5)

        max_hp = base_hp + level_bonus['hp_bonus'] + equipment_bonus['hp_bonus']
        attack = base_attack + level_bonus['attack_bonus'] + equipment_bonus['attack_bonus']
        defense = base_defense + level_bonus['defense_bonus'] + equipment_bonus['defense_bonus']

        current_hp = user_hero.get('current_hp', max_hp)
        current_hp = min(current_hp, max_hp)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'hero_id': hero_id,
                'hero_name': hero.get('name'),
                'hero_icon': hero.get('icon'),
                'level': level,
                'max_hp': max_hp,
                'current_hp': current_hp,
                'attack': attack,
                'defense': defense,
                'attack_speed_bonus': equipment_bonus['attack_speed_bonus'],
                'special_effects': equipment_bonus['special_effects'],
                'level_bonus': level_bonus,
                'equipment_bonus': equipment_bonus
            }
        }

    def heal_hero(self, user_id: int, hero_id: int) -> Dict[str, Any]:
        user_hero = self.user_hero_model.get_by_user_hero(user_id, hero_id)
        if not user_hero:
            return {
                'code': 1,
                'msg': '您未拥有该英雄',
                'data': None
            }

        hero = self.hero_model.get_by_id(hero_id)
        if not hero:
            return {
                'code': 1,
                'msg': '英雄不存在',
                'data': None
            }

        level = user_hero.get('level', 1)
        level_bonus = self.hero_model.get_level_bonus(hero.get('hero_type'), level)
        equipment_bonus = self.user_equipment_model.get_total_bonuses(user_id)

        max_hp = hero.get('base_hp', 500) + level_bonus['hp_bonus'] + equipment_bonus['hp_bonus']

        self.user_hero_model.update_hp(user_id, hero_id, max_hp, max_hp)

        return {
            'code': 0,
            'msg': '恢复成功',
            'data': {'current_hp': max_hp, 'max_hp': max_hp}
        }

    def upgrade_skill(self, user_id: int, hero_id: int, skill_id: int) -> Dict[str, Any]:
        user_hero = self.user_hero_model.get_by_user_hero(user_id, hero_id)
        if not user_hero:
            return {
                'code': 1,
                'msg': '您未拥有该英雄',
                'data': None
            }

        if user_hero.get('skill_points', 0) <= 0:
            return {
                'code': 1,
                'msg': '没有可用的技能点',
                'data': None
            }

        skill = self.skill_model.get_by_id(skill_id)
        if not skill or skill.get('hero_id') != hero_id:
            return {
                'code': 1,
                'msg': '技能不存在',
                'data': None
            }

        import json
        skills_str = user_hero.get('skills', '[]')
        try:
            user_skills = json.loads(skills_str)
        except (json.JSONDecodeError, TypeError):
            user_skills = []

        skill_found = False
        for us in user_skills:
            if us.get('skill_id') == skill_id:
                skill_found = True
                if us.get('level', 0) >= skill.get('max_level', 4):
                    return {
                        'code': 1,
                        'msg': '技能已达最高等级',
                        'data': None
                    }
                us['level'] = us.get('level', 0) + 1
                break

        if not skill_found:
            user_skills.append({
                'skill_id': skill_id,
                'level': 1,
                'name': skill.get('name'),
                'icon': skill.get('icon')
            })

        self.user_hero_model.update_skills(user_id, hero_id, user_skills)
        self.user_hero_model.use_skill_point(user_id, hero_id)

        updated_hero = self.user_hero_model.get_by_user_hero(user_id, hero_id)

        return {
            'code': 0,
            'msg': '升级成功',
            'data': {
                'skills': user_skills,
                'skill_points': updated_hero.get('skill_points', 0) if updated_hero else 0
            }
        }
