from typing import Dict, Any
from app.model.chongwu09 import ReviewModel


class ReviewBusiness:
    def __init__(self):
        self.review_model = ReviewModel()

    def create_review(self, user_id: int, service_id: int, order_id: int,
                      rating: int, content: str = '') -> Dict[str, Any]:
        if rating < 1 or rating > 5:
            return {'code': 1, 'msg': '评分范围1-5', 'data': None}
        existing = self.review_model.get_by_order(order_id)
        if existing:
            return {'code': 1, 'msg': '该订单已评价', 'data': None}
        review_id = self.review_model.create(user_id, service_id, order_id, rating, content)
        if review_id > 0:
            review = self.review_model.get_by_id(review_id)
            return {'code': 0, 'msg': '评价成功', 'data': self.review_model.to_dict(review)}
        return {'code': 1, 'msg': '评价失败', 'data': None}

    def get_service_reviews(self, service_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.review_model.get_by_service(service_id, page, page_size)
        items = [self._enrich_review(item) for item in result.get('items', [])]
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

    def get_my_reviews(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.review_model.get_by_user(user_id, page, page_size)
        items = [self._enrich_review(item) for item in result.get('items', [])]
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

    def delete_review(self, review_id: int) -> Dict[str, Any]:
        review = self.review_model.get_by_id(review_id)
        if not review:
            return {'code': 1, 'msg': '评价不存在', 'data': None}
        affected = self.review_model.delete(review_id)
        if affected > 0:
            return {'code': 0, 'msg': '删除成功', 'data': None}
        return {'code': 1, 'msg': '删除失败', 'data': None}

    def _enrich_review(self, review: Dict[str, Any]) -> Dict[str, Any]:
        result = self.review_model.to_dict(review)
        from app.model.chongwu09 import UserModel
        user_model = UserModel()
        user = user_model.get_by_id(review.get('user_id'))
        if user:
            result['user'] = user_model.to_public_dict(user)
        return result
