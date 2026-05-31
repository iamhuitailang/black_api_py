from typing import Dict, Any, Optional
from app.model.kuaidi_077_model import KuaidiPickupCodeModel, KuaidiPackageModel, KuaidiUserModel
from datetime import datetime


class KuaidiPickupBusiness:
    def __init__(self):
        self.pickup_code_model = KuaidiPickupCodeModel()
        self.package_model = KuaidiPackageModel()
        self.user_model = KuaidiUserModel()

    def generate_pickup_code(self, user_id: int, package_id: int) -> Dict[str, Any]:
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
                'msg': '该快递状态不支持生成取件码',
                'data': None
            }

        existing_code = self.pickup_code_model.get_by_package_id(package_id)
        if existing_code and existing_code.get('status') == self.pickup_code_model.STATUS_UNUSED:
            expires_at = existing_code.get('expires_at')
            if expires_at and datetime.fromisoformat(expires_at) > datetime.now():
                return {
                    'code': 0,
                    'msg': '获取成功',
                    'data': self.pickup_code_model.to_dict(existing_code)
                }

        code = self.pickup_code_model.create(package_id, user_id, hours=24)
        if code:
            pickup_code = self.pickup_code_model.get_by_code(code)
            return {
                'code': 0,
                'msg': '取件码生成成功',
                'data': self.pickup_code_model.to_dict(pickup_code)
            }

        return {
            'code': 1,
            'msg': '取件码生成失败',
            'data': None
        }

    def get_pickup_code_by_id(self, code_id: int) -> Dict[str, Any]:
        pickup_code = self.pickup_code_model.get_by_id(code_id)
        if not pickup_code:
            return {
                'code': 1,
                'msg': '取件码不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.pickup_code_model.to_dict(pickup_code)
        }

    def get_pickup_code_by_code(self, code: str) -> Dict[str, Any]:
        pickup_code = self.pickup_code_model.get_by_code(code)
        if not pickup_code:
            return {
                'code': 1,
                'msg': '取件码不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.pickup_code_model.to_dict(pickup_code)
        }

    def get_user_pickup_codes(self, user_id: int, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        result = self.pickup_code_model.get_by_user_id(user_id, page, page_size, status)
        items = [self.pickup_code_model.to_dict(item) for item in result.get('items', [])]

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

    def verify_and_pickup(self, code: str, operator_id: int = 0) -> Dict[str, Any]:
        pickup_code = self.pickup_code_model.get_by_code(code)
        if not pickup_code:
            return {
                'code': 1,
                'msg': '取件码不存在',
                'data': None
            }

        if pickup_code.get('status') == self.pickup_code_model.STATUS_USED:
            return {
                'code': 1,
                'msg': '取件码已使用',
                'data': None
            }

        if pickup_code.get('status') == self.pickup_code_model.STATUS_EXPIRED:
            return {
                'code': 1,
                'msg': '取件码已过期',
                'data': None
            }

        expires_at = pickup_code.get('expires_at')
        if expires_at and datetime.fromisoformat(expires_at) < datetime.now():
            self.pickup_code_model.expire_code(pickup_code.get('id'))
            return {
                'code': 1,
                'msg': '取件码已过期',
                'data': None
            }

        package_id = pickup_code.get('package_id')
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
                'msg': '该快递状态不支持取件',
                'data': None
            }

        self.pickup_code_model.use_code(pickup_code.get('id'))
        self.package_model.update_status(package_id, self.package_model.STATUS_PICKED, operator_id)

        return {
            'code': 0,
            'msg': '取件成功',
            'data': {
                'package': self.package_model.to_dict(package),
                'pickup_code': self.pickup_code_model.to_dict(pickup_code)
            }
        }

    def get_pickup_list(self, page: int = 1, page_size: int = 10, status: int = None, user_id: int = None) -> Dict[str, Any]:
        result = self.pickup_code_model.get_all(page, page_size, status, user_id)
        items = []
        for item in result.get('items', []):
            code_dict = self.pickup_code_model.to_dict(item)
            package = self.package_model.get_by_id(item.get('package_id'))
            if package:
                code_dict['package'] = self.package_model.to_dict(package)
            items.append(code_dict)

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

    def delete_pickup_code(self, code_id: int) -> Dict[str, Any]:
        pickup_code = self.pickup_code_model.get_by_id(code_id)
        if not pickup_code:
            return {
                'code': 1,
                'msg': '取件码不存在',
                'data': None
            }

        affected = self.pickup_code_model.delete(code_id)
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
