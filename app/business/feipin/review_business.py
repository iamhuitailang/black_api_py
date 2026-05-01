from typing import Dict, Any, List, Optional
from app.model.feipin import ReviewModel, OrderModel, UserModel


class FeipinReviewBusiness:
    def __init__(self):
        self.review_model = ReviewModel()
        self.order_model = OrderModel()
        self.user_model = UserModel()

    def create_review(self, order_id: int, user_id: int, score: int = 5,
                      content: str = '') -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {
                'code': 1,
                'msg': '订单不存在',
                'data': None
            }

        if order.get('status') != OrderModel.STATUS_COMPLETED:
            return {
                'code': 1,
                'msg': '订单尚未完成，无法评价',
                'data': None
            }

        if order.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '您不是该订单的创建者',
                'data': None
            }

        existing_review = self.review_model.get_by_order_id(order_id)
        if existing_review:
            return {
                'code': 1,
                'msg': '该订单已评价过',
                'data': None
            }

        collector_id = order.get('collector_id')
        if not collector_id:
            return {
                'code': 1,
                'msg': '该订单没有回收员',
                'data': None
            }

        review_id = self.review_model.create(
            order_id=order_id,
            user_id=user_id,
            collector_id=collector_id,
            score=score,
            content=content
        )

        if review_id > 0:
            review = self.review_model.get_by_id(review_id)
            return {
                'code': 0,
                'msg': '评价成功',
                'data': self.review_model.to_dict(review)
            }

        return {
            'code': 1,
            'msg': '评价失败',
            'data': None
        }

    def get_review_by_order_id(self, order_id: int) -> Dict[str, Any]:
        review = self.review_model.get_by_order_id(order_id)
        if not review:
            return {
                'code': 1,
                'msg': '评价不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self._enrich_review(review)
        }

    def get_review_by_id(self, review_id: int) -> Dict[str, Any]:
        review = self.review_model.get_by_id(review_id)
        if not review:
            return {
                'code': 1,
                'msg': '评价不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self._enrich_review(review)
        }

    def _enrich_review(self, review: Dict[str, Any]) -> Dict[str, Any]:
        if not review:
            return None

        review_dict = self.review_model.to_dict(review)

        user = self.user_model.get_by_id(review.get('user_id'))
        if user:
            review_dict['user'] = {
                'id': user.get('id'),
                'nickname': user.get('nickname'),
                'avatar': user.get('avatar')
            }

        collector = self.user_model.get_by_id(review.get('collector_id'))
        if collector:
            review_dict['collector'] = {
                'id': collector.get('id'),
                'nickname': collector.get('nickname'),
                'avatar': collector.get('avatar')
            }

        return review_dict

    def get_collector_reviews(self, collector_id: int, page: int = 1,
                               page_size: int = 10) -> Dict[str, Any]:
        result = self.review_model.get_by_collector_id(collector_id, page, page_size)
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

    def get_collector_rating(self, collector_id: int) -> Dict[str, Any]:
        rating = self.review_model.get_collector_rating(collector_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': rating
        }
