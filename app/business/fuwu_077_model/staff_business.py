from typing import Dict, Any, List, Optional
from app.model.fuwu_077_model import StaffModel


class StaffBusiness:
    def __init__(self):
        self.staff_model = StaffModel()

    def get_staff_list(self, page: int = 1, page_size: int = 10,
                       status: int = None, keyword: str = None) -> Dict[str, Any]:
        result = self.staff_model.get_all(page, page_size, status, keyword)
        items = [self.staff_model.to_dict(item) for item in result.get('items', [])]

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

    def get_staff_detail(self, staff_id: int) -> Dict[str, Any]:
        staff = self.staff_model.get_by_id(staff_id)
        if not staff:
            return {
                'code': 1,
                'msg': '服务人员不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.staff_model.to_dict(staff)
        }

    def get_available_staff(self) -> Dict[str, Any]:
        staff_list = self.staff_model.get_available_staff()
        items = [self.staff_model.to_dict(item) for item in staff_list]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def create_staff(self, name: str, phone: str, id_card: str = '',
                     skills: str = '', experience: int = 0,
                     avatar: str = '', status: int = 1) -> Dict[str, Any]:
        if not name:
            return {
                'code': 1,
                'msg': '姓名不能为空',
                'data': None
            }

        if not phone:
            return {
                'code': 1,
                'msg': '手机号不能为空',
                'data': None
            }

        existing = self.staff_model.get_by_phone(phone)
        if existing:
            return {
                'code': 1,
                'msg': '该手机号已存在',
                'data': None
            }

        staff_id = self.staff_model.create(
            name=name,
            phone=phone,
            id_card=id_card,
            skills=skills,
            experience=experience,
            avatar=avatar,
            status=status
        )

        if staff_id > 0:
            staff = self.staff_model.get_by_id(staff_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.staff_model.to_dict(staff)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_staff(self, staff_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        staff = self.staff_model.get_by_id(staff_id)
        if not staff:
            return {
                'code': 1,
                'msg': '服务人员不存在',
                'data': None
            }

        if 'phone' in data:
            existing = self.staff_model.get_by_phone(data['phone'])
            if existing and existing.get('id') != staff_id:
                return {
                    'code': 1,
                    'msg': '该手机号已存在',
                    'data': None
                }

        affected = self.staff_model.update(staff_id, data)
        if affected >= 0:
            updated_staff = self.staff_model.get_by_id(staff_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.staff_model.to_dict(updated_staff)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_staff(self, staff_id: int) -> Dict[str, Any]:
        staff = self.staff_model.get_by_id(staff_id)
        if not staff:
            return {
                'code': 1,
                'msg': '服务人员不存在',
                'data': None
            }

        affected = self.staff_model.delete(staff_id)
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

    def toggle_status(self, staff_id: int) -> Dict[str, Any]:
        staff = self.staff_model.get_by_id(staff_id)
        if not staff:
            return {
                'code': 1,
                'msg': '服务人员不存在',
                'data': None
            }

        new_status = 0 if staff.get('status') == 1 else 1
        affected = self.staff_model.update(staff_id, {'status': new_status})
        if affected > 0:
            updated_staff = self.staff_model.get_by_id(staff_id)
            return {
                'code': 0,
                'msg': '状态更新成功',
                'data': self.staff_model.to_dict(updated_staff)
            }

        return {
            'code': 1,
            'msg': '状态更新失败',
            'data': None
        }
