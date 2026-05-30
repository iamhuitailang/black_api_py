from typing import Dict, Any, List, Optional
from app.model.biaoqing_model import ReportModel, MessageModel


class BqReportBusiness:
    def __init__(self):
        self.report_model = ReportModel()
        self.message_model = MessageModel()

    def create(self, user_id: int, type: int, target_id: int, reason: str,
                 description: str = '', images: str = '') -> Dict[str, Any]:
        if user_id <= 0:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if not reason:
            return {
                'code': 1,
                'msg': '举报原因不能为空',
                'data': None
            }

        report_id = self.report_model.create(
            user_id=user_id, type=type, target_id=target_id,
            reason=reason, description=description, images=images
        )

        if report_id > 0:
            report = self.report_model.get_by_id(report_id)
            return {
                'code': 0,
                'msg': '举报成功，我们将尽快处理',
                'data': self.report_model.to_dict(report)
            }

        return {
            'code': 1,
            'msg': '举报失败',
            'data': None
        }

    def get_by_id(self, report_id: int) -> Dict[str, Any]:
        report = self.report_model.get_by_id(report_id)
        if not report:
            return {
                'code': 1,
                'msg': '举报记录不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.report_model.to_dict(report)
        }

    def get_list(self, page: int = 1, page_size: int = 20,
                 status: int = None, type: int = None) -> Dict[str, Any]:
        result = self.report_model.get_all(page, page_size, status, type)
        items = [self.report_model.to_dict(item) for item in result.get('items', [])]

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

    def get_user_reports(self, user_id: int, page: int = 1, page_size: int = 20,
                         status: int = None) -> Dict[str, Any]:
        result = self.report_model.get_user_reports(user_id, page, page_size, status)
        items = [self.report_model.to_dict(item) for item in result.get('items', [])]

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

    def handle(self, report_id: int, status: int, handle_result: str = '',
               handled_by: int = 0) -> Dict[str, Any]:
        report = self.report_model.get_by_id(report_id)
        if not report:
            return {
                'code': 1,
                'msg': '举报记录不存在',
                'data': None
            }

        affected = self.report_model.update_status(report_id, status, handle_result, handled_by)
        if affected > 0:
            updated = self.report_model.get_by_id(report_id)

            user_id = report.get('user_id')
            status_text = self.report_model.get_status_text(status)
            self.message_model.create(
                user_id=user_id,
                type=MessageModel.TYPE_SYSTEM,
                title='举报处理结果',
                content=f'您的举报已{status_text}，处理结果：{handle_result}'
            )

            return {
                'code': 0,
                'msg': '处理成功',
                'data': self.report_model.to_dict(updated)
            }

        return {
            'code': 1,
            'msg': '处理失败',
            'data': None
        }
