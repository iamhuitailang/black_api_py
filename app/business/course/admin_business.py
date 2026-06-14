from typing import Dict, Any
from app.model.course import ReviewModel


class AdminBusiness:
    def __init__(self):
        self.review_model = ReviewModel()

    def get_all_reviews(self) -> Dict[str, Any]:
        reviews = self.review_model.get_all(include_hidden=True)
        result = []
        for review in reviews:
            result.append({
                'id': review.get('id'),
                'course_id': review.get('course_id'),
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
                'items': result
            }
        }

    def hide_review(self, review_id: int, reason: str) -> Dict[str, Any]:
        if not reason or not reason.strip():
            return {
                'code': 1,
                'message': '必须填写隐藏理由',
                'data': None
            }

        review = self.review_model.get_by_id(review_id)
        if not review:
            return {
                'code': 1,
                'message': '评价不存在',
                'data': None
            }

        affected = self.review_model.hide_review(review_id, reason.strip())
        if affected > 0:
            return {
                'code': 0,
                'message': '隐藏成功',
                'data': None
            }

        return {
            'code': 1,
            'message': '隐藏失败',
            'data': None
        }

    def restore_review(self, review_id: int) -> Dict[str, Any]:
        review = self.review_model.get_by_id(review_id)
        if not review:
            return {
                'code': 1,
                'message': '评价不存在',
                'data': None
            }

        affected = self.review_model.restore_review(review_id)
        if affected > 0:
            return {
                'code': 0,
                'message': '恢复成功',
                'data': None
            }

        return {
            'code': 1,
            'message': '恢复失败',
            'data': None
        }
