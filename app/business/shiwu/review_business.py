from typing import Dict, Any
from app.model.shiwu_model import ReviewModel


class ReviewBusiness:
    def __init__(self):
        self.review_model = ReviewModel()

    def get_reviews_by_post(self, post_id: int, page: int = 1,
                           page_size: int = 10) -> Dict[str, Any]:
        result = self.review_model.get_by_post(post_id, page, page_size)
        items = [self.review_model.to_dict(item) for item in result.get('items', [])]

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

    def get_reviews_by_user(self, user_id: int, page: int = 1,
                           page_size: int = 10, related_type: str = None) -> Dict[str, Any]:
        result = self.review_model.get_by_reviewed(user_id, page, page_size, related_type)
        items = [self.review_model.to_dict(item) for item in result.get('items', [])]

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

    def get_my_reviews(self, reviewer_id: int, page: int = 1,
                      page_size: int = 10, related_type: str = None) -> Dict[str, Any]:
        result = self.review_model.get_by_reviewer(reviewer_id, page, page_size, related_type)
        items = [self.review_model.to_dict(item) for item in result.get('items', [])]

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

    def get_user_rating(self, user_id: int) -> Dict[str, Any]:
        avg_rating = self.review_model.get_average_rating(user_id)
        count = self.review_model.get_rating_count(user_id)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'user_id': user_id,
                'avg_rating': avg_rating,
                'review_count': count
            }
        }

    def delete_review(self, reviewer_id: int, review_id: int) -> Dict[str, Any]:
        review = self.review_model.get_by_id(review_id)
        if not review:
            return {
                'code': 1,
                'msg': '评价不存在',
                'data': None
            }

        if review.get('reviewer_id') != reviewer_id:
            return {
                'code': 1,
                'msg': '无权限删除',
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
