from typing import Dict, Any, List, Optional
from app.model.hd_model import SkillModel, UserSkillModel, UserModel


class HdSkillBusiness:
    def __init__(self):
        self.skill_model = SkillModel()
        self.user_skill_model = UserSkillModel()
        self.user_model = UserModel()

    def get_all_skills(self) -> Dict[str, Any]:
        result = self.skill_model.get_all(page=1, page_size=1000)
        items = [self.skill_model.to_dict(item) for item in result.get('items', [])]
        
        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_user_skills(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        skills = self.user_skill_model.get_user_skills(user_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': skills
        }

    def learn_skill(self, user_id: int, skill_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        skill = self.skill_model.get_by_id(skill_id)
        if not skill:
            return {
                'code': 1,
                'msg': '技能不存在',
                'data': None
            }

        if self.user_skill_model.has_skill(user_id, skill_id):
            return {
                'code': 1,
                'msg': '已学习该技能',
                'data': None
            }

        user_exp = user.get('exp', 0)
        unlock_exp = skill.get('unlock_exp', 0)
        if user_exp < unlock_exp:
            return {
                'code': 1,
                'msg': f'经验值不足，需要 {unlock_exp} 经验值解锁',
                'data': {
                    'current_exp': user_exp,
                    'required_exp': unlock_exp
                }
            }

        result = self.user_skill_model.learn_skill(user_id, skill_id)
        if result.get('success'):
            user_skill = self.user_skill_model.get_user_skill(user_id, skill_id)
            return {
                'code': 0,
                'msg': result.get('message', '学习成功'),
                'data': user_skill
            }

        return {
            'code': 1,
            'msg': result.get('message', '学习失败'),
            'data': None
        }

    def upgrade_skill(self, user_id: int, user_skill_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        user_skill = self.user_skill_model.get_by_id(user_skill_id)
        if not user_skill:
            return {
                'code': 1,
                'msg': '用户技能不存在',
                'data': None
            }

        if user_skill.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权操作该技能',
                'data': None
            }

        skill_id = user_skill.get('skill_id')
        current_level = user_skill.get('level', 1)
        if current_level >= self.user_skill_model.MAX_LEVEL:
            return {
                'code': 1,
                'msg': '技能已达最高等级',
                'data': None
            }

        exp_needed = self.user_skill_model._get_exp_needed(current_level)
        user_exp = user.get('exp', 0)

        if user_exp < exp_needed:
            return {
                'code': 1,
                'msg': f'经验值不足，升级需要 {exp_needed} 经验值',
                'data': {
                    'current_exp': user_exp,
                    'required_exp': exp_needed
                }
            }

        self.user_model.add_exp(user_id, -exp_needed)
        result = self.user_skill_model.upgrade_skill(user_id, skill_id, exp_needed)

        if result.get('success'):
            updated_skill = self.user_skill_model.get_user_skill(user_id, skill_id)
            return {
                'code': 0,
                'msg': result.get('message', '升级成功'),
                'data': {
                    'skill': updated_skill,
                    'level_up': result.get('level_up', False),
                    'new_level': result.get('new_level'),
                    'user_exp': user.get('exp', 0) - exp_needed
                }
            }

        self.user_model.add_exp(user_id, exp_needed)
        return {
            'code': 1,
            'msg': result.get('message', '升级失败'),
            'data': None
        }

    def toggle_skill_active(self, user_id: int, user_skill_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        user_skill = self.user_skill_model.get_by_id(user_skill_id)
        if not user_skill:
            return {
                'code': 1,
                'msg': '用户技能不存在',
                'data': None
            }

        if user_skill.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权操作该技能',
                'data': None
            }

        skill_id = user_skill.get('skill_id')
        result = self.user_skill_model.toggle_active(user_id, skill_id)

        if result.get('success'):
            return {
                'code': 0,
                'msg': result.get('message', '操作成功'),
                'data': {
                    'is_active': result.get('is_active')
                }
            }

        return {
            'code': 1,
            'msg': result.get('message', '操作失败'),
            'data': None
        }

    def get_skill_detail(self, skill_id: int) -> Dict[str, Any]:
        skill = self.skill_model.get_by_id(skill_id)
        if not skill:
            return {
                'code': 1,
                'msg': '技能不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.skill_model.to_dict(skill)
        }

    def create_skill(self, data: Dict[str, Any]) -> Dict[str, Any]:
        name = data.get('name', '').strip()
        if not name:
            return {
                'code': 1,
                'msg': '技能名称不能为空',
                'data': None
            }

        existing = self.skill_model.get_by_name(name)
        if existing:
            return {
                'code': 1,
                'msg': '技能名称已存在',
                'data': None
            }

        skill_type = data.get('type')
        if skill_type is None or skill_type not in self.skill_model.TYPE_MAP:
            return {
                'code': 1,
                'msg': '技能类型不正确',
                'data': None
            }

        level = data.get('level', 1)
        if level < 1 or level > 10:
            return {
                'code': 1,
                'msg': '技能等级必须在1-10之间',
                'data': None
            }

        skill_id = self.skill_model.create(
            name=name,
            description=data.get('description', ''),
            skill_type=skill_type,
            level=level,
            damage=data.get('damage', 0),
            chakra_cost=data.get('chakra_cost', 0),
            cooldown=data.get('cooldown', 0),
            unlock_exp=data.get('unlock_exp', 0),
            icon=data.get('icon', '')
        )

        if skill_id > 0:
            skill = self.skill_model.get_by_id(skill_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.skill_model.to_dict(skill)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_skill(self, skill_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        skill = self.skill_model.get_by_id(skill_id)
        if not skill:
            return {
                'code': 1,
                'msg': '技能不存在',
                'data': None
            }

        if 'name' in data and data['name'] != skill.get('name'):
            existing = self.skill_model.get_by_name(data['name'])
            if existing:
                return {
                    'code': 1,
                    'msg': '技能名称已存在',
                    'data': None
                }

        if 'type' in data and data['type'] not in self.skill_model.TYPE_MAP:
            return {
                'code': 1,
                'msg': '技能类型不正确',
                'data': None
            }

        if 'level' in data and (data['level'] < 1 or data['level'] > 10):
            return {
                'code': 1,
                'msg': '技能等级必须在1-10之间',
                'data': None
            }

        affected = self.skill_model.update(skill_id, data)
        if affected >= 0:
            updated_skill = self.skill_model.get_by_id(skill_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.skill_model.to_dict(updated_skill)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_skill(self, skill_id: int) -> Dict[str, Any]:
        skill = self.skill_model.get_by_id(skill_id)
        if not skill:
            return {
                'code': 1,
                'msg': '技能不存在',
                'data': None
            }

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
