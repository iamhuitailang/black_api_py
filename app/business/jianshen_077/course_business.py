from typing import Dict, Any
from app.model.jianshen_077_model import CourseModel


class CourseBusiness:
    def __init__(self):
        self.course_model = CourseModel()

    def create_course(self, title: str, description: str = '', coach: str = '',
                      category: str = '', start_time: str = '', end_time: str = '',
                      max_capacity: int = 20, location: str = '', image: str = '',
                      status: int = 1) -> Dict[str, Any]:
        if not title:
            return {
                'code': 1,
                'msg': '课程名称不能为空',
                'data': None
            }

        if not start_time or not end_time:
            return {
                'code': 1,
                'msg': '课程时间不能为空',
                'data': None
            }

        if max_capacity <= 0:
            return {
                'code': 1,
                'msg': '课程容量必须大于0',
                'data': None
            }

        course_id = self.course_model.create(
            title, description, coach, category,
            start_time, end_time, max_capacity,
            location, image, status
        )

        if course_id > 0:
            course = self.course_model.get_by_id(course_id)
            return {
                'code': 0,
                'msg': '课程创建成功',
                'data': self.course_model.to_dict(course)
            }

        return {
            'code': 1,
            'msg': '课程创建失败',
            'data': None
        }

    def update_course(self, course_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        course = self.course_model.get_by_id(course_id)
        if not course:
            return {
                'code': 1,
                'msg': '课程不存在',
                'data': None
            }

        affected = self.course_model.update(course_id, data)
        if affected >= 0:
            updated_course = self.course_model.get_by_id(course_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.course_model.to_dict(updated_course)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_course(self, course_id: int) -> Dict[str, Any]:
        course = self.course_model.get_by_id(course_id)
        if not course:
            return {
                'code': 1,
                'msg': '课程不存在',
                'data': None
            }

        affected = self.course_model.delete(course_id)
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

    def get_course_detail(self, course_id: int) -> Dict[str, Any]:
        course = self.course_model.get_by_id(course_id)
        if not course:
            return {
                'code': 1,
                'msg': '课程不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.course_model.to_dict(course)
        }

    def get_course_list(self, page: int = 1, page_size: int = 10,
                        category: str = None, status: int = None,
                        keyword: str = None, coach: str = None) -> Dict[str, Any]:
        result = self.course_model.get_list(page, page_size, category, status, keyword, coach)
        items = [self.course_model.to_dict(item) for item in result.get('items', [])]

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

    def update_course_status(self, course_id: int, status: int) -> Dict[str, Any]:
        course = self.course_model.get_by_id(course_id)
        if not course:
            return {
                'code': 1,
                'msg': '课程不存在',
                'data': None
            }

        affected = self.course_model.update_status(course_id, status)
        if affected > 0:
            updated_course = self.course_model.get_by_id(course_id)
            return {
                'code': 0,
                'msg': '状态更新成功',
                'data': self.course_model.to_dict(updated_course)
            }

        return {
            'code': 1,
            'msg': '状态更新失败',
            'data': None
        }

    def get_categories(self) -> Dict[str, Any]:
        return {
            'code': 0,
            'msg': 'success',
            'data': CourseModel.CATEGORIES
        }
