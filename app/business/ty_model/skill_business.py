from typing import Dict, Any, Optional
from app.model.ty_model import SkillModel, UserSkillModel, UserModel


class TySkillBusiness:
    def __init__(self):
        self.skill_model = SkillModel()
        self.user_skill_model = UserSkillModel()
        self.user_model = UserModel()

    def get_all_skills(self, page: int = 1, page_size: int = 20,
                       category: str = None, user_level: int = None) -> Dict[str, Any]:
        if user_level:
            result = self.skill_model.get_available_for_level(user_level, page, page_size)
        else:
            result = self.skill_model.get_all(page, page_size, category)

        items = [self.skill_model.to_public_dict(item) for item in result.get('items', [])]

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_user_skills(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.user_skill_model.get_by_user_id(user_id, page, page_size)
        items = [self.user_skill_model.to_public_dict(item) for item in result.get('items', [])]

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_equipped_skills(self, user_id: int) -> Dict[str, Any]:
        items = self.user_skill_model.get_equipped_skills(user_id)
        result = [self.user_skill_model.to_public_dict(item) for item in items]

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def unlock_skill(self, user_id: int, skill_id: int) -> Dict[str, Any]:
        skill = self.skill_model.get_by_id(skill_id)
        if not skill:
            return {
                'code': 1,
                'msg': '技能不存在',
                'data': None
            }

        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        if user.get('level', 1) < skill.get('unlock_level', 1):
            return {
                'code': 1,
                'msg': f'等级不足，需要{skill.get("unlock_level", 1)}级',
                'data': None
            }

        if self.user_skill_model.has_skill(user_id, skill_id):
            return {
                'code': 1,
                'msg': '已解锁该技能',
                'data': None
            }

        gold_cost = skill.get('gold_cost', 100)
        exp_cost = skill.get('exp_cost', 50)

        if user.get('gold', 0) < gold_cost:
            return {
                'code': 1,
                'msg': f'金币不足，需要{gold_cost}金币',
                'data': None
            }

        self.user_model.add_gold(user_id, -gold_cost)
        self.user_model.add_exp(user_id, -exp_cost)

        user_skill_id = self.user_skill_model.unlock_skill(user_id, skill_id)

        if user_skill_id > 0:
            return {
                'code': 0,
                'msg': '技能解锁成功',
                'data': {'user_skill_id': user_skill_id}
            }

        self.user_model.add_gold(user_id, gold_cost)
        return {
            'code': 1,
            'msg': '技能解锁失败',
            'data': None
        }

    def upgrade_skill(self, user_id: int, skill_id: int) -> Dict[str, Any]:
        if not self.user_skill_model.has_skill(user_id, skill_id):
            return {
                'code': 1,
                'msg': '未解锁该技能',
                'data': None
            }

        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        skill = self.skill_model.get_by_id(skill_id)
        current_level = self.user_skill_model.get_skill_level(user_id, skill_id)

        if current_level >= skill.get('max_level', 10):
            return {
                'code': 1,
                'msg': '已达最高等级',
                'data': None
            }

        upgrade_cost = current_level * 50
        if user.get('gold', 0) < upgrade_cost:
            return {
                'code': 1,
                'msg': f'金币不足，需要{upgrade_cost}金币',
                'data': None
            }

        self.user_model.add_gold(user_id, -upgrade_cost)
        result = self.user_skill_model.upgrade_skill(user_id, skill_id)

        if result.get('success'):
            return {
                'code': 0,
                'msg': result.get('msg', '升级成功'),
                'data': {'new_level': result.get('new_level')}
            }

        self.user_model.add_gold(user_id, upgrade_cost)
        return {
            'code': 1,
            'msg': result.get('msg', '升级失败'),
            'data': None
        }

    def equip_skill(self, user_id: int, skill_id: int, equip: bool = True) -> Dict[str, Any]:
        if not self.user_skill_model.has_skill(user_id, skill_id):
            return {
                'code': 1,
                'msg': '未解锁该技能',
                'data': None
            }

        if equip:
            equipped = self.user_skill_model.get_equipped_skills(user_id)
            if len(equipped) >= 4:
                return {
                    'code': 1,
                    'msg': '最多装备4个技能',
                    'data': None
                }

        affected = self.user_skill_model.equip_skill(user_id, skill_id, equip)
        if affected > 0:
            return {
                'code': 0,
                'msg': f'{"装备" if equip else "卸下"}成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': f'{"装备" if equip else "卸下"}失败',
            'data': None
        }

    def add_skill_exp(self, user_id: int, skill_id: int, exp: int) -> Dict[str, Any]:
        if not self.user_skill_model.has_skill(user_id, skill_id):
            return {
                'code': 1,
                'msg': '未解锁该技能',
                'data': None
            }

        result = self.user_skill_model.add_exp(user_id, skill_id, exp)
        if result.get('success'):
            return {
                'code': 0,
                'msg': '经验添加成功',
                'data': result
            }
        return {
            'code': 1,
            'msg': '经验添加失败',
            'data': None
        }

    def create_skill(self, name: str, category: str, description: str = '',
                     icon: str = '', max_level: int = 10,
                     base_effect: str = '', effect_per_level: str = '',
                     unlock_level: int = 1, gold_cost: int = 100,
                     exp_cost: int = 50) -> Dict[str, Any]:
        skill_id = self.skill_model.create(
            name=name,
            category=category,
            description=description,
            icon=icon,
            max_level=max_level,
            base_effect=base_effect,
            effect_per_level=effect_per_level,
            unlock_level=unlock_level,
            gold_cost=gold_cost,
            exp_cost=exp_cost
        )

        if skill_id > 0:
            skill = self.skill_model.get_by_id(skill_id)
            return {
                'code': 0,
                'msg': '技能创建成功',
                'data': self.skill_model.to_public_dict(skill)
            }

        return {
            'code': 1,
            'msg': '技能创建失败',
            'data': None
        }
