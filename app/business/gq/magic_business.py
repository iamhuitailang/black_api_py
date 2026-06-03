from typing import Dict, Any
from app.model.gq_model import GqMagicModel, GqUserMagicModel, GqUserModel


class GqMagicBusiness:
    def __init__(self):
        self.magic_model = GqMagicModel()
        self.user_magic_model = GqUserMagicModel()
        self.user_model = GqUserModel()

    def get_magic_list(self, page: int = 1, page_size: int = 10,
                       type: str = None, rarity: int = None) -> Dict[str, Any]:
        result = self.magic_model.get_all(page, page_size, type, rarity)
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': result.get('items', []),
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_magic_detail(self, magic_id: int) -> Dict[str, Any]:
        magic = self.magic_model.get_by_id(magic_id)
        if not magic:
            return {
                'code': 1,
                'msg': '魔法特效不存在',
                'data': None
            }
        return {
            'code': 0,
            'msg': 'success',
            'data': magic
        }

    def get_user_magics(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        user_magics = self.user_magic_model.get_user_magics(user_id)
        magic_map = {}
        for um in user_magics:
            magic = self.magic_model.get_by_id(um['magic_id'])
            if magic:
                item = dict(magic)
                item['is_equipped'] = um.get('is_equipped', 0)
                item['owned'] = True
                magic_map[magic['id']] = item

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': list(magic_map.values()),
                'total': len(magic_map)
            }
        }

    def unlock_magic(self, user_id: int, magic_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        magic = self.magic_model.get_by_id(magic_id)
        if not magic:
            return {
                'code': 1,
                'msg': '魔法特效不存在',
                'data': None
            }

        if self.user_magic_model.has_magic(user_id, magic_id):
            return {
                'code': 1,
                'msg': '已拥有该魔法特效',
                'data': None
            }

        if user.get('level', 1) < magic.get('unlock_level', 1):
            return {
                'code': 1,
                'msg': f'等级不足，需要等级{magic.get("unlock_level")}',
                'data': None
            }

        unlock_coins = magic.get('unlock_coins', 0)
        if unlock_coins > 0 and user.get('coins', 0) < unlock_coins:
            return {
                'code': 1,
                'msg': '金币不足',
                'data': None
            }

        if unlock_coins > 0:
            self.user_model.update_currency(user_id, -unlock_coins, 0)

        self.user_magic_model.create(user_id, magic_id)

        updated_user = self.user_model.get_by_id(user_id)
        return {
            'code': 0,
            'msg': '解锁成功',
            'data': {
                'magic_id': magic_id,
                'user': self.user_model.to_public_dict(updated_user)
            }
        }

    def equip_magic(self, user_id: int, magic_id: int) -> Dict[str, Any]:
        if not self.user_magic_model.has_magic(user_id, magic_id):
            return {
                'code': 1,
                'msg': '未拥有该魔法特效',
                'data': None
            }

        self.user_magic_model.equip_magic(user_id, magic_id)
        magic = self.magic_model.get_by_id(magic_id)
        return {
            'code': 0,
            'msg': '装备成功',
            'data': {
                'magic_id': magic_id,
                'magic': magic
            }
        }

    def unequip_magic(self, user_id: int, magic_id: int) -> Dict[str, Any]:
        if not self.user_magic_model.has_magic(user_id, magic_id):
            return {
                'code': 1,
                'msg': '未拥有该魔法特效',
                'data': None
            }

        self.user_magic_model.unequip_magic(user_id, magic_id)
        return {
            'code': 0,
            'msg': '取消装备成功',
            'data': {
                'magic_id': magic_id
            }
        }

    def get_equipped_magics(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        equipped = self.user_magic_model.get_equipped_magics(user_id)
        result = []
        for um in equipped:
            magic = self.magic_model.get_by_id(um['magic_id'])
            if magic:
                item = dict(magic)
                item['is_equipped'] = 1
                result.append(item)

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }
