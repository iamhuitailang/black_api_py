from typing import Dict, Any, Optional
from app.model.baoxiu import UserModel, TokenModel, LogModel
import re


class BaoxiuAuthBusiness:
    def __init__(self):
        self.user_model = UserModel()
        self.token_model = TokenModel()
        self.log_model = LogModel()

    def _validate_username(self, username: str) -> bool:
        if not username or len(username) < 3:
            return False
        return True

    def _validate_password(self, password: str) -> bool:
        if not password or len(password) < 6:
            return False
        return True

    def _validate_phone(self, phone: str) -> bool:
        if not phone:
            return True
        pattern = r'^1[3-9]\d{9}$'
        return re.match(pattern, phone) is not None

    def register(self, username: str, password: str, real_name: str = '',
                 phone: str = '', role: str = 'student',
                 student_no: str = '', dormitory_id: int = 0,
                 room_number: str = '', worker_no: str = '',
                 specialty: str = '') -> Dict[str, Any]:
        if not self._validate_username(username):
            return {'code': 1, 'msg': '用户名长度至少3位', 'data': None}

        if not self._validate_password(password):
            return {'code': 1, 'msg': '密码长度至少6位', 'data': None}

        if not self._validate_phone(phone):
            return {'code': 1, 'msg': '手机号格式不正确', 'data': None}

        existing_user = self.user_model.get_by_username(username)
        if existing_user:
            return {'code': 1, 'msg': '该用户名已注册', 'data': None}

        user_id = self.user_model.create(username, password, real_name, phone, role)
        if user_id <= 0:
            return {'code': 1, 'msg': '注册失败', 'data': None}

        if role == UserModel.ROLE_STUDENT:
            from app.model.baoxiu import StudentDetailModel
            student_detail_model = StudentDetailModel()
            student_detail_model.create(user_id, student_no, dormitory_id, room_number)
        elif role == UserModel.ROLE_REPAIRMAN:
            from app.model.baoxiu import RepairmanDetailModel
            repairman_detail_model = RepairmanDetailModel()
            repairman_detail_model.create(user_id, worker_no, specialty)

        token = self.token_model.create_token(user_id, hours=24)
        user = self.user_model.get_by_id(user_id)

        self.log_model.create(user_id, LogModel.ACTION_LOGIN, 'user', user_id, '用户注册')

        return {
            'code': 0,
            'msg': '注册成功',
            'data': {
                'user': self.user_model.to_public_dict(user),
                'token': token
            }
        }

    def login(self, username: str, password: str) -> Dict[str, Any]:
        if not self._validate_username(username):
            return {'code': 1, 'msg': '用户名格式不正确', 'data': None}

        if not password:
            return {'code': 1, 'msg': '密码不能为空', 'data': None}

        user = self.user_model.verify_password(username, password)
        if user is None:
            return {'code': 1, 'msg': '用户名或密码错误', 'data': None}

        if user.get('status') == UserModel.STATUS_DISABLED:
            return {'code': 1, 'msg': '账号已被禁用，请联系管理员', 'data': None}

        self.token_model.delete_by_user_id(user.get('id'))
        token = self.token_model.create_token(user.get('id'), hours=24)

        self.log_model.create(user.get('id'), LogModel.ACTION_LOGIN, 'user', user.get('id'), '用户登录')

        return {
            'code': 0,
            'msg': '登录成功',
            'data': {
                'user': user,
                'token': token
            }
        }

    def logout(self, token: str) -> Dict[str, Any]:
        if token:
            user = self.token_model.get_user_by_token(token)
            if user:
                self.log_model.create(user.get('id'), LogModel.ACTION_LOGOUT, 'user', user.get('id'), '用户登出')
            self.token_model.delete_token(token)

        return {'code': 0, 'msg': '退出成功', 'data': None}

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        return self.token_model.get_user_by_token(token)

    def get_current_user(self, token: str) -> Dict[str, Any]:
        user = self.token_model.get_user_by_token(token)
        if user:
            return {'code': 0, 'msg': 'success', 'data': user}

        return {'code': 1, 'msg': 'token无效或已过期', 'data': None}
