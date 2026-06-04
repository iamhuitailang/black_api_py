from typing import Dict, Any, List, Optional
import random
from app.model.maomi_model import VisitorModel, CatModel


class VisitorBusiness:
    def __init__(self):
        self.model = VisitorModel()
        self.cat_model = CatModel()

    def get_all_visitors(self, user_id: int, limit: int = 50) -> Dict[str, Any]:
        try:
            visitors = self.model.get_by_user_id(user_id, limit)
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'items': visitors,
                    'count': len(visitors)
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_active_visitors(self, user_id: int) -> Dict[str, Any]:
        try:
            visitors = self.model.get_active(user_id)
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'items': visitors,
                    'count': len(visitors)
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_visitor(self, visitor_id: int) -> Dict[str, Any]:
        visitor = self.model.get_by_id(visitor_id)
        if visitor:
            return {
                'code': 0,
                'message': 'success',
                'data': visitor
            }
        return {
            'code': 1,
            'message': '访客不存在',
            'data': None
        }

    def generate_visitor(self, user_id: int, bring_cat: bool = False) -> Dict[str, Any]:
        try:
            visitor = self.model.generate_random_visitor(user_id, bring_cat)
            if visitor:
                if bring_cat and visitor.get('cat_name'):
                    self.cat_model.add_visitor_cat(user_id, visitor.get('name'))
                return {
                    'code': 0,
                    'message': '新访客到来',
                    'data': visitor
                }
            return {
                'code': 1,
                'message': '生成访客失败',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def visitor_leave(self, user_id: int, visitor_id: int) -> Dict[str, Any]:
        visitor = self.model.get_by_id(visitor_id)
        if not visitor:
            return {
                'code': 1,
                'message': '访客不存在',
                'data': None
            }
        if visitor.get('user_id') != user_id:
            return {
                'code': 1,
                'message': '无权限操作此访客',
                'data': None
            }
        try:
            visitor = self.model.visitor_leave(visitor_id)
            if visitor and visitor.get('cat_name'):
                self.cat_model.delete_visitors(user_id)
            if visitor:
                return {
                    'code': 0,
                    'message': '访客离开',
                    'data': visitor
                }
            return {
                'code': 1,
                'message': '操作失败',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def clear_all_visitors(self, user_id: int) -> Dict[str, Any]:
        try:
            count = self.model.clear_active(user_id)
            self.cat_model.delete_visitors(user_id)
            return {
                'code': 0,
                'message': f'已清除{count}位访客',
                'data': {
                    'count': count
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def count_active_visitors(self, user_id: int) -> Dict[str, Any]:
        try:
            count = self.model.count_active(user_id)
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'count': count
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }
