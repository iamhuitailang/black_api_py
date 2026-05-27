from typing import Dict, Any, List, Optional
from app.model.daka import ReminderModel, TaskModel


class DakaReminderBusiness:
    def __init__(self):
        self.reminder_model = ReminderModel()
        self.task_model = TaskModel()

    def get_user_reminders(self, user_id: int) -> Dict[str, Any]:
        reminders = self.reminder_model.get_user_reminders(user_id)
        result = [self.reminder_model.to_dict(r) for r in reminders]
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_reminder_detail(self, reminder_id: int, user_id: int) -> Dict[str, Any]:
        reminder = self.reminder_model.get_by_id(reminder_id)
        if not reminder:
            return {
                'code': 1,
                'msg': '提醒不存在',
                'data': None
            }

        if reminder.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限访问此提醒',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.reminder_model.to_dict(reminder)
        }

    def create_reminder(self, user_id: int, task_id: int = 0, title: str = '',
                        content: str = '', remind_time: str = '',
                        repeat_type: str = 'daily') -> Dict[str, Any]:
        if not remind_time:
            return {
                'code': 1,
                'msg': '提醒时间不能为空',
                'data': None
            }

        if task_id > 0:
            task = self.task_model.get_by_id(task_id)
            if not task:
                return {
                    'code': 1,
                    'msg': '关联任务不存在',
                    'data': None
                }
            if task.get('is_system') != 1 and task.get('user_id') != user_id:
                return {
                    'code': 1,
                    'msg': '无权限关联此任务',
                    'data': None
                }
            if not title:
                title = task.get('name', '')
            if not content:
                content = f'该完成{task.get("name", "任务")}了！'

        reminder_id = self.reminder_model.create(
            user_id=user_id,
            task_id=task_id,
            title=title,
            content=content,
            remind_time=remind_time,
            repeat_type=repeat_type
        )

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

    def update_reminder(self, reminder_id: int, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        reminder = self.reminder_model.get_by_id(reminder_id)
        if not reminder:
            return {
                'code': 1,
                'msg': '提醒不存在',
                'data': None
            }

        if reminder.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限修改此提醒',
                'data': None
            }

        affected = self.reminder_model.update(reminder_id, data)
        if affected >= 0:
            updated_reminder = self.reminder_model.get_by_id(reminder_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.reminder_model.to_dict(updated_reminder)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def toggle_reminder_status(self, reminder_id: int, user_id: int) -> Dict[str, Any]:
        reminder = self.reminder_model.get_by_id(reminder_id)
        if not reminder:
            return {
                'code': 1,
                'msg': '提醒不存在',
                'data': None
            }

        if reminder.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限操作此提醒',
                'data': None
            }

        affected = self.reminder_model.toggle_status(reminder_id)
        if affected > 0:
            updated_reminder = self.reminder_model.get_by_id(reminder_id)
            return {
                'code': 0,
                'msg': '状态更新成功',
                'data': self.reminder_model.to_dict(updated_reminder)
            }

        return {
            'code': 1,
            'msg': '状态更新失败',
            'data': None
        }

    def delete_reminder(self, reminder_id: int, user_id: int) -> Dict[str, Any]:
        reminder = self.reminder_model.get_by_id(reminder_id)
        if not reminder:
            return {
                'code': 1,
                'msg': '提醒不存在',
                'data': None
            }

        if reminder.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限删除此提醒',
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

    def get_repeat_types(self) -> Dict[str, Any]:
        types = [
            {'value': 'daily', 'label': '每天'},
            {'value': 'weekly', 'label': '每周'},
            {'value': 'monthly', 'label': '每月'},
            {'value': 'once', 'label': '仅一次'},
        ]
        return {
            'code': 0,
            'msg': 'success',
            'data': types
        }
