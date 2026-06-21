from typing import Dict, Any, List, Optional
from app.model.campus import StudentModel


class StudentBusiness:
    def __init__(self):
        self.model = StudentModel()

    def get_list(self, department: str = None, keyword: str = None) -> Dict[str, Any]:
        items = self.model.get_all(department=department, keyword=keyword)
        return {
            'code': 0,
            'message': 'success',
            'data': items
        }

    def get_by_no(self, student_no: str) -> Dict[str, Any]:
        item = self.model.get_by_student_no(student_no)
        if not item:
            return {'code': 1, 'message': '学生不存在', 'data': None}
        return {'code': 0, 'message': 'success', 'data': item}
