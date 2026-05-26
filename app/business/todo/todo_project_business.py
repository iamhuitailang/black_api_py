from typing import Dict, Any, List, Optional
from app.model.todo import TodoProjectModel, TodoTaskModel


class TodoProjectBusiness:
    def __init__(self):
        self.project_model = TodoProjectModel()
        self.task_model = TodoTaskModel()

    def _check_owner(self, project_id: int, user_id: int) -> bool:
        project = self.project_model.get_by_id(project_id)
        if not project:
            return False
        return project.get('user_id') == user_id

    def create(self, user_id: int, name: str, description: str = '',
               color: str = '#409EFF', icon: str = '', sort_order: int = 0) -> Dict[str, Any]:
        if not name or len(name) < 1:
            return {
                'code': 1,
                'msg': '项目名称不能为空',
                'data': None
            }

        project_id = self.project_model.create(user_id, name, description, color, icon, sort_order)
        if project_id > 0:
            project = self.project_model.get_by_id(project_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.project_model.to_dict(project)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update(self, project_id: int, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        if not self._check_owner(project_id, user_id):
            return {
                'code': 1,
                'msg': '项目不存在或无权限操作',
                'data': None
            }

        affected = self.project_model.update(project_id, data)
        if affected >= 0:
            updated_project = self.project_model.get_by_id(project_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.project_model.to_dict(updated_project)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete(self, project_id: int, user_id: int) -> Dict[str, Any]:
        if not self._check_owner(project_id, user_id):
            return {
                'code': 1,
                'msg': '项目不存在或无权限操作',
                'data': None
            }

        self.task_model.delete_by_project_id(project_id)
        affected = self.project_model.delete(project_id)
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

    def get_by_id(self, project_id: int, user_id: int) -> Dict[str, Any]:
        project = self.project_model.get_by_id(project_id)
        if not project or project.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '项目不存在或无权限查看',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.project_model.to_dict(project)
        }

    def get_list(self, user_id: int, page: int = 1, page_size: int = 10,
                 status: int = None, keyword: str = None) -> Dict[str, Any]:
        result = self.project_model.get_list(user_id, page, page_size, status, keyword)
        items = [self.project_model.to_dict(item) for item in result.get('items', [])]

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

    def get_all(self, user_id: int, status: int = None) -> Dict[str, Any]:
        projects = self.project_model.get_by_user_id(user_id, status)
        items = [self.project_model.to_dict(p) for p in projects]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_progress(self, project_id: int, user_id: int) -> Dict[str, Any]:
        if not self._check_owner(project_id, user_id):
            return {
                'code': 1,
                'msg': '项目不存在或无权限查看',
                'data': None
            }

        progress = self.project_model.get_progress(project_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': progress
        }

    def archive(self, project_id: int, user_id: int) -> Dict[str, Any]:
        return self.update(project_id, user_id, {'status': TodoProjectModel.STATUS_ARCHIVED})

    def unarchive(self, project_id: int, user_id: int) -> Dict[str, Any]:
        return self.update(project_id, user_id, {'status': TodoProjectModel.STATUS_ACTIVE})
