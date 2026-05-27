from typing import Dict, Any, List
from app.model.tousu_model import DepartmentModel, LogModel


class TousuDepartmentBusiness:
    def __init__(self):
        self.department_model = DepartmentModel()
        self.log_model = LogModel()

    def create_department(self, name: str, code: str, description: str = '',
                          head_user_id: int = 0, sort_order: int = 0) -> Dict[str, Any]:
        if not name or not code:
            return {
                'code': 1,
                'msg': '名称和编码不能为空',
                'data': None
            }

        existing = self.department_model.get_by_code(code)
        if existing:
            return {
                'code': 1,
                'msg': '部门编码已存在',
                'data': None
            }

        department_id = self.department_model.create(name, code, description, head_user_id, sort_order)
        if department_id > 0:
            self.log_model.create(
                user_id=0,
                action=LogModel.TYPE_CREATE,
                target_type='department',
                target_id=department_id,
                description=f'创建部门: {name}'
            )
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.department_model.to_dict(self.department_model.get_by_id(department_id))
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_department(self, department_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        department = self.department_model.get_by_id(department_id)
        if not department:
            return {
                'code': 1,
                'msg': '部门不存在',
                'data': None
            }

        affected = self.department_model.update(department_id, data)
        if affected >= 0:
            self.log_model.create(
                user_id=0,
                action=LogModel.TYPE_UPDATE,
                target_type='department',
                target_id=department_id,
                description='更新部门信息'
            )
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.department_model.to_dict(self.department_model.get_by_id(department_id))
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_department(self, department_id: int) -> Dict[str, Any]:
        department = self.department_model.get_by_id(department_id)
        if not department:
            return {
                'code': 1,
                'msg': '部门不存在',
                'data': None
            }

        affected = self.department_model.delete(department_id)
        if affected > 0:
            self.log_model.create(
                user_id=0,
                action=LogModel.TYPE_DELETE,
                target_type='department',
                target_id=department_id,
                description=f'删除部门: {department.get("name", "")}'
            )
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

    def get_department(self, department_id: int) -> Dict[str, Any]:
        department = self.department_model.get_by_id(department_id)
        if not department:
            return {
                'code': 1,
                'msg': '部门不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.department_model.to_dict(department)
        }

    def get_all_departments(self, status: int = None, keyword: str = None) -> Dict[str, Any]:
        items = self.department_model.get_all(status, keyword)
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': [self.department_model.to_dict(item) for item in items]
            }
        }