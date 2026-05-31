from typing import Dict, Any, List, Optional
from app.model.fuwu_077_model import (
    ReviewModel, OrderModel, UserModel, StaffModel, ServiceModel
)


class ReviewBusiness:
    def __init__(self):
        self.review_model = ReviewModel()
        self.order_model = OrderModel()
        self.user_model = UserModel()
        self.staff_model = StaffModel()
        self.service_model = ServiceModel()

    def create_review(self, order_id: int, user_id: int, 
                      rating: int = 5, content: str = '',
                      images: str = '') -> Dict[str, Any]:
        if not order_id:
            return {
                'code': 1,
                'msg': '订单ID不能为空',
                'data': None
            }

        order = self.order_model.get_by_id(order_id)
        if not order:
            return {
                'code': 1,
                'msg': '订单不存在',
                'data': None
            }

        if order.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权评价该订单',
                'data': None
            }

        if order.get('status') != 3:
            return {
                'code': 1,
                'msg': '订单未完成，暂不能评价',
                'data': None
            }

        existing = self.review_model.get_by_order_id(order_id)
        if existing:
            return {
                'code': 1,
                'msg': '该订单已评价过',
                'data': None
            }

        if rating < 1 or rating > 5:
            return {
                'code': 1,
                'msg': '评分必须在1-5之间',
                'data': None
            }

        if not order.get('staff_id'):
            return {
                'code': 1,
                'msg': '订单未分配服务人员',
                'data': None
            }

        review_id = self.review_model.create(
            order_id=order_id,
            user_id=user_id,
            staff_id=order.get('staff_id'),
            service_id=order.get('service_id'),
            rating=rating,
            content=content,
            images=images
        )

        if review_id > 0:
            self.staff_model.update_rating(order.get('staff_id'), rating)

            review = self.review_model.get_by_id(review_id)
            return {
                'code': 0,
                'msg': '评价成功',
                'data': self._enrich_review_dict(review)
            }

        return {
            'code': 1,
            'msg': '评价失败',
            'data': None
        }

    def get_review_list(self, page: int = 1, page_size: int = 10,
                       staff_id: int = None, service_id: int = None,
                       min_rating: int = None, max_rating: int = None) -> Dict[str, Any]:
        result = self.review_model.get_all(page, page_size, staff_id, service_id, min_rating, max_rating)
        items = [self._enrich_review_dict(item) for item in result.get('items', [])]

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

    def get_user_reviews(self, user_id: int, page: int = 1,
                         page_size: int = 10) -> Dict[str, Any]:
        result = self.review_model.get_by_user_id(user_id, page, page_size)
        items = [self._enrich_review_dict(item) for item in result.get('items', [])]

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

    def get_staff_reviews(self, staff_id: int, page: int = 1,
                          page_size: int = 10) -> Dict[str, Any]:
        result = self.review_model.get_by_staff_id(staff_id, page, page_size)
        items = [self._enrich_review_dict(item) for item in result.get('items', [])]

        avg_rating = self.review_model.get_staff_average_rating(staff_id)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages'),
                'avg_rating': avg_rating
            }
        }

    def get_service_reviews(self, service_id: int, page: int = 1,
                            page_size: int = 10) -> Dict[str, Any]:
        result = self.review_model.get_by_service_id(service_id, page, page_size)
        items = [self._enrich_review_dict(item) for item in result.get('items', [])]

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

    def get_review_detail(self, review_id: int) -> Dict[str, Any]:
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
            'data': self._enrich_review_dict(review)
        }

    def delete_review(self, review_id: int) -> Dict[str, Any]:
        review = self.review_model.get_by_id(review_id)
        if not review:
            return {
                'code': 1,
                'msg': '评价不存在',
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

    def _enrich_review_dict(self, review: Dict[str, Any]) -> Dict[str, Any]:
        user = None
        staff = None
        service = None

        if review.get('user_id'):
            user = self.user_model.get_by_id(review.get('user_id'))

        if review.get('staff_id'):
            staff = self.staff_model.get_by_id(review.get('staff_id'))

        if review.get('service_id'):
            service = self.service_model.get_by_id(review.get('service_id'))

        return self.review_model.to_dict(review, user, staff, service)
