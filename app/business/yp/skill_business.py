from typing import Dict, Any
from app.model.yp_model import SkillModel, UserSkillModel, UserModel


class YpSkillBusiness:
    def __init__(self):
        self.skill_model = SkillModel()
        self.user_skill_model = UserSkillModel()
        self.user_model = UserModel()

    def get_all_skills(self) -> Dict[str, Any]:
        skills = self.skill_model.get_all_active()
        result = [self.skill_model.to_public_dict(s) for s in skills]
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_user_skills(self, user_id: int) -> Dict[str, Any]:
        user_skills = self.user_skill_model.get_by_user_id(user_id)
        result = [self.user_skill_model.to_public_dict(us) for us in user_skills]
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_skill_tree(self, user_id: int) -> Dict[str, Any]:
        all_skills = self.skill_model.get_all_active()
        user_skills = self.user_skill_model.get_by_user_id(user_id)

        user_skill_map = {}
        for us in user_skills:
            user_skill_map[us.get('skill_id')] = us

        result = []
        for skill in all_skills:
            skill_dict = self.skill_model.to_public_dict(skill)
            skill_id = skill.get('id')

            if skill_id in user_skill_map:
                us = user_skill_map[skill_id]
                skill_dict['current_level'] = us.get('current_level', 0)
                skill_dict['upgrade_price'] = self.skill_model.calculate_upgrade_price(
                    skill.get('base_price', 100),
                    us.get('current_level', 0)
                )
                skill_dict['total_effect'] = skill.get('effect_value', 0) * us.get('current_level', 0)
                skill_dict['is_unlocked'] = True
            else:
                skill_dict['current_level'] = 0
                skill_dict['upgrade_price'] = skill.get('base_price', 100)
                skill_dict['total_effect'] = 0
                skill_dict['is_unlocked'] = False

            result.append(skill_dict)

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def upgrade_skill(self, user_id: int, skill_id: int) -> Dict[str, Any]:
        skill = self.skill_model.get_by_id(skill_id)
        if not skill or skill.get('is_active') == 0:
            return {
                'code': 1,
                'msg': '技能不存在或已下架',
                'data': None
            }

        user_skill = self.user_skill_model.get_user_skill(user_id, skill_id)
        max_level = skill.get('max_level', 5)
        current_level = user_skill.get('current_level', 0) if user_skill else 0

        if current_level >= max_level:
            return {
                'code': 1,
                'msg': '技能已达最高等级',
                'data': None
            }

        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        upgrade_price = self.skill_model.calculate_upgrade_price(
            skill.get('base_price', 100),
            current_level
        )

        user_coins = user.get('coins', 0)
        if user_coins < upgrade_price:
            return {
                'code': 1,
                'msg': '金币不足',
                'data': None
            }

        from app.common.sqlite.orm_exec import ORMExec
        with ORMExec('').transaction():
            self.user_skill_model.upgrade_skill(user_id, skill_id)
            self.user_model.exec.update_by_id(user_id, {'coins': user_coins - upgrade_price})

        updated_user = self.user_model.get_by_id(user_id)
        updated_user_skill = self.user_skill_model.get_user_skill(user_id, skill_id)

        return {
            'code': 0,
            'msg': '升级成功',
            'data': {
                'user': self.user_model.to_public_dict(updated_user) if updated_user else None,
                'skill': self.user_skill_model.to_public_dict(updated_user_skill) if updated_user_skill else None
            }
        }

    def get_user_skill_effects(self, user_id: int) -> Dict[str, Any]:
        effects = self.user_skill_model.get_skill_effects(user_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': effects
        }

    def create_skill(self, data: Dict[str, Any]) -> Dict[str, Any]:
        skill_id = self.skill_model.create(data)
        if skill_id > 0:
            skill = self.skill_model.get_by_id(skill_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.skill_model.to_public_dict(skill) if skill else None
            }
        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_skill(self, skill_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        affected = self.skill_model.update(skill_id, data)
        if affected > 0:
            skill = self.skill_model.get_by_id(skill_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.skill_model.to_public_dict(skill) if skill else None
            }
        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_skill(self, skill_id: int) -> Dict[str, Any]:
        affected = self.skill_model.delete(skill_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '删除成功',
                'data': None
            }
        return {
            'code': 1,
            'msg': '删除失败',
            'data': None
        }
