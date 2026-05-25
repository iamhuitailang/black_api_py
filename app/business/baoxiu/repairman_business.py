from typing import Dict, Any, Optional
from app.model.baoxiu import (UserModel, RepairmanDetailModel,
                                StudentDetailModel)


class BaoxiuRepairmanBusiness:
    def __init__(self):
        self.user_model = UserModel()
        self.repairman_detail_model = RepairmanDetailModel()
        self.student_detail_model = StudentDetailModel()

    def get_repairman_list(self, page: int = 1, page_size: int = 10,
                            specialty: str = None, status: int = None) -> Dict[str, Any]:
        result = self.user_model.get_all(
            page=page, page_size=page_size,
            role=UserModel.ROLE_REPAIRMAN,
            status=status
        )

        items = []
        for user in result.get('items', []):
            user_dict = self.user_model.to_public_dict(user)
            detail = self.repairman_detail_model.get_by_user_id(user.get('id'))
            if detail:
                detail_dict = dict(detail)
                detail_dict['status_text'] = self.repairman_detail_model.get_status_text(
                    detail.get('status', 0))
                user_dict['detail'] = detail_dict
            else:
                user_dict['detail'] = None
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

    def get_available_repairmen(self) -> Dict[str, Any]:
        available_details = self.repairman_detail_model.get_available()
        items = []
        for detail in available_details:
            user = self.user_model.get_by_id(detail.get('user_id'))
            if user:
                user_dict = self.user_model.to_public_dict(user)
                detail_dict = dict(detail)
                detail_dict['status_text'] = self.repairman_detail_model.get_status_text(
                    detail.get('status', 0))
                user_dict['detail'] = detail_dict
                items.append(user_dict)

        return {'code': 0, 'msg': 'success', 'data': items}

    def get_student_list(self, page: int = 1, page_size: int = 10,
                          dormitory_id: int = None) -> Dict[str, Any]:
        result = self.user_model.get_all(
            page=page, page_size=page_size,
            role=UserModel.ROLE_STUDENT
        )

        items = []
        for user in result.get('items', []):
            user_dict = self.user_model.to_public_dict(user)
            detail = self.student_detail_model.get_by_user_id(user.get('id'))
            if detail:
                if dormitory_id and detail.get('dormitory_id') != dormitory_id:
                    continue
                user_dict['detail'] = detail
            else:
                user_dict['detail'] = None
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

    def update_repairman_status(self, user_id: int, status: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}

        if user.get('role') != UserModel.ROLE_REPAIRMAN:
            return {'code': 1, 'msg': '该用户不是维修工', 'data': None}

        affected = self.repairman_detail_model.update_status(user_id, status)
        if affected > 0:
            return {'code': 0, 'msg': '状态更新成功', 'data': None}

        return {'code': 1, 'msg': '状态更新失败', 'data': None}

    def get_repairman_detail(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}

        user_dict = self.user_model.to_public_dict(user)

        if user.get('role') == UserModel.ROLE_REPAIRMAN:
            detail = self.repairman_detail_model.get_by_user_id(user_id)
            if detail:
                detail_dict = dict(detail)
                detail_dict['status_text'] = self.repairman_detail_model.get_status_text(
                    detail.get('status', 0))
                user_dict['detail'] = detail_dict
        elif user.get('role') == UserModel.ROLE_STUDENT:
            detail = self.student_detail_model.get_by_user_id(user_id)
            user_dict['detail'] = detail

        return {'code': 0, 'msg': 'success', 'data': user_dict}
