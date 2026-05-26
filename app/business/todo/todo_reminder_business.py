from typing import Dict, Any, List, Optional
from datetime import datetime
from app.model.todo import TodoReminderModel, TodoTaskModel


class TodoReminderBusiness:
    def __init__(self):
        self.reminder_model = TodoReminderModel()
        self.task_model = TodoTaskModel()

    def _check_owner(self, reminder_id: int, user_id: int) -> bool:
        reminder = self.reminder_model.get_by_id(reminder_id)
        if not reminder:
            return False
        return reminder.get('user_id') == user_id

    def _check_task_owner(self, task_id: int, user_id: int) -> bool:
        task = self.task_model.get_by_id(task_id)
        if not task:
            return False
        return task.get('user_id') == user_id

    def create(self, user_id: int, task_id: int, reminder_time: str,
               reminder_type: str = 'system', message: str = '') -> Dict[str, Any]:
        if not self._check_task_owner(task_id, user_id):
            return {
                'code': 1,
                'msg': '任务不存在或无权限操作',
                'data': None
            }

        if not reminder_time:
            return {
                'code': 1,
                'msg': '提醒时间不能为空',
                'data': None
            }

        try:
            datetime.fromisoformat(reminder_time)
        except (ValueError, TypeError):
            return {
                'code': 1,
                'msg': '提醒时间格式不正确',
                'data': None
            }

        reminder_id = self.reminder_model.create(user_id, task_id, reminder_time, reminder_type, message)
        if reminder_id > 0:
            reminder = self.reminder_model.get_by_id(reminder_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.reminder_model.to_dict(reminder)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def delete(self, reminder_id: int, user_id: int) -> Dict[str, Any]:
        if not self._check_owner(reminder_id, user_id):
            return {
                'code': 1,
                'msg': '提醒不存在或无权限操作',
                'data': None
            }

        affected = self.reminder_model.delete(reminder_id)
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

    def get_by_task_id(self, task_id: int, user_id: int) -> Dict[str, Any]:
        if not self._check_task_owner(task_id, user_id):
            return {
                'code': 1,
                'msg': '任务不存在或无权限查看',
                'data': None
            }

        reminders = self.reminder_model.get_by_task_id(task_id)
        items = [self.reminder_model.to_dict(r) for r in reminders]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_by_user_id(self, user_id: int, status: int = None) -> Dict[str, Any]:
        reminders = self.reminder_model.get_by_user_id(user_id, status)
        items = [self.reminder_model.to_dict(r) for r in reminders]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def cancel(self, reminder_id: int, user_id: int) -> Dict[str, Any]:
        if not self._check_owner(reminder_id, user_id):
            return {
                'code': 1,
                'msg': '提醒不存在或无权限操作',
                'data': None
            }

        affected = self.reminder_model.update_status(reminder_id, TodoReminderModel.STATUS_CANCELLED)
        if affected > 0:
            return {
                'code': 0,
                'msg': '取消成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '取消失败',
            'data': None
        }
