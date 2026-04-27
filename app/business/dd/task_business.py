from typing import Dict, Any, Optional
from app.model.dd import TaskModel, UserModel


class DdTaskBusiness:
    def __init__(self):
        self.task_model = TaskModel()
        self.user_model = UserModel()

    def publish_task(self, publisher_id: int, title: str, category: str, 
                     description: str, budget: float, address: str,
                     scheduled_hours: int = 6) -> Dict[str, Any]:
        if not title or len(title.strip()) == 0:
            return {
                'code': 1,
                'msg': '任务标题不能为空',
                'data': None
            }
        
        if category not in TaskModel.CATEGORIES:
            return {
                'code': 1,
                'msg': f'任务分类必须是: {", ".join(TaskModel.CATEGORIES)}',
                'data': None
            }
        
        if budget < 0:
            return {
                'code': 1,
                'msg': '预算金额不能为负数',
                'data': None
            }
        
        publisher = self.user_model.get_by_id(publisher_id)
        if not publisher:
            return {
                'code': 1,
                'msg': '发布者不存在',
                'data': None
            }
        
        task_id = self.task_model.create(
            publisher_id=publisher_id,
            title=title.strip(),
            category=category,
            description=description or '',
            budget=budget,
            address=address or '',
            scheduled_hours=scheduled_hours
        )
        
        if task_id > 0:
            task = self.task_model.get_by_id(task_id)
            return {
                'code': 0,
                'msg': '任务发布成功',
                'data': self.task_model.to_dict(task)
            }
        
        return {
            'code': 1,
            'msg': '任务发布失败',
            'data': None
        }

    def get_task_detail(self, task_id: int, user_id: int = None) -> Dict[str, Any]:
        task = self.task_model.get_by_id(task_id)
        if not task:
            return {
                'code': 1,
                'msg': '任务不存在',
                'data': None
            }
        
        result = self.task_model.to_dict(task)
        
        publisher = self.user_model.get_by_id(task.get('publisher_id'))
        if publisher:
            result['publisher'] = {
                'id': publisher.get('id'),
                'nickname': publisher.get('nickname'),
                'avatar_url': publisher.get('avatar_url'),
                'is_verified': publisher.get('is_verified'),
                'credit_score': publisher.get('credit_score')
            }
        
        receiver_id = task.get('receiver_id')
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

    def get_pending_tasks(self, page: int = 1, page_size: int = 10,
                          category: str = None, keyword: str = None) -> Dict[str, Any]:
        self.task_model.check_and_expire()
        
        if keyword or category:
            result = self.task_model.get_pending_tasks(page, page_size, category, keyword)
        else:
            result = self.task_model.get_pending_tasks(page, page_size)
        
        items = []
        for task in result.get('items', []):
            task_dict = self.task_model.to_dict(task)
            publisher = self.user_model.get_by_id(task.get('publisher_id'))
            if publisher:
                task_dict['publisher'] = {
                    'id': publisher.get('id'),
                    'nickname': publisher.get('nickname'),
                    'avatar_url': publisher.get('avatar_url'),
                    'is_verified': publisher.get('is_verified')
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

    def get_my_published_tasks(self, user_id: int, page: int = 1, page_size: int = 10,
                                status: int = None) -> Dict[str, Any]:
        result = self.task_model.get_by_publisher(user_id, page, page_size, status)
        
        items = [self.task_model.to_dict(task) for task in result.get('items', [])]
        
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

    def get_my_received_tasks(self, user_id: int, page: int = 1, page_size: int = 10,
                               status: int = None) -> Dict[str, Any]:
        result = self.task_model.get_by_receiver(user_id, page, page_size, status)
        
        items = []
        for task in result.get('items', []):
            task_dict = self.task_model.to_dict(task)
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

    def update_task(self, user_id: int, task_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        task = self.task_model.get_by_id(task_id)
        if not task:
            return {
                'code': 1,
                'msg': '任务不存在',
                'data': None
            }
        
        if task.get('publisher_id') != user_id:
            return {
                'code': 1,
                'msg': '只能修改自己发布的任务',
                'data': None
            }
        
        if task.get('status') != TaskModel.STATUS_PENDING:
            return {
                'code': 1,
                'msg': '只能修改待接单状态的任务',
                'data': None
            }
        
        category = data.get('category')
        if category and category not in TaskModel.CATEGORIES:
            return {
                'code': 1,
                'msg': f'任务分类必须是: {", ".join(TaskModel.CATEGORIES)}',
                'data': None
            }
        
        budget = data.get('budget')
        if budget is not None and float(budget) < 0:
            return {
                'code': 1,
                'msg': '预算金额不能为负数',
                'data': None
            }
        
        update_data = {}
        if 'title' in data:
            update_data['title'] = data['title'].strip()
        if 'category' in data:
            update_data['category'] = data['category']
        if 'description' in data:
            update_data['description'] = data['description'] or ''
        if 'budget' in data:
            update_data['budget'] = float(data['budget'])
        if 'address' in data:
            update_data['address'] = data['address'] or ''
        
        if not update_data:
            return {
                'code': 1,
                'msg': '没有需要更新的内容',
                'data': None
            }
        
        affected = self.task_model.update(task_id, update_data)
        if affected >= 0:
            updated_task = self.task_model.get_by_id(task_id)
            return {
                'code': 0,
                'msg': '任务更新成功',
                'data': self.task_model.to_dict(updated_task)
            }
        
        return {
            'code': 1,
            'msg': '任务更新失败',
            'data': None
        }

    def cancel_task(self, user_id: int, task_id: int) -> Dict[str, Any]:
        task = self.task_model.get_by_id(task_id)
        if not task:
            return {
                'code': 1,
                'msg': '任务不存在',
                'data': None
            }
        
        if task.get('publisher_id') != user_id:
            return {
                'code': 1,
                'msg': '只能取消自己发布的任务',
                'data': None
            }
        
        status = task.get('status')
        if status not in [TaskModel.STATUS_PENDING, TaskModel.STATUS_ACCEPTED]:
            return {
                'code': 1,
                'msg': '该任务状态不能取消',
                'data': None
            }
        
        affected = self.task_model.cancel_task(task_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '任务已取消',
                'data': None
            }
        
        return {
            'code': 1,
            'msg': '取消失败',
            'data': None
        }

    def get_categories(self) -> Dict[str, Any]:
        return {
            'code': 0,
            'msg': 'success',
            'data': TaskModel.CATEGORIES
        }

    def get_statuses(self) -> Dict[str, Any]:
        status_list = [
            {'value': TaskModel.STATUS_PENDING, 'text': '待接单'},
            {'value': TaskModel.STATUS_ACCEPTED, 'text': '已接单'},
            {'value': TaskModel.STATUS_IN_PROGRESS, 'text': '进行中'},
            {'value': TaskModel.STATUS_COMPLETED, 'text': '已完成'},
            {'value': TaskModel.STATUS_CANCELLED, 'text': '已取消'},
            {'value': TaskModel.STATUS_EXPIRED, 'text': '已过期'}
        ]
        return {
            'code': 0,
            'msg': 'success',
            'data': status_list
        }
