from typing import Dict, Any, List, Optional
from app.model.meeting import ProjectModel


class ProjectBusiness:
    def __init__(self):
        self.model = ProjectModel()

    def get_list(self) -> Dict[str, Any]:
        items = self.model.get_all()
        return {
            'code': 0,
            'message': 'success',
            'data': items
        }

    def get_by_id(self, project_id: int) -> Dict[str, Any]:
        record = self.model.get_by_id(project_id)
        if not record:
            return {
                'code': 1,
                'message': 'Project not found',
                'data': None
            }
        return {
            'code': 0,
            'message': 'success',
            'data': record
        }

    def create(self, name: str, description: str = '') -> Dict[str, Any]:
        if not name or not name.strip():
            return {
                'code': 1,
                'message': 'Project name cannot be empty',
                'data': None
            }

        new_id = self.model.create(name.strip(), description or '')
        record = self.model.get_by_id(new_id)
        return {
            'code': 0,
            'message': 'create success',
            'data': record
        }

    def update(self, project_id: int, name: str = None, description: str = None) -> Dict[str, Any]:
        existing = self.model.get_by_id(project_id)
        if not existing:
            return {
                'code': 1,
                'message': 'Project not found',
                'data': None
            }

        if name is not None and not name.strip():
            return {
                'code': 1,
                'message': 'Project name cannot be empty',
                'data': None
            }

        affected = self.model.update(project_id, name, description)
        if affected > 0:
            record = self.model.get_by_id(project_id)
            return {
                'code': 0,
                'message': 'update success',
                'data': record
            }
        return {
            'code': 1,
            'message': 'update failed',
            'data': None
        }

    def delete(self, project_id: int) -> Dict[str, Any]:
        existing = self.model.get_by_id(project_id)
        if not existing:
            return {
                'code': 1,
                'message': 'Project not found',
                'data': None
            }

        affected = self.model.delete(project_id)
        if affected > 0:
            return {
                'code': 0,
                'message': 'delete success',
                'data': None
            }
        return {
            'code': 1,
            'message': 'delete failed',
            'data': None
        }
