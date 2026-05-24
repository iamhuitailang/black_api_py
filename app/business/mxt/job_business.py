from typing import Dict, Any, List, Optional
from app.model.mxt import JobModel


class JobBusiness:
    def __init__(self):
        self.model = JobModel()

    def get_jobs(self, include_hidden: bool = False) -> Dict[str, Any]:
        jobs = self.model.get_all(include_hidden=include_hidden)
        
        result = []
        for job in jobs:
            result.append({
                'id': job.get('id'),
                'name': job.get('name'),
                'icon': job.get('icon'),
                'description': job.get('description'),
                'requirements': job.get('requirements'),
                'sort_order': job.get('sort_order'),
                'is_active': job.get('is_active'),
                'is_hidden': job.get('is_hidden'),
                'created_at': job.get('created_at'),
                'updated_at': job.get('updated_at')
            })
        
        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def get_active_jobs(self) -> Dict[str, Any]:
        jobs = self.model.get_active()
        
        result = []
        for job in jobs:
            result.append({
                'id': job.get('id'),
                'name': job.get('name'),
                'icon': job.get('icon'),
                'description': job.get('description'),
                'requirements': job.get('requirements'),
                'sort_order': job.get('sort_order'),
                'created_at': job.get('created_at'),
                'updated_at': job.get('updated_at')
            })
        
        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def get_job_by_id(self, record_id: int) -> Dict[str, Any]:
        job = self.model.get_by_id(record_id)
        
        if job:
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'id': job.get('id'),
                    'name': job.get('name'),
                    'icon': job.get('icon'),
                    'description': job.get('description'),
                    'requirements': job.get('requirements'),
                    'sort_order': job.get('sort_order'),
                    'is_active': job.get('is_active'),
                    'is_hidden': job.get('is_hidden'),
                    'created_at': job.get('created_at'),
                    'updated_at': job.get('updated_at')
                }
            }
        
        return {
            'code': 1,
            'message': '职位不存在',
            'data': None
        }

    def add_job(self, name: str, icon: str = '', description: str = '', 
                requirements: str = '', sort_order: int = 0,
                is_active: int = 1, is_hidden: int = 0) -> Dict[str, Any]:
        if not name or not name.strip():
            return {
                'code': 1,
                'message': '职位名称不能为空',
                'data': None
            }
        
        try:
            new_id = self.model.create(
                name=name.strip(),
                icon=icon,
                description=description,
                requirements=requirements,
                sort_order=sort_order,
                is_active=is_active,
                is_hidden=is_hidden
            )
            return self.get_job_by_id(new_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def update_job(self, record_id: int, name: str = None, icon: str = None,
                   description: str = None, requirements: str = None,
                   sort_order: int = None, is_active: int = None,
                   is_hidden: int = None) -> Dict[str, Any]:
        existing = self.model.get_by_id(record_id)
        if not existing:
            return {
                'code': 1,
                'message': f'职位ID {record_id} 不存在',
                'data': None
            }
        
        try:
            affected = self.model.update(
                record_id=record_id,
                name=name.strip() if name else None,
                icon=icon,
                description=description,
                requirements=requirements,
                sort_order=sort_order,
                is_active=is_active,
                is_hidden=is_hidden
            )
            
            if affected > 0:
                return self.get_job_by_id(record_id)
            
            return {
                'code': 1,
                'message': '更新失败',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def delete_job(self, record_id: int) -> Dict[str, Any]:
        existing = self.model.get_by_id(record_id)
        if not existing:
            return {
                'code': 1,
                'message': f'职位ID {record_id} 不存在',
                'data': None
            }
        
        affected = self.model.delete(record_id)
        if affected > 0:
            return {
                'code': 0,
                'message': '删除成功',
                'data': None
            }
        
        return {
            'code': 1,
            'message': '删除失败',
            'data': None
        }
