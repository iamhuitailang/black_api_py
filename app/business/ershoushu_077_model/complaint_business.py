from typing import Dict, Any
from app.model.ershoushu_077_model import ErshoushuComplaintModel, ErshoushuUserModel, ErshoushuNotificationModel


class ErshoushuComplaintBusiness:
    def __init__(self):
        self.complaint_model = ErshoushuComplaintModel()
        self.user_model = ErshoushuUserModel()
        self.notification_model = ErshoushuNotificationModel()

    def create_complaint(self, user_id: int, target_user_id: int, trade_id: int,
                         reason: str, description: str = '') -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}

        if not reason or len(reason.strip()) < 2:
            return {'code': 1, 'msg': '投诉原因至少2个字符', 'data': None}

        complaint_id = self.complaint_model.create(
            user_id=user_id,
            target_user_id=target_user_id,
            trade_id=trade_id,
            reason=reason.strip(),
            description=description
        )

        if complaint_id > 0:
            complaint = self.complaint_model.get_by_id(complaint_id)
            return {'code': 0, 'msg': '投诉提交成功', 'data': self.complaint_model.to_dict(complaint)}
        return {'code': 1, 'msg': '投诉提交失败', 'data': None}

    def get_my_complaints(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.complaint_model.get_by_user(user_id, page, page_size)
        items = [self.complaint_model.to_dict(item) for item in result.get('items', [])]
        return {
            'code': 0, 'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_all_complaints(self, page: int = 1, page_size: int = 10,
                           status: int = None) -> Dict[str, Any]:
        result = self.complaint_model.get_all(page, page_size, status)

        items = []
        for complaint in result.get('items', []):
            complaint_data = self.complaint_model.to_dict(complaint)

            user = self.user_model.get_by_id(complaint.get('user_id'))
            if user:
                complaint_data['user'] = {
                    'id': user.get('id'),
                    'nickname': user.get('nickname'),
                    'username': user.get('username')
                }

            target_user = self.user_model.get_by_id(complaint.get('target_user_id'))
            if target_user:
                complaint_data['target_user'] = {
                    'id': target_user.get('id'),
                    'nickname': target_user.get('nickname'),
                    'username': target_user.get('username')
                }

            items.append(complaint_data)

        return {
            'code': 0, 'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def handle_complaint(self, complaint_id: int, status: int, admin_reply: str = '') -> Dict[str, Any]:
        complaint = self.complaint_model.get_by_id(complaint_id)
        if not complaint:
            return {'code': 1, 'msg': '投诉不存在', 'data': None}

        if admin_reply:
            affected = self.complaint_model.update_reply(complaint_id, admin_reply)
        else:
            affected = self.complaint_model.update_status(complaint_id, status)

        if affected > 0:
            self.notification_model.create(
                user_id=complaint.get('user_id'),
                title='投诉处理通知',
                content=f'您的投诉已被处理：{admin_reply or "已更新状态"}',
                ntype=ErshoushuNotificationModel.TYPE_COMPLAINT,
                related_id=complaint_id
            )

            return {'code': 0, 'msg': '处理成功', 'data': None}
        return {'code': 1, 'msg': '处理失败', 'data': None}

    def get_statistics(self) -> Dict[str, Any]:
        stats = self.complaint_model.get_statistics()
        return {'code': 0, 'msg': 'success', 'data': stats}
