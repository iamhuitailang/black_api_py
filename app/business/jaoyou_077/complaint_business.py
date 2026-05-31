from typing import Dict, Any
from app.model.jaoyou_077 import ComplaintModel


class JaoyouComplaintBusiness:
    def __init__(self):
        self.complaint_model = ComplaintModel()

    def create_complaint(self, from_user_id: int, to_user_id: int, reason: str, description: str) -> Dict[str, Any]:
        if from_user_id == to_user_id:
            return {
                'code': 1,
                'msg': '不能投诉自己',
                'data': None
            }

        if not reason:
            return {
                'code': 1,
                'msg': '投诉原因不能为空',
                'data': None
            }

        complaint_id = self.complaint_model.create(from_user_id, to_user_id, reason, description)
        if complaint_id > 0:
            return {
                'code': 0,
                'msg': '投诉提交成功',
                'data': {'complaint_id': complaint_id}
            }

        return {
            'code': 1,
            'msg': '投诉提交失败',
            'data': None
        }

    def get_user_complaints(self, user_id: int, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        result = self.complaint_model.get_user_complaints(user_id, page, page_size, status)
        items = [self.complaint_model.to_public_dict(item) for item in result.get('items', [])]

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

    def process_complaint(self, complaint_id: int, status: int, reply: str = '') -> Dict[str, Any]:
        complaint = self.complaint_model.get_by_id(complaint_id)
        if not complaint:
            return {
                'code': 1,
                'msg': '投诉记录不存在',
                'data': None
            }

        if complaint.get('status') != self.complaint_model.STATUS_PENDING:
            return {
                'code': 1,
                'msg': '该投诉已处理',
                'data': None
            }

        affected = self.complaint_model.update_status(complaint_id, status, reply)
        if affected > 0:
            msg = '已处理' if status == self.complaint_model.STATUS_PROCESSED else '已驳回'
            return {
                'code': 0,
                'msg': msg,
                'data': None
            }

        return {
            'code': 1,
            'msg': '处理失败',
            'data': None
        }

    def get_all_complaints(self, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        result = self.complaint_model.get_all(page, page_size, status)
        items = [self.complaint_model.to_public_dict(item) for item in result.get('items', [])]

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
