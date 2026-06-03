from typing import Dict, Any, List
from app.model.yp_model import CharacterModel, UserCharacterModel, UserModel


class YpCharacterBusiness:
    def __init__(self):
        self.character_model = CharacterModel()
        self.user_character_model = UserCharacterModel()
        self.user_model = UserModel()

    def get_all_characters(self) -> Dict[str, Any]:
        characters = self.character_model.get_all_active()
        result = [self.character_model.to_public_dict(c) for c in characters]
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_user_characters(self, user_id: int) -> Dict[str, Any]:
        user_chars = self.user_character_model.get_by_user_id(user_id)
        result = [self.user_character_model.to_public_dict(uc) for uc in user_chars]
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_using_character(self, user_id: int) -> Dict[str, Any]:
        using_char = self.user_character_model.get_using_character(user_id)
        if not using_char:
            return {
                'code': 1,
                'msg': '未选择角色',
                'data': None
            }
        return {
            'code': 0,
            'msg': 'success',
            'data': self.user_character_model.to_public_dict(using_char)
        }

    def set_using_character(self, user_id: int, character_id: int) -> Dict[str, Any]:
        if not self.user_character_model.owns_character(user_id, character_id):
            return {
                'code': 1,
                'msg': '尚未拥有该角色',
                'data': None
            }

        affected = self.user_character_model.set_using_character(user_id, character_id)
        if affected > 0:
            using_char = self.user_character_model.get_using_character(user_id)
            return {
                'code': 0,
                'msg': '切换成功',
                'data': self.user_character_model.to_public_dict(using_char) if using_char else None
            }

        return {
            'code': 1,
            'msg': '切换失败',
            'data': None
        }

    def purchase_character(self, user_id: int, character_id: int) -> Dict[str, Any]:
        if self.user_character_model.owns_character(user_id, character_id):
            return {
                'code': 1,
                'msg': '已拥有该角色',
                'data': None
            }

        character = self.character_model.get_by_id(character_id)
        if not character or character.get('is_active') == 0:
            return {
                'code': 1,
                'msg': '角色不存在或已下架',
                'data': None
            }

        price = character.get('price', 0)
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        user_coins = user.get('coins', 0)
        if user_coins < price:
            return {
                'code': 1,
                'msg': '金币不足',
                'data': None
            }

        from app.common.sqlite.orm_exec import ORMExec
        with ORMExec('').transaction():
            self.user_character_model.create(user_id, character_id)
            self.user_model.exec.update_by_id(user_id, {'coins': user_coins - price})

        updated_user = self.user_model.get_by_id(user_id)
        return {
            'code': 0,
            'msg': '购买成功',
            'data': {
                'user': self.user_model.to_public_dict(updated_user),
                'character': self.character_model.to_public_dict(character)
            }
        }

    def create_character(self, data: Dict[str, Any]) -> Dict[str, Any]:
        char_id = self.character_model.create(data)
        if char_id > 0:
            character = self.character_model.get_by_id(char_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.character_model.to_public_dict(character) if character else None
            }
        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_character(self, character_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        affected = self.character_model.update(character_id, data)
        if affected > 0:
            character = self.character_model.get_by_id(character_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.character_model.to_public_dict(character) if character else None
            }
        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_character(self, character_id: int) -> Dict[str, Any]:
        affected = self.character_model.delete(character_id)
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
