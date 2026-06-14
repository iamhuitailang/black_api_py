from typing import Dict, Any, List
from app.model.course import CourseModel, ReviewModel, CourseStatsModel


class ReviewBusiness:
    def __init__(self):
        self.course_model = CourseModel()
        self.review_model = ReviewModel()
        self.stats_model = CourseStatsModel()

    def submit_review(self, semester: str, course_name: str, teacher: str,
                      content_quality: int, clarity: int, homework: int,
                      grading: int, comment: str, tags: List[str],
                      client_id: str = '', user_id: int = 0) -> Dict[str, Any]:
        for score in [content_quality, clarity, homework, grading]:
            if score < 1 or score > 5:
                return {
                    'code': 1,
                    'message': '评分必须在1-5之间',
                    'data': None
                }

        if len(comment) > 300:
            return {
                'code': 1,
                'message': '评论不能超过300字',
                'data': None
            }

        valid_tags = {"干货多", "PPT念稿", "作业多", "给分好", "点名频繁"}
        for tag in tags:
            if tag not in valid_tags:
                return {
                    'code': 1,
                    'message': f'无效标签: {tag}',
                    'data': None
                }

        course = self.course_model.find_course(course_name, teacher, semester)
        if not course:
            return {
                'code': 1,
                'message': '未找到对应的课程',
                'data': None
            }

        course_id = course.get('id')

        if self.review_model.has_reviewed(course_id, client_id, user_id):
            if user_id and user_id > 0:
                message = '您已经对这门课程发表过评价了，每门课只能评价一次'
            else:
                message = '您已经对这门课程发表过评价了，每门课只能评价一次'
            return {
                'code': 1,
                'message': message,
                'data': None
            }

        try:
            review_id = self.review_model.create(
                course_id=course_id,
                content_quality=content_quality,
                clarity=clarity,
                homework=homework,
                grading=grading,
                comment=comment,
                tags=tags,
                client_id=client_id,
                user_id=user_id
            )

            scores = self.review_model.get_avg_scores_by_course(course_id)
            if scores:
                self.stats_model.upsert(
                    course_id=course_id,
                    avg_score=scores.get('overall', 0),
                    review_count=scores.get('review_count', 0)
                )

            return {
                'code': 0,
                'message': '评价提交成功',
                'data': {
                    'review_id': review_id,
                    'course_id': course_id
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def upvote_review(self, review_id: int, client_id: str) -> Dict[str, Any]:
        review = self.review_model.get_by_id(review_id)
        if not review:
            return {
                'code': 1,
                'message': '评价不存在',
                'data': None
            }

        if self.review_model.has_voted(review_id, client_id):
            return {
                'code': 1,
                'message': '您已经点过赞了',
                'data': None
            }

        try:
            self.review_model.add_vote(review_id, client_id)
            new_upvotes = self.review_model.increment_upvote(review_id)
            return {
                'code': 0,
                'message': '点赞成功',
                'data': {
                    'review_id': review_id,
                    'upvotes': new_upvotes
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }
