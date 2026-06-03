from typing import Dict, Any, Optional
from app.model.ty_model import WeaponModel, UserModel


class TyWeaponBusiness:
    def __init__(self):
        self.weapon_model = WeaponModel()
        self.user_model = UserModel()

    def create_weapon(self, user_id: int, name: str, doodle_data: str,
                      weapon_type: str = 'custom', attack: int = 10,
                      defense: int = 5, speed: int = 5,
                      doodle_style: str = 'normal', color_palette: str = '',
                      description: str = '') -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        if not self.user_model.use_paint_and_canvas(user_id, 1, 1):
            return {
                'code': 1,
                'msg': '颜料或画布不足',
                'data': None
            }

        if not name or len(name) > 50:
            return {
                'code': 1,
                'msg': '武器名称不能为空且长度不能超过50',
                'data': None
            }

        if not doodle_data:
            return {
                'code': 1,
                'msg': '涂鸦数据不能为空',
                'data': None
            }

        attack = max(1, min(50, attack))
        defense = max(1, min(50, defense))
        speed = max(1, min(50, speed))

        weapon_id = self.weapon_model.create(
            user_id=user_id,
            name=name,
            doodle_data=doodle_data,
            weapon_type=weapon_type,
            attack=attack,
            defense=defense,
            speed=speed,
            doodle_style=doodle_style,
            color_palette=color_palette,
            description=description
        )

        if weapon_id > 0:
            weapon = self.weapon_model.get_by_id(weapon_id)
            return {
                'code': 0,
                'msg': '武器创建成功',
                'data': self.weapon_model.to_public_dict(weapon)
            }

        self.user_model.add_paint(user_id, 1)
        self.user_model.add_canvas(user_id, 1)
        return {
            'code': 1,
            'msg': '武器创建失败',
            'data': None
        }

    def get_weapon_by_id(self, weapon_id: int, user_id: int = None) -> Dict[str, Any]:
        weapon = self.weapon_model.get_by_id(weapon_id)
        if not weapon:
            return {
                'code': 1,
                'msg': '武器不存在',
                'data': None
            }

        if weapon.get('status') == self.weapon_model.STATUS_DELETED:
            return {
                'code': 1,
                'msg': '武器已被删除',
                'data': None
            }

        if user_id and weapon.get('user_id') != user_id and not weapon.get('is_shared'):
            return {
                'code': 1,
                'msg': '无权查看该武器',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.weapon_model.to_public_dict(weapon)
        }

    def get_user_weapons(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.weapon_model.get_by_user_id(user_id, page, page_size)
        items = [self.weapon_model.to_public_dict(item) for item in result.get('items', [])]

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

    def get_shared_weapons(self, page: int = 1, page_size: int = 10,
                           rarity: int = None, weapon_type: str = None,
                           keyword: str = None) -> Dict[str, Any]:
        result = self.weapon_model.get_shared_weapons(page, page_size, rarity, weapon_type, keyword)
        items = [self.weapon_model.to_public_dict(item) for item in result.get('items', [])]

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

    def update_weapon(self, weapon_id: int, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        weapon = self.weapon_model.get_by_id(weapon_id)
        if not weapon:
            return {
                'code': 1,
                'msg': '武器不存在',
                'data': None
            }

        if weapon.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权修改该武器',
                'data': None
            }

        affected = self.weapon_model.update(weapon_id, data)
        if affected >= 0:
            updated_weapon = self.weapon_model.get_by_id(weapon_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.weapon_model.to_public_dict(updated_weapon)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def share_weapon(self, weapon_id: int, user_id: int, is_shared: bool = True) -> Dict[str, Any]:
        return self.update_weapon(weapon_id, user_id, {'is_shared': 1 if is_shared else 0})

    def repair_weapon(self, weapon_id: int, user_id: int) -> Dict[str, Any]:
        weapon = self.weapon_model.get_by_id(weapon_id)
        if not weapon:
            return {
                'code': 1,
                'msg': '武器不存在',
                'data': None
            }

        if weapon.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权维修该武器',
                'data': None
            }

        user = self.user_model.get_by_id(user_id)
        repair_cost = 20
        if user.get('gold', 0) < repair_cost:
            return {
                'code': 1,
                'msg': f'金币不足，需要{repair_cost}金币',
                'data': None
            }

        self.user_model.add_gold(user_id, -repair_cost)
        affected = self.weapon_model.repair(weapon_id)

        if affected > 0:
            updated_weapon = self.weapon_model.get_by_id(weapon_id)
            return {
                'code': 0,
                'msg': '维修成功',
                'data': self.weapon_model.to_public_dict(updated_weapon)
            }

        self.user_model.add_gold(user_id, repair_cost)
        return {
            'code': 1,
            'msg': '维修失败',
            'data': None
        }

    def delete_weapon(self, weapon_id: int, user_id: int) -> Dict[str, Any]:
        weapon = self.weapon_model.get_by_id(weapon_id)
        if not weapon:
            return {
                'code': 1,
                'msg': '武器不存在',
                'data': None
            }

        if weapon.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权删除该武器',
                'data': None
            }

        affected = self.weapon_model.delete(weapon_id)
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

    def add_weapon_exp(self, weapon_id: int, exp: int) -> Dict[str, Any]:
        result = self.weapon_model.add_exp(weapon_id, exp)
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
