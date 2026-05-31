from typing import Dict, Any
from app.model.jaoyou_077 import MatchModel


class JaoyouMatchBusiness:
    def __init__(self):
        self.match_model = MatchModel()

    def get_user_matches(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.match_model.get_user_matches(user_id, page, page_size)
        items = [self.match_model.to_public_dict(item) for item in result.get('items', [])]

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

    def cancel_match(self, match_id: int, user_id: int) -> Dict[str, Any]:
        match = self.match_model.get_by_id(match_id)
        if not match:
            return {
                'code': 1,
                'msg': '匹配记录不存在',
                'data': None
            }

        if match.get('user1_id') != user_id and match.get('user2_id') != user_id:
            return {
                'code': 1,
                'msg': '无权操作此匹配记录',
                'data': None
            }

        if match.get('status') != self.match_model.STATUS_ACTIVE:
            return {
                'code': 1,
                'msg': '该匹配已取消',
                'data': None
            }

        affected = self.match_model.cancel_match(match_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '已取消匹配',
                'data': None
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def get_all_matches(self, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        result = self.match_model.get_all(page, page_size, status)
        items = [self.match_model.to_public_dict(item) for item in result.get('items', [])]

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
