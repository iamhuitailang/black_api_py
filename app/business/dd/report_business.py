from typing import Dict, Any, Optional
from app.model.dd import ReportModel, TaskModel, UserModel


class DdReportBusiness:
    def __init__(self):
        self.report_model = ReportModel()
        self.task_model = TaskModel()
        self.user_model = UserModel()

    def submit_report(self, reporter_id: int, reported_id: int, 
                      reason: str, task_id: int = None) -> Dict[str, Any]:
        if reporter_id == reported_id:
            return {
                'code': 1,
                'msg': '不能举报自己',
                'data': None
            }
        
        reporter = self.user_model.get_by_id(reporter_id)
        if not reporter:
            return {
                'code': 1,
                'msg': '举报人不存在',
                'data': None
            }
        
        reported = self.user_model.get_by_id(reported_id)
        if not reported:
            return {
                'code': 1,
                'msg': '被举报人不存在',
                'data': None
            }
        
        if task_id:
            task = self.task_model.get_by_id(task_id)
            if not task:
                return {
                    'code': 1,
                    'msg': '关联任务不存在',
                    'data': None
                }
            
            publisher_id = task.get('publisher_id')
            receiver_id = task.get('receiver_id')
            
            if reporter_id != publisher_id and reporter_id != receiver_id:
                return {
                    'code': 1,
                    'msg': '您不是该任务的参与者',
                    'data': None
                }
        
        if not reason or len(reason.strip()) < 5:
            return {
                'code': 1,
                'msg': '举报原因至少5个字符',
                'data': None
            }
        
        report_id = self.report_model.create(reporter_id, reported_id, reason.strip(), task_id)
        if report_id > 0:
            report = self.report_model.get_by_id(report_id)
            return {
                'code': 0,
                'msg': '举报提交成功',
                'data': {
                    'id': report.get('id'),
                    'task_id': report.get('task_id'),
                    'reporter_id': report.get('reporter_id'),
                    'reported_id': report.get('reported_id'),
                    'reason': report.get('reason'),
                    'status': report.get('status'),
                    'status_text': self.report_model.get_status_text(report.get('status')),
                    'created_at': report.get('created_at')
                }
            }
        
        return {
            'code': 1,
            'msg': '举报提交失败',
            'data': None
        }

    def get_my_reports(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.report_model.get_by_reporter(user_id, page, page_size)
        
        items = []
        for report in result.get('items', []):
            reported = self.user_model.get_by_id(report.get('reported_id'))
            report_dict = {
                'id': report.get('id'),
                'task_id': report.get('task_id'),
                'reported_id': report.get('reported_id'),
                'reported_nickname': reported.get('nickname') if reported else None,
                'reason': report.get('reason'),
                'status': report.get('status'),
                'status_text': self.report_model.get_status_text(report.get('status')),
                'result': report.get('result'),
                'created_at': report.get('created_at'),
                'updated_at': report.get('updated_at')
            }
            items.append(report_dict)
        
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

    def get_report_detail(self, user_id: int, report_id: int) -> Dict[str, Any]:
        report = self.report_model.get_by_id(report_id)
        if not report:
            return {
                'code': 1,
                'msg': '举报记录不存在',
                'data': None
            }
        
        if report.get('reporter_id') != user_id:
            return {
                'code': 1,
                'msg': '您没有权限查看该举报',
                'data': None
            }
        
        reporter = self.user_model.get_by_id(report.get('reporter_id'))
        reported = self.user_model.get_by_id(report.get('reported_id'))
        
        task_info = None
        task_id = report.get('task_id')
        if task_id:
            task = self.task_model.get_by_id(task_id)
            if task:
                task_info = {
                    'id': task.get('id'),
                    'title': task.get('title'),
                    'category': task.get('category'),
                    'status': task.get('status')
                }
        
        result = {
            'id': report.get('id'),
            'task_id': report.get('task_id'),
            'task': task_info,
            'reporter': {
                'id': reporter.get('id'),
                'nickname': reporter.get('nickname'),
                'phone': reporter.get('phone')
            } if reporter else None,
            'reported': {
                'id': reported.get('id'),
                'nickname': reported.get('nickname'),
                'phone': reported.get('phone')
            } if reported else None,
            'reason': report.get('reason'),
            'status': report.get('status'),
            'status_text': self.report_model.get_status_text(report.get('status')),
            'result': report.get('result'),
            'created_at': report.get('created_at'),
            'updated_at': report.get('updated_at')
        }
        
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def handle_report(self, report_id: int, result: str, 
                      credit_adjust: int = 0) -> Dict[str, Any]:
        report = self.report_model.get_by_id(report_id)
        if not report:
            return {
                'code': 1,
                'msg': '举报记录不存在',
                'data': None
            }
        
        if report.get('status') == ReportModel.STATUS_HANDLED:
            return {
                'code': 1,
                'msg': '该举报已处理',
                'data': None
            }
        
        if not result or len(result.strip()) < 2:
            return {
                'code': 1,
                'msg': '处理结果不能为空',
                'data': None
            }
        
        affected = self.report_model.handle_report(report_id, result.strip())
        if affected > 0:
            if credit_adjust != 0:
                reported_id = report.get('reported_id')
                self.user_model.update_credit_score(reported_id, credit_adjust)
            
            updated_report = self.report_model.get_by_id(report_id)
            return {
                'code': 0,
                'msg': '举报处理成功',
                'data': {
                    'id': updated_report.get('id'),
                    'status': updated_report.get('status'),
                    'status_text': self.report_model.get_status_text(updated_report.get('status')),
                    'result': updated_report.get('result'),
                    'updated_at': updated_report.get('updated_at')
                }
            }
        
        return {
            'code': 1,
            'msg': '处理失败',
            'data': None
        }

    def get_pending_reports(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.report_model.get_pending(page, page_size)
        
        items = []
        for report in result.get('items', []):
            reporter = self.user_model.get_by_id(report.get('reporter_id'))
            reported = self.user_model.get_by_id(report.get('reported_id'))
            
            task_info = None
            task_id = report.get('task_id')
            if task_id:
                task = self.task_model.get_by_id(task_id)
                if task:
                    task_info = {
                        'id': task.get('id'),
                        'title': task.get('title')
                    }
            
            report_dict = {
                'id': report.get('id'),
                'task_id': report.get('task_id'),
                'task': task_info,
                'reporter': {
                    'id': reporter.get('id'),
                    'nickname': reporter.get('nickname')
                } if reporter else None,
                'reported': {
                    'id': reported.get('id'),
                    'nickname': reported.get('nickname')
                } if reported else None,
                'reason': report.get('reason'),
                'status': report.get('status'),
                'status_text': self.report_model.get_status_text(report.get('status')),
                'created_at': report.get('created_at')
            }
            items.append(report_dict)
        
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
