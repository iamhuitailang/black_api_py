from typing import Dict, Any, Optional
from app.model.tielu import TieluUserModel, TieluTokenModel, TieluCityModel, TieluTrainModel


class TieluUserBusiness:
    def __init__(self):
        self.user_model = TieluUserModel()
        self.token_model = TieluTokenModel()
        self.city_model = TieluCityModel()
        self.train_model = TieluTrainModel()

    def _validate_username(self, username: str) -> bool:
        if not username or len(username) < 3 or len(username) > 20:
            return False
        return True

    def _validate_password(self, password: str) -> bool:
        if not password or len(password) < 6:
            return False
        return True

    def register(self, username: str, password: str) -> Dict[str, Any]:
        if not self._validate_username(username):
            return {
                'code': 1,
                'msg': '用户名长度应为3-20个字符',
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

        user_id = self.user_model.create(username, password)
        if user_id > 0:
            self.city_model.init_user_cities(user_id)
            self.train_model.create(user_id, '蒸汽机车')

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

    def get_user_profile(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        cities = self.city_model.get_by_user_id(user_id)
        trains = self.train_model.get_by_user_id(user_id)

        unlocked_count = sum(1 for c in cities if c.get('unlocked') == 1)

        profile = self.user_model.to_public_dict(user)
        profile['cities_count'] = len(cities)
        profile['unlocked_cities_count'] = unlocked_count
        profile['trains_count'] = len(trains)

        return {
            'code': 0,
            'msg': 'success',
            'data': profile
        }

    def add_exp(self, user_id: int, exp_amount: int) -> Dict[str, Any]:
        if exp_amount <= 0:
            return {
                'code': 1,
                'msg': '经验值必须大于0',
                'data': None
            }

        result = self.user_model.add_exp(user_id, exp_amount)

        return {
            'code': 0,
            'msg': '经验值增加成功',
            'data': result
        }

    def add_gold(self, user_id: int, gold_amount: int) -> Dict[str, Any]:
        if gold_amount <= 0:
            return {
                'code': 1,
                'msg': '金币数必须大于0',
                'data': None
            }

        affected = self.user_model.add_gold(user_id, gold_amount)

        user = self.user_model.get_by_id(user_id)

        return {
            'code': 0,
            'msg': '金币增加成功',
            'data': {
                'added': gold_amount,
                'current_gold': user.get('gold', 0) if user else 0
            }
        }

    def upgrade_station(self, user_id: int) -> Dict[str, Any]:
        result = self.user_model.upgrade_station(user_id)

        if result.get('success'):
            user = self.user_model.get_by_id(user_id)
            return {
                'code': 0,
                'msg': result.get('msg'),
                'data': {
                    'old_level': result.get('old_level'),
                    'new_level': result.get('new_level'),
                    'user': self.user_model.to_public_dict(user)
                }
            }

        return {
            'code': 1,
            'msg': result.get('msg'),
            'data': None
        }
