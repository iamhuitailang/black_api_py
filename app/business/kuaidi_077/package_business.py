from typing import Dict, Any, Optional
from app.model.kuaidi_077_model import KuaidiPackageModel, KuaidiUserModel, KuaidiMessageModel, KuaidiPickupCodeModel


class KuaidiPackageBusiness:
    def __init__(self):
        self.package_model = KuaidiPackageModel()
        self.user_model = KuaidiUserModel()
        self.message_model = KuaidiMessageModel()
        self.pickup_code_model = KuaidiPickupCodeModel()

    def create_package(self, tracking_number: str, courier_company: str, recipient_name: str,
                       recipient_phone: str, package_type: str = '', weight: float = 0,
                       cabinet_number: str = '', shelf_number: str = '', remark: str = '') -> Dict[str, Any]:
        if not tracking_number:
            return {
                'code': 1,
                'msg': '快递单号不能为空',
                'data': None
            }

        if not recipient_name:
            return {
                'code': 1,
                'msg': '收件人姓名不能为空',
                'data': None
            }

        if not recipient_phone:
            return {
                'code': 1,
                'msg': '收件人电话不能为空',
                'data': None
            }

        existing = self.package_model.get_by_tracking_number(tracking_number)
        if existing:
            return {
                'code': 1,
                'msg': '该快递单号已存在',
                'data': None
            }

        user = self.user_model.get_by_phone(recipient_phone)
        user_id = user.get('id') if user else 0

        package_id = self.package_model.create(
            tracking_number=tracking_number,
            courier_company=courier_company,
            recipient_name=recipient_name,
            recipient_phone=recipient_phone,
            user_id=user_id,
            package_type=package_type,
            weight=weight,
            cabinet_number=cabinet_number,
            shelf_number=shelf_number,
            remark=remark
        )

        if package_id > 0:
            code = self.pickup_code_model.create(package_id, user_id, hours=24)
            pickup_code = self.pickup_code_model.get_by_code(code)

            if user_id > 0:
                self.message_model.send_pickup_reminder(user_id, package_id, tracking_number)

            package = self.package_model.get_by_id(package_id)
            result = self.package_model.to_dict(package)
            result['pickup_code'] = self.pickup_code_model.to_dict(pickup_code) if pickup_code else None
            return {
                'code': 0,
                'msg': '快递录入成功',
                'data': result
            }

        return {
            'code': 1,
            'msg': '快递录入失败',
            'data': None
        }

    def get_package_by_id(self, package_id: int) -> Dict[str, Any]:
        package = self.package_model.get_by_id(package_id)
        if not package:
            return {
                'code': 1,
                'msg': '快递不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.package_model.to_dict(package)
        }

    def get_package_by_tracking(self, tracking_number: str) -> Dict[str, Any]:
        package = self.package_model.get_by_tracking_number(tracking_number)
        if not package:
            return {
                'code': 1,
                'msg': '快递不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.package_model.to_dict(package)
        }

    def _attach_pickup_code(self, item: dict) -> dict:
        package_id = item.get('id')
        if package_id:
            pickup_code = self.pickup_code_model.get_by_package_id(package_id)
            if pickup_code and pickup_code.get('status') == self.pickup_code_model.STATUS_UNUSED:
                item['pickup_code'] = self.pickup_code_model.to_dict(pickup_code)
            else:
                item['pickup_code'] = None
        else:
            item['pickup_code'] = None
        return item

    def get_user_packages(self, user_id: int, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        phone = user.get('phone', '') if user else ''
        result = self.package_model.get_by_user_id_or_phone(user_id, phone, page, page_size, status)
        items = [self._attach_pickup_code(self.package_model.to_dict(item)) for item in result.get('items', [])]

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

    def get_packages_by_phone(self, phone: str, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        result = self.package_model.get_by_phone(phone, page, page_size, status)
        items = [self.package_model.to_dict(item) for item in result.get('items', [])]

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

    def get_package_list(self, page: int = 1, page_size: int = 10, status: int = None,
                         keyword: str = None, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        result = self.package_model.get_all(page, page_size, status, keyword, start_date, end_date)
        items = [self._attach_pickup_code(self.package_model.to_dict(item)) for item in result.get('items', [])]

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

    def update_package(self, package_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        package = self.package_model.get_by_id(package_id)
        if not package:
            return {
                'code': 1,
                'msg': '快递不存在',
                'data': None
            }

        affected = self.package_model.update(package_id, data)
        if affected >= 0:
            updated_package = self.package_model.get_by_id(package_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.package_model.to_dict(updated_package)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_package(self, package_id: int) -> Dict[str, Any]:
        package = self.package_model.get_by_id(package_id)
        if not package:
            return {
                'code': 1,
                'msg': '快递不存在',
                'data': None
            }

        affected = self.package_model.delete(package_id)
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

    def get_overdue_packages(self, days: int = 3, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.package_model.get_overdue_packages(days, page, page_size)
        items = [self.package_model.to_dict(item) for item in result.get('items', [])]

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

    def process_overdue(self, package_id: int) -> Dict[str, Any]:
        package = self.package_model.get_by_id(package_id)
        if not package:
            return {
                'code': 1,
                'msg': '快递不存在',
                'data': None
            }

        if package.get('status') != self.package_model.STATUS_STORED:
            return {
                'code': 1,
                'msg': '该快递状态不支持超时处理',
                'data': None
            }

        affected = self.package_model.update_status(package_id, self.package_model.STATUS_OVERDUE)
        if affected > 0:
            return {
                'code': 0,
                'msg': '处理成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '处理失败',
            'data': None
        }

    def return_package(self, package_id: int) -> Dict[str, Any]:
        package = self.package_model.get_by_id(package_id)
        if not package:
            return {
                'code': 1,
                'msg': '快递不存在',
                'data': None
            }

        if package.get('status') not in [self.package_model.STATUS_STORED, self.package_model.STATUS_OVERDUE]:
            return {
                'code': 1,
                'msg': '该快递状态不支持退回',
                'data': None
            }

        affected = self.package_model.update_status(package_id, self.package_model.STATUS_RETURNED)
        if affected > 0:
            return {
                'code': 0,
                'msg': '退回成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '退回失败',
            'data': None
        }

    def get_statistics(self) -> Dict[str, Any]:
        stats = self.package_model.get_statistics()
        return {
            'code': 0,
            'msg': 'success',
            'data': stats
        }
