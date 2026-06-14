from typing import Dict, Any
from app.model.course import CourseModel, ReviewModel, CourseStatsModel


class RankingBusiness:
    def __init__(self):
        self.course_model = CourseModel()
        self.stats_model = CourseStatsModel()

    def get_rankings(self, semester: str, min_reviews: int = 5, limit: int = 10) -> Dict[str, Any]:
        semesters = self.course_model.get_semesters()
        if not semesters:
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'semesters': [],
                    'current_semester': semester,
                    'good': [],
                    'bad': []
                }
            }

        if not semester:
            semester = semesters[0]

        good_list = self.stats_model.get_rankings(semester, 'DESC', min_reviews, limit)
        bad_list = self.stats_model.get_rankings(semester, 'ASC', min_reviews, limit)

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'semesters': semesters,
                'current_semester': semester,
                'good': [
                    {
                        'rank': idx + 1,
                        'course_id': item.get('course_id'),
                        'name': item.get('name'),
                        'teacher': item.get('teacher'),
                        'department': item.get('department'),
                        'avg_score': round(item.get('avg_score', 0), 2),
                        'review_count': item.get('review_count', 0)
                    }
                    for idx, item in enumerate(good_list)
                ],
                'bad': [
                    {
                        'rank': idx + 1,
                        'course_id': item.get('course_id'),
                        'name': item.get('name'),
                        'teacher': item.get('teacher'),
                        'department': item.get('department'),
                        'avg_score': round(item.get('avg_score', 0), 2),
                        'review_count': item.get('review_count', 0)
                    }
                    for idx, item in enumerate(bad_list)
                ]
            }
        }
