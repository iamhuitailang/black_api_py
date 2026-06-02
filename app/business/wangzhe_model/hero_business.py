from typing import Dict, Any, Optional
from app.model.wangzhe_model import HeroModel, UserHeroModel, UserModel


class WangzheHeroBusiness:
    def __init__(self):
        self.hero_model = HeroModel()
        self.user_hero_model = UserHeroModel()
        self.user_model = UserModel()

    def get_hero_list(self, page: int = 1, page_size: int = 20, position: str = None,
                      difficulty: str = None, keyword: str = None) -> Dict[str, Any]:
        result = self.hero_model.get_all(page, page_size, position, difficulty, keyword, status=0)
        items = [self.hero_model.to_public_dict(item) for item in result.get('items', [])]

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

    def get_hero_detail(self, hero_id: int) -> Dict[str, Any]:
        hero = self.hero_model.get_by_id(hero_id)
        if not hero or hero.get('status') != 0:
            return {
                'code': 1,
                'msg': '英雄不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.hero_model.to_public_dict(hero)
        }

    def get_user_hero_list(self, user_id: int) -> Dict[str, Any]:
        user_heroes = self.user_hero_model.get_by_user_id(user_id)
        owned_hero_ids = [uh.get('hero_id') for uh in user_heroes if uh.get('purchased')]

        result = self.hero_model.get_all(page=1, page_size=100, status=0)
        items = []
        for hero in result.get('items', []):
            hero_dict = self.hero_model.to_public_dict(hero)
            hero_dict['owned'] = hero.get('id') in owned_hero_ids

            user_hero = next((uh for uh in user_heroes if uh.get('hero_id') == hero.get('id')), None)
            if user_hero:
                hero_dict['user_stats'] = self.user_hero_model.to_public_dict(user_hero)
            else:
                hero_dict['user_stats'] = None

            items.append(hero_dict)

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def purchase_hero(self, user_id: int, hero_id: int) -> Dict[str, Any]:
        hero = self.hero_model.get_by_id(hero_id)
        if not hero or hero.get('status') != 0:
            return {
                'code': 1,
                'msg': '英雄不存在',
                'data': None
            }

        if self.user_hero_model.owns_hero(user_id, hero_id):
            return {
                'code': 1,
                'msg': '您已经拥有该英雄',
                'data': None
            }

        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        price = hero.get('price', 0)
        if user.get('gold', 0) < price:
            return {
                'code': 1,
                'msg': '金币不足',
                'data': None
            }

        self.user_model.update_gold(user_id, -price)
        result = self.user_hero_model.purchase_hero(user_id, hero_id)

        if result > 0:
            return {
                'code': 0,
                'msg': '购买成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '购买失败',
            'data': None
        }

    def create_hero(self, **kwargs) -> Dict[str, Any]:
        name = kwargs.get('name')
        if not name:
            return {
                'code': 1,
                'msg': '英雄名称不能为空',
                'data': None
            }

        existing = self.hero_model.get_by_name(name)
        if existing:
            return {
                'code': 1,
                'msg': '该英雄名称已存在',
                'data': None
            }

        hero_id = self.hero_model.create(**kwargs)
        if hero_id > 0:
            hero = self.hero_model.get_by_id(hero_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.hero_model.to_public_dict(hero)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_hero(self, hero_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        hero = self.hero_model.get_by_id(hero_id)
        if not hero:
            return {
                'code': 1,
                'msg': '英雄不存在',
                'data': None
            }

        name = data.get('name')
        if name and name != hero.get('name'):
            existing = self.hero_model.get_by_name(name)
            if existing:
                return {
                    'code': 1,
                    'msg': '该英雄名称已存在',
                    'data': None
                }

        affected = self.hero_model.update(hero_id, data)
        if affected > 0:
            updated_hero = self.hero_model.get_by_id(hero_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.hero_model.to_public_dict(updated_hero)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_hero(self, hero_id: int) -> Dict[str, Any]:
        hero = self.hero_model.get_by_id(hero_id)
        if not hero:
            return {
                'code': 1,
                'msg': '英雄不存在',
                'data': None
            }

        affected = self.hero_model.delete(hero_id)
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

    def get_admin_hero_list(self, page: int = 1, page_size: int = 20, position: str = None,
                            difficulty: str = None, keyword: str = None, status: int = None) -> Dict[str, Any]:
        result = self.hero_model.get_all(page, page_size, position, difficulty, keyword, status)
        items = [self.hero_model.to_public_dict(item) for item in result.get('items', [])]

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
