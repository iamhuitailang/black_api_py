from typing import Dict, Any, List, Optional
from app.model.dj import UserModel


class DjUserBusiness:
    def __init__(self):
        self.user_model = UserModel()

    def get_user_list(self, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status

        result = self.user_model.paginate(page, page_size, conditions)

        items = []
        for item in result.get('items', []):
            items.append({
                'id': item.get('id'),
                'phone': item.get('phone'),
                'nickname': item.get('nickname'),
                'avatar': item.get('avatar'),
                'status': item.get('status'),
                'is_vendor': item.get('is_vendor'),
                'created_at': item.get('created_at')
            })

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

    def get_user_detail(self, user_id: int) -> Dict[str, Any]:
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
            'data': {
                'id': user.get('id'),
                'phone': user.get('phone'),
                'nickname': user.get('nickname'),
                'avatar': user.get('avatar'),
                'status': user.get('status'),
                'is_vendor': user.get('is_vendor'),
                'created_at': user.get('created_at')
            }
        }

    def update_profile(self, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        allowed_fields = ['nickname', 'avatar']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}

        if not update_data:
            return {
                'code': 1,
                'msg': '没有可更新的字段',
                'data': None
            }

        affected = self.user_model.update_profile(user_id, update_data)
        if affected > 0:
            user = self.user_model.get_by_id(user_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': {
                    'id': user.get('id'),
                    'phone': user.get('phone'),
                    'nickname': user.get('nickname'),
                    'avatar': user.get('avatar')
                }
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
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
            return {
                'code': 0,
                'msg': '更新成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def set_vendor(self, user_id: int, is_vendor: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        affected = self.user_model.set_vendor(user_id, is_vendor)
        if affected > 0:
            return {
                'code': 0,
                'msg': '更新成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def get_user_statistics(self) -> Dict[str, Any]:
        total = self.user_model.count()
        active = self.user_model.count({'status': 1})
        vendors = self.user_model.count({'is_vendor': 1})

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_users': total,
                'active_users': active,
                'vendor_count': vendors
            }
        }
