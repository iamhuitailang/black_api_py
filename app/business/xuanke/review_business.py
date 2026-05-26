from typing import Dict, Any, List, Optional
from app.model.xuanke import ReviewModel, CourseModel, UserModel, GradeModel


class XuankeReviewBusiness:
    def __init__(self):
        self.review_model = ReviewModel()
        self.course_model = CourseModel()
        self.user_model = UserModel()
        self.grade_model = GradeModel()

    def create_review(self, user_id: int, course_id: int, rating: int,
                      content: str = '', is_anonymous: bool = False) -> Dict[str, Any]:
        course = self.course_model.get_by_id(course_id)
        if not course:
            return {
                'code': 1,
                'msg': '课程不存在',
                'data': None
            }

        grade = self.grade_model.get_by_user_and_course(user_id, course_id)
        if not grade or grade.get('score', 0) < 60:
            return {
                'code': 1,
                'msg': '只有通过该课程才能评价',
                'data': None
            }

        existing = self.review_model.get_by_user_and_course(user_id, course_id)
        if existing:
            return {
                'code': 1,
                'msg': '您已评价过该课程',
                'data': None
            }

        if rating < 1 or rating > 5:
            return {
                'code': 1,
                'msg': '评分必须在1-5之间',
                'data': None
            }

        review_id = self.review_model.create(
            user_id=user_id,
            course_id=course_id,
            course_code=course.get('course_code', ''),
            course_name=course.get('course_name', ''),
            rating=rating,
            content=content,
            is_anonymous=is_anonymous
        )

        if review_id > 0:
            review = self.review_model.get_by_id(review_id)
            return {
                'code': 0,
                'msg': '评价成功',
                'data': self.review_model.to_public_dict(review)
            }

        return {
            'code': 1,
            'msg': '评价失败',
            'data': None
        }

    def get_course_reviews(self, course_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        course = self.course_model.get_by_id(course_id)
        if not course:
            return {
                'code': 1,
                'msg': '课程不存在',
                'data': None
            }

        result = self.review_model.get_all(page, page_size, course_id=course_id, status=1)

        items = [self.review_model.to_public_dict(r) for r in result.get('items', [])]
        rating_summary = self.review_model.get_course_rating_summary(course_id)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages'),
                'rating_summary': rating_summary,
                'course': self.course_model.to_public_dict(course)
            }
        }

    def get_my_reviews(self, user_id: int) -> Dict[str, Any]:
        reviews = self.review_model.get_by_user_id(user_id)
        items = [self.review_model.to_public_dict(r, show_user=False) for r in reviews]
        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def update_review(self, review_id: int, user_id: int, rating: int = None,
                      content: str = None, is_anonymous: bool = None) -> Dict[str, Any]:
        review = self.review_model.get_by_id(review_id)
        if not review:
            return {
                'code': 1,
                'msg': '评价不存在',
                'data': None
            }

        if review.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '只能修改自己的评价',
                'data': None
            }

        data = {}
        if rating is not None:
            if rating < 1 or rating > 5:
                return {
                    'code': 1,
                    'msg': '评分必须在1-5之间',
                    'data': None
                }
            data['rating'] = rating
        if content is not None:
            data['content'] = content
        if is_anonymous is not None:
            data['is_anonymous'] = is_anonymous

        if not data:
            return {
                'code': 1,
                'msg': '没有需要更新的内容',
                'data': None
            }

        affected = self.review_model.update(review_id, data)
        if affected > 0:
            updated = self.review_model.get_by_id(review_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.review_model.to_public_dict(updated)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_review(self, review_id: int, user_id: int) -> Dict[str, Any]:
        review = self.review_model.get_by_id(review_id)
        if not review:
            return {
                'code': 1,
                'msg': '评价不存在',
                'data': None
            }

        if review.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '只能删除自己的评价',
                'data': None
            }

        affected = self.review_model.delete(review_id)
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

    def get_review_list(self, page: int = 1, page_size: int = 10,
                        course_id: int = None, status: int = None) -> Dict[str, Any]:
        result = self.review_model.get_all(page, page_size, course_id=course_id, status=status)

        items = []
        for r in result.get('items', []):
            review = self.review_model.to_public_dict(r)
            user = self.user_model.get_by_id(r.get('user_id'))
            if user:
                review['user'] = self.user_model.to_public_dict(user)
            items.append(review)

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

    def update_review_status(self, review_id: int, status: int) -> Dict[str, Any]:
        review = self.review_model.get_by_id(review_id)
        if not review:
            return {
                'code': 1,
                'msg': '评价不存在',
                'data': None
            }

        affected = self.review_model.update(review_id, {'status': status})
        if affected > 0:
            return {
                'code': 0,
                'msg': '状态更新成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '状态更新失败',
            'data': None
        }
