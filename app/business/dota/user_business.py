from typing import Dict, Any, Optional
from app.model.dota import DotaUserModel, DotaTokenModel, DotaHeroModel, DotaUserHeroModel, DotaUserStageModel
import re


class DotaUserBusiness:
    def __init__(self):
        self.user_model = DotaUserModel()
        self.token_model = DotaTokenModel()
        self.hero_model = DotaHeroModel()
        self.user_hero_model = DotaUserHeroModel()
        self.user_stage_model = DotaUserStageModel()

    def _validate_username(self, username: str) -> bool:
        if not username or len(username) < 3:
            return False
        pattern = r'^[a-zA-Z0-9_]{3,20}$'
        return re.match(pattern, username) is not None

    def _validate_password(self, password: str) -> bool:
        if not password or len(password) < 6:
            return False
        return True

    def _init_new_user(self, user_id: int):
        self.user_hero_model.create(user_id, 1, 500)
        self.user_hero_model.create(user_id, 3, 650)
        self.user_stage_model.create(user_id)

    def register(self, username: str, password: str, nickname: str = '') -> Dict[str, Any]:
        if not self._validate_username(username):
            return {
                'code': 1,
                'msg': '用户名格式不正确（3-20位字母数字下划线）',
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
                'msg': '该用户名已注册',
                'data': None
            }

        user_id = self.user_model.create(username, password, nickname)
        if user_id > 0:
            self._init_new_user(user_id)
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
        if not self._validate_username(username):
            return {
                'code': 1,
                'msg': '用户名格式不正确',
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
                'msg': '账号已被封禁',
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

        affected = self.user_model.update_profile(user_id, data)
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

    def get_user_info(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        user_stage = self.user_stage_model.get_or_create(user_id)
        current_hero_id = user.get('current_hero_id')

        current_hero = None
        if current_hero_id and current_hero_id > 0:
            user_hero = self.user_hero_model.get_by_user_hero(user_id, current_hero_id)
            if user_hero:
                hero_base = self.hero_model.get_by_id(current_hero_id)
                if hero_base:
                    current_hero = {
                        **self.hero_model.to_dict(hero_base),
                        'user_hero': self.user_hero_model.to_dict(user_hero)
                    }

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'user': self.user_model.to_public_dict(user),
                'current_stage': user_stage.get('current_stage_id') if user_stage else 101,
                'max_stage': user_stage.get('max_stage_id') if user_stage else 101,
                'current_hero': current_hero
            }
        }

    def add_gold(self, user_id: int, amount: int) -> Dict[str, Any]:
        if amount <= 0:
            return {
                'code': 1,
                'msg': '金额必须大于0',
                'data': None
            }

        affected = self.user_model.update_gold(user_id, amount)
        if affected > 0:
            user = self.user_model.get_by_id(user_id)
            return {
                'code': 0,
                'msg': 'success',
                'data': {'gold': user.get('gold', 0)}
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def spend_gold(self, user_id: int, amount: int) -> Dict[str, Any]:
        if amount <= 0:
            return {
                'code': 1,
                'msg': '金额必须大于0',
                'data': None
            }

        user = self.user_model.get_by_id(user_id)
        if not user or user.get('gold', 0) < amount:
            return {
                'code': 1,
                'msg': '金币不足',
                'data': None
            }

        affected = self.user_model.update_gold(user_id, -amount)
        if affected > 0:
            updated_user = self.user_model.get_by_id(user_id)
            return {
                'code': 0,
                'msg': 'success',
                'data': {'gold': updated_user.get('gold', 0)}
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }
