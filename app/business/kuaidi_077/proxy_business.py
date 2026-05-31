from typing import Dict, Any, Optional
from app.model.kuaidi_077_model import KuaidiProxyModel, KuaidiPackageModel, KuaidiUserModel, KuaidiMessageModel


class KuaidiProxyBusiness:
    def __init__(self):
        self.proxy_model = KuaidiProxyModel()
        self.package_model = KuaidiPackageModel()
        self.user_model = KuaidiUserModel()
        self.message_model = KuaidiMessageModel()

    def create_proxy_request(self, requester_id: int, package_id: int, remark: str = '') -> Dict[str, Any]:
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
                'msg': '该快递状态不支持代取',
                'data': None
            }

        existing_proxy = self.proxy_model.get_by_package_id(package_id)
        if existing_proxy and existing_proxy.get('status') in [
            self.proxy_model.STATUS_PENDING,
            self.proxy_model.STATUS_ACCEPTED
        ]:
            return {
                'code': 1,
                'msg': '该快递已有代取请求',
                'data': None
            }

        proxy_id = self.proxy_model.create(package_id, requester_id, remark)
        if proxy_id > 0:
            proxy = self.proxy_model.get_by_id(proxy_id)
            requester = self.user_model.get_by_id(requester_id)
            requester_name = requester.get('nickname', '用户') if requester else '用户'

            users = self.user_model.get_all(role=self.user_model.ROLE_USER)
            for user in users.get('items', []):
                if user.get('id') != requester_id:
                    self.message_model.send_proxy_request(user.get('id'), proxy_id, requester_name)

            return {
                'code': 0,
                'msg': '代取请求创建成功',
                'data': self.proxy_model.to_dict(proxy)
            }

        return {
            'code': 1,
            'msg': '代取请求创建失败',
            'data': None
        }

    def get_proxy_by_id(self, proxy_id: int) -> Dict[str, Any]:
        proxy = self.proxy_model.get_by_id(proxy_id)
        if not proxy:
            return {
                'code': 1,
                'msg': '代取请求不存在',
                'data': None
            }

        result = self.proxy_model.to_dict(proxy)

        package = self.package_model.get_by_id(proxy.get('package_id'))
        if package:
            result['package'] = self.package_model.to_dict(package)

        requester = self.user_model.get_by_id(proxy.get('requester_id'))
        if requester:
            result['requester'] = self.user_model.to_public_dict(requester)

        proxy_user_id = proxy.get('proxy_user_id')
        if proxy_user_id and proxy_user_id > 0:
            proxy_user = self.user_model.get_by_id(proxy_user_id)
            if proxy_user:
                result['proxy_user'] = self.user_model.to_public_dict(proxy_user)

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_my_requests(self, requester_id: int, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        result = self.proxy_model.get_by_requester_id(requester_id, page, page_size, status)
        items = []
        for item in result.get('items', []):
            proxy_dict = self.proxy_model.to_dict(item)
            package = self.package_model.get_by_id(item.get('package_id'))
            if package:
                proxy_dict['package'] = self.package_model.to_dict(package)
            items.append(proxy_dict)

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

    def get_my_proxies(self, proxy_user_id: int, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        result = self.proxy_model.get_by_proxy_user_id(proxy_user_id, page, page_size, status)
        items = []
        for item in result.get('items', []):
            proxy_dict = self.proxy_model.to_dict(item)
            package = self.package_model.get_by_id(item.get('package_id'))
            if package:
                proxy_dict['package'] = self.package_model.to_dict(package)
            requester = self.user_model.get_by_id(item.get('requester_id'))
            if requester:
                proxy_dict['requester'] = self.user_model.to_public_dict(requester)
            items.append(proxy_dict)

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

    def get_pending_proxies(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.proxy_model.get_pending_list(page, page_size)
        items = []
        for item in result.get('items', []):
            proxy_dict = self.proxy_model.to_dict(item)
            package = self.package_model.get_by_id(item.get('package_id'))
            if package:
                proxy_dict['package'] = self.package_model.to_dict(package)
            requester = self.user_model.get_by_id(item.get('requester_id'))
            if requester:
                proxy_dict['requester'] = self.user_model.to_public_dict(requester)
            items.append(proxy_dict)

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

    def accept_proxy(self, proxy_id: int, proxy_user_id: int) -> Dict[str, Any]:
        proxy = self.proxy_model.get_by_id(proxy_id)
        if not proxy:
            return {
                'code': 1,
                'msg': '代取请求不存在',
                'data': None
            }

        if proxy.get('status') != self.proxy_model.STATUS_PENDING:
            return {
                'code': 1,
                'msg': '该代取请求状态不支持接单',
                'data': None
            }

        affected = self.proxy_model.accept(proxy_id, proxy_user_id)
        if affected > 0:
            proxy_user = self.user_model.get_by_id(proxy_user_id)
            proxy_user_name = proxy_user.get('nickname', '用户') if proxy_user else '用户'
            self.message_model.send_proxy_accepted(proxy.get('requester_id'), proxy_id, proxy_user_name)

            updated_proxy = self.proxy_model.get_by_id(proxy_id)
            return {
                'code': 0,
                'msg': '接单成功',
                'data': self.proxy_model.to_dict(updated_proxy)
            }

        return {
            'code': 1,
            'msg': '接单失败',
            'data': None
        }

    def complete_proxy(self, proxy_id: int, proxy_user_id: int) -> Dict[str, Any]:
        proxy = self.proxy_model.get_by_id(proxy_id)
        if not proxy:
            return {
                'code': 1,
                'msg': '代取请求不存在',
                'data': None
            }

        if proxy.get('status') != self.proxy_model.STATUS_ACCEPTED:
            return {
                'code': 1,
                'msg': '该代取请求状态不支持完成',
                'data': None
            }

        if proxy.get('proxy_user_id') != proxy_user_id:
            return {
                'code': 1,
                'msg': '您不是该代取请求的接单人',
                'data': None
            }

        package_id = proxy.get('package_id')
        package = self.package_model.get_by_id(package_id)
        if package and package.get('status') != self.package_model.STATUS_PICKED:
            self.package_model.update_status(package_id, self.package_model.STATUS_PICKED, proxy_user_id)

        affected = self.proxy_model.complete(proxy_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '完成成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '完成失败',
            'data': None
        }

    def cancel_proxy(self, proxy_id: int, requester_id: int) -> Dict[str, Any]:
        proxy = self.proxy_model.get_by_id(proxy_id)
        if not proxy:
            return {
                'code': 1,
                'msg': '代取请求不存在',
                'data': None
            }

        if proxy.get('requester_id') != requester_id:
            return {
                'code': 1,
                'msg': '您不是该代取请求的发起人',
                'data': None
            }

        if proxy.get('status') not in [self.proxy_model.STATUS_PENDING, self.proxy_model.STATUS_ACCEPTED]:
            return {
                'code': 1,
                'msg': '该代取请求状态不支持取消',
                'data': None
            }

        affected = self.proxy_model.cancel(proxy_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '取消成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '取消失败',
            'data': None
        }

    def get_proxy_list(self, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        result = self.proxy_model.get_all(page, page_size, status)
        items = []
        for item in result.get('items', []):
            proxy_dict = self.proxy_model.to_dict(item)
            package = self.package_model.get_by_id(item.get('package_id'))
            if package:
                proxy_dict['package'] = self.package_model.to_dict(package)
            items.append(proxy_dict)

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

    def delete_proxy(self, proxy_id: int) -> Dict[str, Any]:
        proxy = self.proxy_model.get_by_id(proxy_id)
        if not proxy:
            return {
                'code': 1,
                'msg': '代取请求不存在',
                'data': None
            }

        affected = self.proxy_model.delete(proxy_id)
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
