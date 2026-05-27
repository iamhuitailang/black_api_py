from typing import Dict, Any, Optional, List
from app.model.tousu_model import (
    ComplaintModel, FeedbackModel, NotificationModel, 
    EvaluationModel, LogModel, UserModel
)


class TousuComplaintBusiness:
    def __init__(self):
        self.complaint_model = ComplaintModel()
        self.feedback_model = FeedbackModel()
        self.notification_model = NotificationModel()
        self.evaluation_model = EvaluationModel()
        self.log_model = LogModel()
        self.user_model = UserModel()

    def create_complaint(self, user_id: int, complaint_type: str, category_id: int,
                         department_id: int, title: str, content: str,
                         priority: int = 1, is_anonymous: int = 0,
                         expected_time: str = None) -> Dict[str, Any]:
        if not title or not content:
            return {
                'code': 1,
                'msg': '标题和内容不能为空',
                'data': None
            }

        if complaint_type not in [ComplaintModel.TYPE_COMPLAINT, ComplaintModel.TYPE_SUGGESTION]:
            return {
                'code': 1,
                'msg': '类型不正确',
                'data': None
            }

        complaint_id = self.complaint_model.create(
            user_id=user_id,
            complaint_type=complaint_type,
            category_id=category_id,
            department_id=department_id,
            title=title,
            content=content,
            priority=priority,
            is_anonymous=is_anonymous,
            expected_time=expected_time
        )

        if complaint_id > 0:
            complaint = self.complaint_model.get_by_id(complaint_id)

            self.log_model.create(
                user_id=user_id,
                action=LogModel.TYPE_CREATE,
                target_type='complaint',
                target_id=complaint_id,
                description=f'提交{self.complaint_model.get_type_text(complaint_type)}: {title}'
            )

            return {
                'code': 0,
                'msg': '提交成功',
                'data': self.complaint_model.to_dict(complaint)
            }

        return {
            'code': 1,
            'msg': '提交失败',
            'data': None
        }

    def get_complaint_detail(self, complaint_id: int) -> Dict[str, Any]:
        complaint = self.complaint_model.get_by_id(complaint_id)
        if not complaint:
            return {
                'code': 1,
                'msg': '投诉建议不存在',
                'data': None
            }

        data = self.complaint_model.to_dict(complaint)

        feedbacks = self.feedback_model.get_by_complaint(complaint_id)
        data['feedbacks'] = [self.feedback_model.to_dict(fb) for fb in feedbacks]

        evaluation = self.evaluation_model.get_by_complaint(complaint_id)
        if evaluation:
            data['evaluation'] = self.evaluation_model.to_dict(evaluation)

        if complaint.get('user_id'):
            user = self.user_model.get_by_id(complaint['user_id'])
            if user:
                if complaint.get('is_anonymous'):
                    data['submitter'] = {'id': user['id'], 'nickname': '匿名用户'}
                else:
                    data['submitter'] = self.user_model.to_public_dict(user)

        if complaint.get('handler_id'):
            handler = self.user_model.get_by_id(complaint['handler_id'])
            if handler:
                data['handler'] = self.user_model.to_public_dict(handler)

        return {
            'code': 0,
            'msg': 'success',
            'data': data
        }

    def get_user_complaints(self, user_id: int, page: int = 1, page_size: int = 10,
                            complaint_type: str = None, status: int = None) -> Dict[str, Any]:
        result = self.complaint_model.get_by_user(user_id, page, page_size, complaint_type, status)
        items = [self.complaint_model.to_dict(item) for item in result.get('items', [])]

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

    def get_department_complaints(self, department_id: int, page: int = 1, page_size: int = 10,
                                  status: int = None, complaint_type: str = None) -> Dict[str, Any]:
        result = self.complaint_model.get_by_department(department_id, page, page_size, status, complaint_type)
        items = [self.complaint_model.to_dict(item) for item in result.get('items', [])]

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

    def get_handler_complaints(self, handler_id: int, page: int = 1, page_size: int = 10,
                               status: int = None) -> Dict[str, Any]:
        result = self.complaint_model.get_by_handler(handler_id, page, page_size, status)
        items = [self.complaint_model.to_dict(item) for item in result.get('items', [])]

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

    def get_all_complaints(self, page: int = 1, page_size: int = 10,
                           complaint_type: str = None, category_id: int = None,
                           department_id: int = None, status: int = None,
                           priority: int = None, keyword: str = None) -> Dict[str, Any]:
        result = self.complaint_model.get_list(
            page, page_size, complaint_type, category_id,
            department_id, status, priority, keyword
        )
        items = [self.complaint_model.to_dict(item) for item in result.get('items', [])]

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

    def update_complaint(self, complaint_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        complaint = self.complaint_model.get_by_id(complaint_id)
        if not complaint:
            return {
                'code': 1,
                'msg': '投诉建议不存在',
                'data': None
            }

        if complaint.get('status') not in [ComplaintModel.STATUS_PENDING]:
            return {
                'code': 1,
                'msg': '只能修改待处理状态的投诉建议',
                'data': None
            }

        affected = self.complaint_model.update(complaint_id, data)
        if affected >= 0:
            self.log_model.create(
                user_id=complaint.get('user_id', 0),
                action=LogModel.TYPE_UPDATE,
                target_type='complaint',
                target_id=complaint_id,
                description='修改投诉建议'
            )
            return {
                'code': 0,
                'msg': '修改成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '修改失败',
            'data': None
        }

    def cancel_complaint(self, complaint_id: int, user_id: int) -> Dict[str, Any]:
        complaint = self.complaint_model.get_by_id(complaint_id)
        if not complaint:
            return {
                'code': 1,
                'msg': '投诉建议不存在',
                'data': None
            }

        if complaint.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权操作',
                'data': None
            }

        if complaint.get('status') not in [ComplaintModel.STATUS_PENDING, ComplaintModel.STATUS_ACCEPTED]:
            return {
                'code': 1,
                'msg': '当前状态不能撤回',
                'data': None
            }

        affected = self.complaint_model.update_status(complaint_id, ComplaintModel.STATUS_CANCELLED)
        if affected > 0:
            self.log_model.create(
                user_id=user_id,
                action=LogModel.TYPE_UPDATE,
                target_type='complaint',
                target_id=complaint_id,
                description='撤回投诉建议'
            )
            return {
                'code': 0,
                'msg': '撤回成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '撤回失败',
            'data': None
        }

    def accept_complaint(self, complaint_id: int, handler_id: int) -> Dict[str, Any]:
        complaint = self.complaint_model.get_by_id(complaint_id)
        if not complaint:
            return {
                'code': 1,
                'msg': '投诉建议不存在',
                'data': None
            }

        if complaint.get('status') != ComplaintModel.STATUS_PENDING:
            return {
                'code': 1,
                'msg': '只能受理待处理状态的投诉建议',
                'data': None
            }

        affected = self.complaint_model.update_status(complaint_id, ComplaintModel.STATUS_ACCEPTED, handler_id)
        if affected > 0:
            self.feedback_model.create(
                complaint_id=complaint_id,
                handler_id=handler_id,
                content='已受理，将尽快处理',
                status='accepted'
            )

            self.notification_model.create(
                user_id=complaint.get('user_id', 0),
                notification_type=NotificationModel.TYPE_COMPLAINT,
                title='投诉建议已受理',
                content=f'您提交的"{complaint.get("title", "")}"已被受理',
                related_id=complaint_id
            )

            self.log_model.create(
                user_id=handler_id,
                action=LogModel.TYPE_HANDLE,
                target_type='complaint',
                target_id=complaint_id,
                description='受理投诉建议'
            )

            return {
                'code': 0,
                'msg': '受理成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '受理失败',
            'data': None
        }

    def process_complaint(self, complaint_id: int, handler_id: int) -> Dict[str, Any]:
        complaint = self.complaint_model.get_by_id(complaint_id)
        if not complaint:
            return {
                'code': 1,
                'msg': '投诉建议不存在',
                'data': None
            }

        if complaint.get('status') not in [ComplaintModel.STATUS_ACCEPTED, ComplaintModel.STATUS_PROCESSING]:
            return {
                'code': 1,
                'msg': '当前状态不能标记为处理中',
                'data': None
            }

        affected = self.complaint_model.update_status(complaint_id, ComplaintModel.STATUS_PROCESSING, handler_id)
        if affected > 0:
            self.feedback_model.create(
                complaint_id=complaint_id,
                handler_id=handler_id,
                content='正在处理中',
                status='processing'
            )

            self.log_model.create(
                user_id=handler_id,
                action=LogModel.TYPE_HANDLE,
                target_type='complaint',
                target_id=complaint_id,
                description='标记投诉建议为处理中'
            )

            return {
                'code': 0,
                'msg': '操作成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def complete_complaint(self, complaint_id: int, handler_id: int, handle_result: str) -> Dict[str, Any]:
        complaint = self.complaint_model.get_by_id(complaint_id)
        if not complaint:
            return {
                'code': 1,
                'msg': '投诉建议不存在',
                'data': None
            }

        if complaint.get('status') != ComplaintModel.STATUS_PROCESSING:
            return {
                'code': 1,
                'msg': '只有处理中的投诉建议可以完成',
                'data': None
            }

        if not handle_result:
            return {
                'code': 1,
                'msg': '处理结果不能为空',
                'data': None
            }

        self.complaint_model.update_handle_result(complaint_id, handle_result)
        affected = self.complaint_model.update_status(complaint_id, ComplaintModel.STATUS_COMPLETED, handler_id)

        if affected > 0:
            self.feedback_model.create(
                complaint_id=complaint_id,
                handler_id=handler_id,
                content=handle_result,
                status='completed'
            )

            self.notification_model.create(
                user_id=complaint.get('user_id', 0),
                notification_type=NotificationModel.TYPE_COMPLAINT,
                title='投诉建议处理完成',
                content=f'您提交的"{complaint.get("title", "")}"已处理完成',
                related_id=complaint_id
            )

            self.log_model.create(
                user_id=handler_id,
                action=LogModel.TYPE_HANDLE,
                target_type='complaint',
                target_id=complaint_id,
                description='完成投诉建议处理'
            )

            return {
                'code': 0,
                'msg': '处理完成',
                'data': None
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def reject_complaint(self, complaint_id: int, handler_id: int, reason: str) -> Dict[str, Any]:
        complaint = self.complaint_model.get_by_id(complaint_id)
        if not complaint:
            return {
                'code': 1,
                'msg': '投诉建议不存在',
                'data': None
            }

        if complaint.get('status') not in [ComplaintModel.STATUS_PENDING, ComplaintModel.STATUS_ACCEPTED]:
            return {
                'code': 1,
                'msg': '当前状态不能驳回',
                'data': None
            }

        self.complaint_model.update_handle_result(complaint_id, reason)
        affected = self.complaint_model.update_status(complaint_id, ComplaintModel.STATUS_REJECTED, handler_id)

        if affected > 0:
            self.feedback_model.create(
                complaint_id=complaint_id,
                handler_id=handler_id,
                content=reason,
                status='rejected'
            )

            self.notification_model.create(
                user_id=complaint.get('user_id', 0),
                notification_type=NotificationModel.TYPE_COMPLAINT,
                title='投诉建议已驳回',
                content=f'您提交的"{complaint.get("title", "")}"已被驳回',
                related_id=complaint_id
            )

            self.log_model.create(
                user_id=handler_id,
                action=LogModel.TYPE_HANDLE,
                target_type='complaint',
                target_id=complaint_id,
                description='驳回投诉建议'
            )

            return {
                'code': 0,
                'msg': '驳回成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '驳回失败',
            'data': None
        }

    def add_feedback(self, complaint_id: int, handler_id: int, content: str) -> Dict[str, Any]:
        complaint = self.complaint_model.get_by_id(complaint_id)
        if not complaint:
            return {
                'code': 1,
                'msg': '投诉建议不存在',
                'data': None
            }

        if not content:
            return {
                'code': 1,
                'msg': '反馈内容不能为空',
                'data': None
            }

        feedback_id = self.feedback_model.create(complaint_id, handler_id, content)
        if feedback_id > 0:
            return {
                'code': 0,
                'msg': '反馈成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '反馈失败',
            'data': None
        }

    def create_evaluation(self, complaint_id: int, user_id: int, rating: int, content: str = '') -> Dict[str, Any]:
        complaint = self.complaint_model.get_by_id(complaint_id)
        if not complaint:
            return {
                'code': 1,
                'msg': '投诉建议不存在',
                'data': None
            }

        if complaint.get('status') != ComplaintModel.STATUS_COMPLETED:
            return {
                'code': 1,
                'msg': '只有已完成的投诉建议可以评价',
                'data': None
            }

        if complaint.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '只能评价自己提交的投诉建议',
                'data': None
            }

        existing = self.evaluation_model.get_by_complaint(complaint_id)
        if existing:
            return {
                'code': 1,
                'msg': '已经评价过了',
                'data': None
            }

        if rating < 1 or rating > 5:
            return {
                'code': 1,
                'msg': '评分必须在1-5之间',
                'data': None
            }

        evaluation_id = self.evaluation_model.create(complaint_id, user_id, rating, content)
        if evaluation_id > 0:
            return {
                'code': 0,
                'msg': '评价成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '评价失败',
            'data': None
        }

    def get_statistics(self, department_id: int = None) -> Dict[str, Any]:
        stats = self.complaint_model.get_statistics()
        eval_stats = self.evaluation_model.get_statistics(department_id)

        stats['evaluation'] = eval_stats

        return {
            'code': 0,
            'msg': 'success',
            'data': stats
        }

    def export_complaints(self, department_id: int = None, status: int = None) -> Dict[str, Any]:
        result = self.complaint_model.get_list(
            page=1,
            page_size=10000,
            department_id=department_id,
            status=status
        )

        items = [self.complaint_model.to_dict(item) for item in result.get('items', [])]

        self.log_model.create(
            user_id=0,
            action=LogModel.TYPE_EXPORT,
            target_type='complaint',
            description='导出投诉建议数据'
        )

        return {
            'code': 0,
            'msg': '导出成功',
            'data': {
                'items': items,
                'total': len(items)
            }
        }