from typing import Dict, Any, Optional
from app.model.dd import TaskModel, UserModel, TaskClaimModel


class DdContactBusiness:
    def __init__(self):
        self.task_model = TaskModel()
        self.user_model = UserModel()
        self.claim_model = TaskClaimModel()

    def get_contact_info(self, user_id: int, task_id: int) -> Dict[str, Any]:
        task = self.task_model.get_by_id(task_id)
        if not task:
            return {
                'code': 1,
                'msg': '任务不存在',
                'data': None
            }
        
        publisher_id = task.get('publisher_id')
        receiver_id = task.get('receiver_id')
        
        if user_id != publisher_id and user_id != receiver_id:
            return {
                'code': 1,
                'msg': '您没有权限查看该任务的联系方式',
                'data': None
            }
        
        status = task.get('status')
        if status in [TaskModel.STATUS_PENDING, TaskModel.STATUS_CANCELLED, TaskModel.STATUS_EXPIRED]:
            return {
                'code': 1,
                'msg': '该任务状态下无法查看联系方式',
                'data': None
            }
        
        target_user_id = None
        if user_id == publisher_id:
            target_user_id = receiver_id
        else:
            target_user_id = publisher_id
        
        if not target_user_id:
            return {
                'code': 1,
                'msg': '暂无对方联系方式',
                'data': None
            }
        
        target_user = self.user_model.get_by_id(target_user_id)
        if not target_user:
            return {
                'code': 1,
                'msg': '对方用户不存在',
                'data': None
            }
        
        contact_info = {
            'user_id': target_user.get('id'),
            'nickname': target_user.get('nickname'),
            'avatar_url': target_user.get('avatar_url'),
            'contact_phone': target_user.get('contact_phone'),
            'wechat_qrcode_url': target_user.get('wechat_qrcode_url'),
            'phone': target_user.get('phone')
        }
        
        return {
            'code': 0,
            'msg': 'success',
            'data': contact_info
        }

    def get_task_participants(self, user_id: int, task_id: int) -> Dict[str, Any]:
        task = self.task_model.get_by_id(task_id)
        if not task:
            return {
                'code': 1,
                'msg': '任务不存在',
                'data': None
            }
        
        publisher_id = task.get('publisher_id')
        receiver_id = task.get('receiver_id')
        
        if user_id != publisher_id and user_id != receiver_id:
            return {
                'code': 1,
                'msg': '您没有权限查看该任务的参与者信息',
                'data': None
            }
        
        result = {
            'task_id': task.get('id'),
            'task_status': task.get('status'),
            'task_status_text': self.task_model.get_status_text(task.get('status'))
        }
        
        publisher = self.user_model.get_by_id(publisher_id)
        if publisher:
            result['publisher'] = {
                'id': publisher.get('id'),
                'nickname': publisher.get('nickname'),
                'avatar_url': publisher.get('avatar_url'),
                'is_verified': publisher.get('is_verified'),
                'credit_score': publisher.get('credit_score')
            }
        
        if receiver_id:
            receiver = self.user_model.get_by_id(receiver_id)
            if receiver:
                result['receiver'] = {
                    'id': receiver.get('id'),
                    'nickname': receiver.get('nickname'),
                    'avatar_url': receiver.get('avatar_url'),
                    'is_verified': receiver.get('is_verified'),
                    'credit_score': receiver.get('credit_score')
                }
        
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }
