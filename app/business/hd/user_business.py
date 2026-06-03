from typing import Dict, Any, Optional
from app.model.hd_model import UserModel, TokenModel, LevelModel
import re


class HdUserBusiness:
    def __init__(self):
        self.user_model = UserModel()
        self.token_model = TokenModel()
        self.level_model = LevelModel()
        self._exp_per_level = 100

    def _validate_username(self, username: str) -> bool:
        if not username or len(username) < 3 or len(username) > 20:
            return False
        pattern = r'^[a-zA-Z0-9_]+$'
        return re.match(pattern, username) is not None

    def _validate_password(self, password: str) -> bool:
        if not password or len(password) < 6:
            return False
        return True

    def _get_exp_needed(self, level: int) -> int:
        return self._exp_per_level * level

    def _check_level_up(self, user_id: int, current_level: int, current_exp: int) -> int:
        new_level = current_level
        exp_needed = self._get_exp_needed(current_level)
        
        while current_exp >= exp_needed:
            current_exp -= exp_needed
            new_level += 1
            exp_needed = self._get_exp_needed(new_level)
        
        if new_level > current_level:
            max_chakra = 100 + (new_level - 1) * 20
            self.user_model.update(user_id, {
                'level': new_level,
                'exp': current_exp,
                'max_chakra': max_chakra,
                'chakra': max_chakra
            })
        return new_level

    def register(self, username: str, password: str, nickname: str = '') -> Dict[str, Any]:
        if not self._validate_username(username):
            return {
                'code': 1,
                'msg': '用户名格式不正确，长度3-20位，只能包含字母、数字和下划线',
                'data': None
            }

        if not self._validate_password(password):
            return {
                'code': 1,
                'msg': '密码长度至少6位',
                'data': None
            }

        existing_user = self.user_model.get_by_username(username)
        if existing_user:
            return {
                'code': 1,
                'msg': '该用户名已存在',
                'data': None
            }

        user_id = self.user_model.create(username, password, nickname)
        if user_id > 0:
            token = self.token_model.create_token(user_id, hours=24)
            user = self.user_model.get_by_id(user_id)
            return {
                'code': 0,
                'msg': '注册成功',
                'data': {
                    'user': self.user_model.to_public_dict(user),
                    'token': token
                }
            }

        return {
            'code': 1,
            'msg': '注册失败',
            'data': None
        }

    def login(self, username: str, password: str) -> Dict[str, Any]:
        if not username:
            return {
                'code': 1,
                'msg': '用户名不能为空',
                'data': None
            }

        if not password:
            return {
                'code': 1,
                'msg': '密码不能为空',
                'data': None
            }

        user = self.user_model.verify_password(username, password)
        if user is None:
            return {
                'code': 1,
                'msg': '用户名或密码错误',
                'data': None
            }

        if user.get('status') == self.user_model.STATUS_BANNED:
            return {
                'code': 1,
                'msg': '账号已被封号，请联系管理员',
                'data': None
            }

        self.token_model.delete_by_user_id(user.get('id'))
        token = self.token_model.create_token(user.get('id'), hours=24)

        user_full = self.user_model.get_by_id(user.get('id'))
        return {
            'code': 0,
            'msg': '登录成功',
            'data': {
                'user': self.user_model.to_public_dict(user_full),
                'token': token
            }
        }

    def logout(self, token: str) -> Dict[str, Any]:
        if not token:
            return {
                'code': 0,
                'msg': 'success',
                'data': None
            }

        self.token_model.delete_token(token)
        return {
            'code': 0,
            'msg': '退出成功',
            'data': None
        }

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        return self.token_model.get_user_by_token(token)

    def get_current_user(self, token: str) -> Dict[str, Any]:
        user = self.token_model.get_user_by_token(token)
        if user:
            return {
                'code': 0,
                'msg': 'success',
                'data': user
            }

        return {
            'code': 1,
            'msg': 'token无效或已过期',
            'data': None
        }

    def update_profile(self, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        update_data = {}
        if 'nickname' in data:
            update_data['nickname'] = data['nickname']
        if 'avatar' in data:
            update_data['avatar'] = data['avatar']

        if not update_data:
            return {
                'code': 1,
                'msg': '没有需要更新的内容',
                'data': None
            }

        affected = self.user_model.update(user_id, update_data)
        if affected >= 0:
            updated_user = self.user_model.get_by_id(user_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.user_model.to_public_dict(updated_user)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def change_password(self, user_id: int, old_password: str, new_password: str) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        username = user.get('username', '')
        verify_result = self.user_model.verify_password(username, old_password)
        if verify_result is None:
            return {
                'code': 1,
                'msg': '原密码错误',
                'data': None
            }

        if not self._validate_password(new_password):
            return {
                'code': 1,
                'msg': '新密码长度至少6位',
                'data': None
            }

        if old_password == new_password:
            return {
                'code': 1,
                'msg': '新密码不能与旧密码相同',
                'data': None
            }

        affected = self.user_model.update_password(user_id, new_password)
        if affected > 0:
            self.token_model.delete_by_user_id(user_id)
            return {
                'code': 0,
                'msg': '密码修改成功，请重新登录',
                'data': None
            }

        return {
            'code': 1,
            'msg': '密码修改失败',
            'data': None
        }

    def add_exp(self, user_id: int, exp: int) -> Dict[str, Any]:
        if exp <= 0:
            return {
                'code': 1,
                'msg': '经验值必须大于0',
                'data': None
            }

        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        current_level = user.get('level', 1)
        current_exp = user.get('exp', 0)
        new_exp = current_exp + exp

        self.user_model.add_exp(user_id, exp)
        new_level = self._check_level_up(user_id, current_level, new_exp)

        updated_user = self.user_model.get_by_id(user_id)
        level_up = new_level > current_level

        return {
            'code': 0,
            'msg': '经验增加成功' if not level_up else '恭喜升级！',
            'data': {
                'user': self.user_model.to_public_dict(updated_user),
                'level_up': level_up,
                'old_level': current_level,
                'new_level': new_level
            }
        }

    def update_chakra(self, user_id: int, delta: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        affected = self.user_model.update_chakra(user_id, delta)
        if affected >= 0:
            updated_user = self.user_model.get_by_id(user_id)
            return {
                'code': 0,
                'msg': '查克拉更新成功',
                'data': {
                    'chakra': updated_user.get('chakra'),
                    'max_chakra': updated_user.get('max_chakra')
                }
            }

        return {
            'code': 1,
            'msg': '查克拉更新失败',
            'data': None
        }

    def update_gold(self, user_id: int, delta: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        affected = self.user_model.update_gold(user_id, delta)
        if affected >= 0:
            updated_user = self.user_model.get_by_id(user_id)
            return {
                'code': 0,
                'msg': '金币更新成功',
                'data': {
                    'gold': updated_user.get('gold')
                }
            }

        return {
            'code': 1,
            'msg': '金币更新失败',
            'data': None
        }

    def get_user_info(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.user_model.to_public_dict(user)
        }

    def get_user_list(self, page: int = 1, page_size: int = 10, keyword: str = None) -> Dict[str, Any]:
        result = self.user_model.get_all(page, page_size, keyword=keyword)
        items = [self.user_model.to_public_dict(item) for item in result.get('items', [])]

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
