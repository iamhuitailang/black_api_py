from typing import Dict, Any, List, Optional
from app.model.daka import TaskModel


class DakaTaskBusiness:
    def __init__(self):
        self.task_model = TaskModel()

    def get_user_tasks(self, user_id: int) -> Dict[str, Any]:
        tasks = self.task_model.get_user_tasks(user_id)
        result = [self.task_model.to_dict(task) for task in tasks]
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_user_tasks_by_type(self, user_id: int, task_type: int) -> Dict[str, Any]:
        tasks = self.task_model.get_tasks_by_type(user_id, task_type)
        result = [self.task_model.to_dict(task) for task in tasks]
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_task_detail(self, task_id: int, user_id: int) -> Dict[str, Any]:
        task = self.task_model.get_by_id(task_id)
        if not task:
            return {
                'code': 1,
                'msg': '任务不存在',
                'data': None
            }

        if task.get('is_system') != 1 and task.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限访问此任务',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.task_model.to_dict(task)
        }

    def create_custom_task(self, user_id: int, name: str, task_type: int = 4,
                           icon: str = '', target_value: int = 1, unit: str = '次',
                           remind_time: str = '', description: str = '',
                           sort_order: int = 0) -> Dict[str, Any]:
        if not name:
            return {
                'code': 1,
                'msg': '任务名称不能为空',
                'data': None
            }

        task_id = self.task_model.create(
            user_id=user_id,
            name=name,
            type=task_type,
            icon=icon,
            target_value=target_value,
            unit=unit,
            remind_time=remind_time,
            description=description,
            is_system=0,
            sort_order=sort_order
        )

        if task_id > 0:
            task = self.task_model.get_by_id(task_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.task_model.to_dict(task)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_task(self, task_id: int, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        task = self.task_model.get_by_id(task_id)
        if not task:
            return {
                'code': 1,
                'msg': '任务不存在',
                'data': None
            }

        if task.get('is_system') == 1:
            return {
                'code': 1,
                'msg': '系统预设任务不能修改',
                'data': None
            }

        if task.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限修改此任务',
                'data': None
            }

        affected = self.task_model.update(task_id, data)
        if affected >= 0:
            updated_task = self.task_model.get_by_id(task_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.task_model.to_dict(updated_task)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_task(self, task_id: int, user_id: int) -> Dict[str, Any]:
        task = self.task_model.get_by_id(task_id)
        if not task:
            return {
                'code': 1,
                'msg': '任务不存在',
                'data': None
            }

        if task.get('is_system') == 1:
            return {
                'code': 1,
                'msg': '系统预设任务不能删除',
                'data': None
            }

        if task.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限删除此任务',
                'data': None
            }

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

    def get_task_types(self) -> Dict[str, Any]:
        types = [
            {'value': 1, 'label': '每日必做', 'icon': '☀️', 'description': '每天必须完成的任务'},
            {'value': 2, 'label': '每周目标', 'icon': '🏃', 'description': '每周完成X次'},
            {'value': 3, 'label': '习惯养成', 'icon': '🧘', 'description': '连续完成挑战'},
            {'value': 4, 'label': '自定义', 'icon': '✏️', 'description': '用户自由创建'},
        ]
        return {
            'code': 0,
            'msg': 'success',
            'data': types
        }
