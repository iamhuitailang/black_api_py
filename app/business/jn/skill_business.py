from typing import Dict, Any, List, Optional
from app.model.jn import SkillModel, CategoryModel


class JnSkillBusiness:
    def __init__(self):
        self.skill_model = SkillModel()
        self.category_model = CategoryModel()

    def create_skill(self, user_id: int, name: str, category: str, skill_type: str,
                      level: str = '初级', description: str = '') -> Dict[str, Any]:
        if not name:
            return {
                'code': 1,
                'msg': '技能名称不能为空',
                'data': None
            }

        if not category:
            return {
                'code': 1,
                'msg': '请选择技能分类',
                'data': None
            }

        cat = self.category_model.get_by_code(category)
        if not cat:
            return {
                'code': 1,
                'msg': '技能分类不存在',
                'data': None
            }

        if skill_type not in [SkillModel.TYPE_OFFER, SkillModel.TYPE_NEED]:
            return {
                'code': 1,
                'msg': '技能类型无效',
                'data': None
            }

        if level not in [SkillModel.LEVEL_BEGINNER, SkillModel.LEVEL_INTERMEDIATE, SkillModel.LEVEL_ADVANCED]:
            level = SkillModel.LEVEL_BEGINNER

        skill_id = self.skill_model.create(
            user_id=user_id,
            name=name,
            category=category,
            skill_type=skill_type,
            level=level,
            description=description
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

    def update_skill(self, user_id: int, skill_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        skill = self.skill_model.get_by_id(skill_id)
        if not skill:
            return {
                'code': 1,
                'msg': '技能不存在',
                'data': None
            }

        if skill.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权操作此技能',
                'data': None
            }

        if 'category' in data:
            cat = self.category_model.get_by_code(data['category'])
            if not cat:
                return {
                    'code': 1,
                    'msg': '技能分类不存在',
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

    def delete_skill(self, user_id: int, skill_id: int) -> Dict[str, Any]:
        skill = self.skill_model.get_by_id(skill_id)
        if not skill:
            return {
                'code': 1,
                'msg': '技能不存在',
                'data': None
            }

        if skill.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权操作此技能',
                'data': None
            }

        affected = self.skill_model.deactivate(skill_id)
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

    def get_user_skills(self, user_id: int, skill_type: str = None) -> Dict[str, Any]:
        skills = self.skill_model.get_by_user(user_id, skill_type)
        return {
            'code': 0,
            'msg': 'success',
            'data': [self.skill_model.to_dict(skill) for skill in skills]
        }

    def get_skill_detail(self, skill_id: int) -> Dict[str, Any]:
        skill = self.skill_model.get_by_id(skill_id)
        if not skill or skill.get('is_active') != 1:
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

    def search_skills(self, keyword: str = '', skill_type: str = None,
                       category: str = None, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        if keyword:
            result = self.skill_model.search(keyword, page, page_size, skill_type, category)
        else:
            result = self.skill_model.get_by_type(skill_type or SkillModel.TYPE_OFFER, page, page_size, category)

        items = [self.skill_model.to_dict(item) for item in result.get('items', [])]

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

    def get_all_skills(self, page: int = 1, page_size: int = 10,
                       skill_type: str = None, category: str = None,
                       user_id: int = None, keyword: str = None) -> Dict[str, Any]:
        result = self.skill_model.get_all(page, page_size, skill_type, category, user_id, keyword)
        items = [self.skill_model.to_dict(item) for item in result.get('items', [])]

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
