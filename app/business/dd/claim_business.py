from typing import Dict, Any, Optional
from app.model.dd import TaskClaimModel, TaskModel, UserModel


class DdClaimBusiness:
    def __init__(self):
        self.claim_model = TaskClaimModel()
        self.task_model = TaskModel()
        self.user_model = UserModel()

    def claim_task(self, user_id: int, task_id: int) -> Dict[str, Any]:
        task = self.task_model.get_by_id(task_id)
        if not task:
            return {
                'code': 1,
                'msg': '任务不存在',
                'data': None
            }
        
        if task.get('status') != TaskModel.STATUS_PENDING:
            return {
                'code': 1,
                'msg': '该任务已被接单或已取消',
                'data': None
            }
        
        if task.get('publisher_id') == user_id:
            return {
                'code': 1,
                'msg': '不能抢自己发布的任务',
                'data': None
            }
        
        if self.claim_model.has_claimed(task_id, user_id):
            return {
                'code': 1,
                'msg': '您已经抢过该任务了',
                'data': None
            }
        
        claim_id = self.claim_model.create(task_id, user_id)
        if claim_id <= 0:
            return {
                'code': 1,
                'msg': '抢单失败',
                'data': None
            }
        
        affected = self.task_model.assign_receiver(task_id, user_id)
        if affected > 0:
            updated_task = self.task_model.get_by_id(task_id)
            return {
                'code': 0,
                'msg': '抢单成功',
                'data': self.task_model.to_dict(updated_task)
            }
        
        self.claim_model.cancel_claim(claim_id)
        return {
            'code': 1,
            'msg': '抢单失败，请稍后重试',
            'data': None
        }

    def cancel_claim(self, user_id: int, task_id: int) -> Dict[str, Any]:
        task = self.task_model.get_by_id(task_id)
        if not task:
            return {
                'code': 1,
                'msg': '任务不存在',
                'data': None
            }
        
        if task.get('receiver_id') != user_id:
            return {
                'code': 1,
                'msg': '您不是该任务的接单者',
                'data': None
            }
        
        status = task.get('status')
        if status not in [TaskModel.STATUS_ACCEPTED, TaskModel.STATUS_IN_PROGRESS]:
            return {
                'code': 1,
                'msg': '该任务状态不能取消抢单',
                'data': None
            }
        
        affected = self.claim_model.cancel_by_task_and_receiver(task_id, user_id)
        if affected <= 0:
            return {
                'code': 1,
                'msg': '取消抢单失败',
                'data': None
            }
        
        self.task_model.update_status(task_id, TaskModel.STATUS_PENDING)
        
        self.task_model.exec.update(task_id, {'receiver_id': None})
        
        return {
            'code': 0,
            'msg': '已取消抢单，任务已退回待接单状态',
            'data': None
        }

    def get_my_claims(self, user_id: int, page: int = 1, page_size: int = 10,
                      is_cancelled: int = None) -> Dict[str, Any]:
        result = self.claim_model.get_by_receiver(user_id, page, page_size, is_cancelled)
        
        items = []
        for claim in result.get('items', []):
            task = self.task_model.get_by_id(claim.get('task_id'))
            if task:
                task_dict = self.task_model.to_dict(task)
                task_dict['claim_time'] = claim.get('claim_time')
                task_dict['is_cancelled'] = claim.get('is_cancelled')
                task_dict['cancel_time'] = claim.get('cancel_time')
                
                publisher = self.user_model.get_by_id(task.get('publisher_id'))
                if publisher:
                    task_dict['publisher'] = {
                        'id': publisher.get('id'),
                        'nickname': publisher.get('nickname'),
                        'avatar_url': publisher.get('avatar_url')
                    }
                items.append(task_dict)
        
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

    def check_claim_status(self, user_id: int, task_id: int) -> Dict[str, Any]:
        task = self.task_model.get_by_id(task_id)
        if not task:
            return {
                'code': 1,
                'msg': '任务不存在',
                'data': None
            }
        
        has_claimed = self.claim_model.has_claimed(task_id, user_id)
        claim = self.claim_model.get_by_task_and_receiver(task_id, user_id)
        
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'has_claimed': has_claimed,
                'task_status': task.get('status'),
                'task_status_text': self.task_model.get_status_text(task.get('status')),
                'receiver_id': task.get('receiver_id'),
                'claim_info': claim
            }
        }
