from typing import Dict, Any, Optional
from app.model.xuanke import UserModel, TokenModel
import re


class XuankeUserBusiness:
    def __init__(self):
        self.user_model = UserModel()
        self.token_model = TokenModel()

    def _validate_username(self, username: str) -> bool:
        if not username or len(username) < 3 or len(username) > 20:
            return False
        pattern = r'^[a-zA-Z0-9_]+$'
        return re.match(pattern, username) is not None

    def _validate_password(self, password: str) -> bool:
        if not password or len(password) < 6:
            return False
        return True

    def register(self, username: str, password: str, real_name: str = '',
                 role: str = UserModel.ROLE_STUDENT, student_no: str = None,
                 teacher_no: str = None, department: str = '', major: str = '',
                 class_name: str = '', grade: str = '', email: str = '',
                 phone: str = '') -> Dict[str, Any]:
        if not self._validate_username(username):
            return {
                'code': 1,
                'msg': '用户名格式不正确，3-20位字母数字下划线',
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

        if student_no:
            existing_student = self.user_model.get_by_student_no(student_no)
            if existing_student:
                return {
                    'code': 1,
                    'msg': '该学号已被使用',
                    'data': None
                }

        user_id = self.user_model.create(
            username=username, password=password, real_name=real_name,
            role=role, student_no=student_no, teacher_no=teacher_no,
            department=department, major=major, class_name=class_name,
            grade=grade, email=email, phone=phone
        )

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

    def get_user_by_id(self, user_id: int) -> Dict[str, Any]:
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

    def get_user_list(self, page: int = 1, page_size: int = 10,
                      role: str = None, status: int = None, keyword: str = None) -> Dict[str, Any]:
        result = self.user_model.get_all(page, page_size, role, status, keyword)
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

    def update_user_status(self, user_id: int, status: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        affected = self.user_model.update_status(user_id, status)
        if affected > 0:
            updated_user = self.user_model.get_by_id(user_id)
            return {
                'code': 0,
                'msg': '状态更新成功',
                'data': self.user_model.to_public_dict(updated_user)
            }

        return {
            'code': 1,
            'msg': '状态更新失败',
            'data': None
        }

    def create_user(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self.register(
            username=data.get('username', ''),
            password=data.get('password', ''),
            real_name=data.get('real_name', ''),
            role=data.get('role', UserModel.ROLE_STUDENT),
            student_no=data.get('student_no'),
            teacher_no=data.get('teacher_no'),
            department=data.get('department', ''),
            major=data.get('major', ''),
            class_name=data.get('class_name', ''),
            grade=data.get('grade', ''),
            email=data.get('email', ''),
            phone=data.get('phone', '')
        )

    def update_user(self, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        update_data = {}
        for key in ['real_name', 'role', 'student_no', 'teacher_no',
                    'department', 'major', 'class_name', 'grade', 'email', 'phone', 'status']:
            if key in data:
                update_data[key] = data[key]

        if 'password' in data and data['password']:
            affected = self.user_model.update_password(user_id, data['password'])
            if affected <= 0:
                return {
                    'code': 1,
                    'msg': '密码更新失败',
                    'data': None
                }

        if update_data:
            affected = self.user_model.update_profile(user_id, update_data)
            if 'status' in update_data:
                affected = self.user_model.update_status(user_id, update_data['status'])
            if affected <= 0 and update_data:
                return {
                    'code': 1,
                    'msg': '更新失败',
                    'data': None
                }

        updated_user = self.user_model.get_by_id(user_id)
        return {
            'code': 0,
            'msg': '更新成功',
            'data': self.user_model.to_public_dict(updated_user)
        }

    def delete_user(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        affected = self.user_model.delete(user_id)
        if affected > 0:
            self.token_model.delete_by_user_id(user_id)
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
