from typing import Dict, Any, List, Optional
from app.model.course import CourseModel, ReviewModel, CourseStatsModel


class CourseBusiness:
    def __init__(self):
        self.course_model = CourseModel()
        self.review_model = ReviewModel()
        self.stats_model = CourseStatsModel()

    def get_filter_options(self) -> Dict[str, Any]:
        semesters = self.course_model.get_semesters()
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'semesters': semesters
            }
        }

    def get_teachers(self, semester: str) -> Dict[str, Any]:
        teachers = self.course_model.get_teachers(semester)
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'teachers': teachers
            }
        }

    def get_course_names(self, semester: str, teacher: str = None) -> Dict[str, Any]:
        names = self.course_model.get_names(semester, teacher)
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'names': names
            }
        }

    def get_course_list(self, semester: str = None, keyword: str = None) -> Dict[str, Any]:
        courses = self.course_model.get_all()
        if semester:
            courses = [c for c in courses if c.get('semester') == semester]
        if keyword:
            kw = keyword.lower()
            courses = [c for c in courses if kw in c.get('name', '').lower()
                       or kw in c.get('teacher', '').lower()
                       or kw in c.get('department', '').lower()]

        result = []
        for course in courses:
            course_id = course.get('id')
            stats = self.review_model.get_avg_scores_by_course(course_id)
            result.append({
                'id': course_id,
                'name': course.get('name'),
                'teacher': course.get('teacher'),
                'semester': course.get('semester'),
                'department': course.get('department'),
                'avg_score': stats.get('overall', 0) if stats else 0,
                'review_count': stats.get('review_count', 0) if stats else 0
            })

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': result
            }
        }

    def get_course_detail(self, course_id: int) -> Dict[str, Any]:
        course = self.course_model.get_by_id(course_id)
        if not course:
            return {
                'code': 1,
                'message': 'Course not found',
                'data': None
            }

        scores = self.review_model.get_avg_scores_by_course(course_id)
        tags_freq = self.review_model.get_tags_frequency(course_id)
        reviews = self.review_model.get_by_course_id(course_id)

        result_reviews = []
        for review in reviews:
            result_reviews.append({
                'id': review.get('id'),
                'content_quality': review.get('content_quality'),
                'clarity': review.get('clarity'),
                'homework': review.get('homework'),
                'grading': review.get('grading'),
                'comment': review.get('comment'),
                'tags': review.get('tags', []),
                'upvotes': review.get('upvotes', 0),
                'hidden': bool(review.get('hidden', 0)),
                'hidden_reason': review.get('hidden_reason', ''),
                'created_at': review.get('created_at')
            })

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'course': {
                    'id': course.get('id'),
                    'name': course.get('name'),
                    'teacher': course.get('teacher'),
                    'semester': course.get('semester'),
                    'department': course.get('department')
                },
                'scores': scores or {
                    'content_quality': 0,
                    'clarity': 0,
                    'homework': 0,
                    'grading': 0,
                    'overall': 0,
                    'review_count': 0
                },
                'tags_frequency': tags_freq,
                'reviews': result_reviews
            }
        }
