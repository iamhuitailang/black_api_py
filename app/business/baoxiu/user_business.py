from typing import Dict, Any, Optional
from app.model.baoxiu import UserModel, StudentDetailModel, RepairmanDetailModel, LogModel
import re


class BaoxiuUserBusiness:
    def __init__(self):
        self.user_model = UserModel()
        self.student_detail_model = StudentDetailModel()
        self.repairman_detail_model = RepairmanDetailModel()
        self.log_model = LogModel()

    def _validate_phone(self, phone: str) -> bool:
        if not phone:
            return True
        pattern = r'^1[3-9]\d{9}$'
        return re.match(pattern, phone) is not None

    def get_user_list(self, page: int = 1, page_size: int = 10,
                      role: str = None, status: int = None,
                      keyword: str = None, current_user_id: int = None, current_user_role: str = None) -> Dict[str, Any]:
        if current_user_role != UserModel.ROLE_ADMIN:
            return {'code': 1, 'msg': '无权访问', 'data': None}

        result = self.user_model.get_all(page, page_size, role, status, keyword)
        items = []
        for item in result.get('items', []):
            user_dict = self.user_model.to_public_dict(item)
            user_dict['detail'] = self._get_user_detail(item.get('id'), item.get('role'))
            items.append(user_dict)

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

    def _get_user_detail(self, user_id: int, role: str) -> Optional[Dict[str, Any]]:
        if role == UserModel.ROLE_STUDENT:
            return self.student_detail_model.get_by_user_id(user_id)
        elif role == UserModel.ROLE_REPAIRMAN:
            detail = self.repairman_detail_model.get_by_user_id(user_id)
            if detail:
                detail['status_text'] = self.repairman_detail_model.get_status_text(detail.get('status', 0))
            return detail
        return None

    def get_user_by_id(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}

        user_dict = self.user_model.to_public_dict(user)
        user_dict['detail'] = self._get_user_detail(user_id, user.get('role'))

        return {'code': 0, 'msg': 'success', 'data': user_dict}

    def update_profile(self, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}

        if 'phone' in data and data['phone']:
            if not self._validate_phone(data['phone']):
                return {'code': 1, 'msg': '手机号格式不正确', 'data': None}

        profile_data = {}
        if 'real_name' in data:
            profile_data['real_name'] = data['real_name']
        if 'phone' in data:
            profile_data['phone'] = data['phone']

        if profile_data:
            self.user_model.update_profile(user_id, profile_data)

        if user.get('role') == UserModel.ROLE_STUDENT:
            detail_data = {}
            if 'student_no' in data:
                detail_data['student_no'] = data['student_no']
            if 'dormitory_id' in data:
                detail_data['dormitory_id'] = data['dormitory_id']
            if 'room_number' in data:
                detail_data['room_number'] = data['room_number']
            if detail_data:
                self.student_detail_model.update_by_user_id(user_id, detail_data)

        elif user.get('role') == UserModel.ROLE_REPAIRMAN:
            detail_data = {}
            if 'worker_no' in data:
                detail_data['worker_no'] = data['worker_no']
            if 'specialty' in data:
                detail_data['specialty'] = data['specialty']
            if detail_data:
                self.repairman_detail_model.update_by_user_id(user_id, detail_data)

        self.log_model.create(user_id, LogModel.ACTION_UPDATE_USER, 'user', user_id, '更新个人信息')

        updated_user = self.user_model.get_by_id(user_id)
        return {
            'code': 0,
            'msg': '更新成功',
            'data': self.user_model.to_public_dict(updated_user)
        }

    def update_user_status(self, user_id: int, status: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}

        affected = self.user_model.update_status(user_id, status)
        if affected > 0:
            self.log_model.create(user_id, LogModel.ACTION_UPDATE_USER, 'user', user_id,
                                  f'更新用户状态为: {self.user_model.get_status_text(status)}')
            updated_user = self.user_model.get_by_id(user_id)
            return {
                'code': 0,
                'msg': '状态更新成功',
                'data': self.user_model.to_public_dict(updated_user)
            }

        return {'code': 1, 'msg': '状态更新失败', 'data': None}

    def change_password(self, user_id: int, old_password: str, new_password: str) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}

        username = user.get('username', '')
        verify_result = self.user_model.verify_password(username, old_password)
        if verify_result is None:
            return {'code': 1, 'msg': '原密码错误', 'data': None}

        if not new_password or len(new_password) < 6:
            return {'code': 1, 'msg': '新密码长度至少6位', 'data': None}

        affected = self.user_model.update_password(user_id, new_password)
        if affected > 0:
            return {'code': 0, 'msg': '密码修改成功', 'data': None}

        return {'code': 1, 'msg': '密码修改失败', 'data': None}

    def delete_user(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}

        if user.get('role') == UserModel.ROLE_STUDENT:
            self.student_detail_model.delete_by_user_id(user_id)
        elif user.get('role') == UserModel.ROLE_REPAIRMAN:
            self.repairman_detail_model.delete_by_user_id(user_id)

        affected = self.user_model.delete(user_id)
        if affected > 0:
            return {'code': 0, 'msg': '删除成功', 'data': None}

        return {'code': 1, 'msg': '删除失败', 'data': None}
