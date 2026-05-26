from typing import Dict, Any, List, Optional
from app.model.todo import TodoTaskModel, TodoReminderModel


class TodoTaskBusiness:
    def __init__(self):
        self.task_model = TodoTaskModel()
        self.reminder_model = TodoReminderModel()

    def _check_owner(self, task_id: int, user_id: int) -> bool:
        task = self.task_model.get_by_id(task_id)
        if not task:
            return False
        return task.get('user_id') == user_id

    def create(self, user_id: int, title: str, description: str = '',
               project_id: int = 0, status: int = 0, priority: int = 1,
               tags: str = '', due_date: str = None, estimated_time: int = 0,
               sort_order: int = 0) -> Dict[str, Any]:
        if not title or len(title) < 1:
            return {
                'code': 1,
                'msg': '任务标题不能为空',
                'data': None
            }

        task_id = self.task_model.create(
            user_id, title, description, project_id, status, priority,
            tags, due_date, estimated_time, sort_order
        )
        if task_id > 0:
            task = self.task_model.get_by_id(task_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.task_model.to_dict(task, include_reminders=True)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update(self, task_id: int, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        if not self._check_owner(task_id, user_id):
            return {
                'code': 1,
                'msg': '任务不存在或无权限操作',
                'data': None
            }

        if 'tags' in data and isinstance(data['tags'], list):
            data['tags'] = ','.join(data['tags'])

        affected = self.task_model.update(task_id, data)
        if affected >= 0:
            updated_task = self.task_model.get_by_id(task_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.task_model.to_dict(updated_task, include_reminders=True)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete(self, task_id: int, user_id: int) -> Dict[str, Any]:
        if not self._check_owner(task_id, user_id):
            return {
                'code': 1,
                'msg': '任务不存在或无权限操作',
                'data': None
            }

        self.reminder_model.delete_by_task_id(task_id)
        affected = self.task_model.delete(task_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '删除成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '删除失败',
            'data': None
        }

    def get_by_id(self, task_id: int, user_id: int) -> Dict[str, Any]:
        task = self.task_model.get_by_id(task_id)
        if not task or task.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '任务不存在或无权限查看',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.task_model.to_dict(task, include_reminders=True)
        }

    def get_list(self, user_id: int, page: int = 1, page_size: int = 10,
                 status: int = None, priority: int = None, project_id: int = None,
                 keyword: str = None, start_date: str = None, end_date: str = None,
                 order_by: str = 'priority DESC, due_date ASC, id DESC') -> Dict[str, Any]:
        result = self.task_model.get_list(
            user_id, page, page_size, status, priority, project_id,
            keyword, start_date, end_date, order_by
        )
        items = [self.task_model.to_dict(item) for item in result.get('items', [])]

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

    def get_today_tasks(self, user_id: int) -> Dict[str, Any]:
        tasks = self.task_model.get_today_tasks(user_id)
        items = [self.task_model.to_dict(t) for t in tasks]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_overdue_tasks(self, user_id: int) -> Dict[str, Any]:
        tasks = self.task_model.get_overdue_tasks(user_id)
        items = [self.task_model.to_dict(t) for t in tasks]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_by_date_range(self, user_id: int, start_date: str, end_date: str) -> Dict[str, Any]:
        tasks = self.task_model.get_by_date_range(user_id, start_date, end_date)
        items = [self.task_model.to_dict(t) for t in tasks]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def update_status(self, task_id: int, user_id: int, status: int) -> Dict[str, Any]:
        if not self._check_owner(task_id, user_id):
            return {
                'code': 1,
                'msg': '任务不存在或无权限操作',
                'data': None
            }

        affected = self.task_model.update_status(task_id, status)
        if affected > 0:
            updated_task = self.task_model.get_by_id(task_id)
            return {
                'code': 0,
                'msg': '状态更新成功',
                'data': self.task_model.to_dict(updated_task)
            }

        return {
            'code': 1,
            'msg': '状态更新失败',
            'data': None
        }

    def complete(self, task_id: int, user_id: int) -> Dict[str, Any]:
        return self.update_status(task_id, user_id, TodoTaskModel.STATUS_COMPLETED)

    def start(self, task_id: int, user_id: int) -> Dict[str, Any]:
        return self.update_status(task_id, user_id, TodoTaskModel.STATUS_IN_PROGRESS)

    def pause(self, task_id: int, user_id: int) -> Dict[str, Any]:
        return self.update_status(task_id, user_id, TodoTaskModel.STATUS_PENDING)

    def cancel(self, task_id: int, user_id: int) -> Dict[str, Any]:
        return self.update_status(task_id, user_id, TodoTaskModel.STATUS_CANCELLED)

    def move_to_project(self, task_id: int, user_id: int, project_id: int) -> Dict[str, Any]:
        if not self._check_owner(task_id, user_id):
            return {
                'code': 1,
                'msg': '任务不存在或无权限操作',
                'data': None
            }

        affected = self.task_model.move_to_project(task_id, project_id)
        if affected > 0:
            updated_task = self.task_model.get_by_id(task_id)
            return {
                'code': 0,
                'msg': '移动成功',
                'data': self.task_model.to_dict(updated_task)
            }

        return {
            'code': 1,
            'msg': '移动失败',
            'data': None
        }

    def batch_delete(self, task_ids: List[int], user_id: int) -> Dict[str, Any]:
        success_count = 0
        for task_id in task_ids:
            if self._check_owner(task_id, user_id):
                self.reminder_model.delete_by_task_id(task_id)
                affected = self.task_model.delete(task_id)
                if affected > 0:
                    success_count += 1

        return {
            'code': 0,
            'msg': f'成功删除{success_count}个任务',
            'data': {'success_count': success_count}
        }

    def batch_update_status(self, task_ids: List[int], user_id: int, status: int) -> Dict[str, Any]:
        success_count = 0
        for task_id in task_ids:
            if self._check_owner(task_id, user_id):
                affected = self.task_model.update_status(task_id, status)
                if affected > 0:
                    success_count += 1

        return {
            'code': 0,
            'msg': f'成功更新{success_count}个任务状态',
            'data': {'success_count': success_count}
        }
