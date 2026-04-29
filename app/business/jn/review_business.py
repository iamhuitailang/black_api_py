from typing import Dict, Any, List, Optional
from app.model.jn import ReviewModel, ExchangeModel, UserModel


class JnReviewBusiness:
    def __init__(self):
        self.review_model = ReviewModel()
        self.exchange_model = ExchangeModel()
        self.user_model = UserModel()

    def create_review(self, user_id: int, exchange_id: int,
                       score: int = 5, content: str = '') -> Dict[str, Any]:
        exchange = self.exchange_model.get_by_id(exchange_id)
        if not exchange:
            return {
                'code': 1,
                'msg': '交换记录不存在',
                'data': None
            }

        if exchange.get('status') != ExchangeModel.STATUS_COMPLETED:
            return {
                'code': 1,
                'msg': '只能对已完成的交换进行评价',
                'data': None
            }

        if exchange.get('from_user') != user_id and exchange.get('to_user') != user_id:
            return {
                'code': 1,
                'msg': '只能评价自己参与的交换',
                'data': None
            }

        if self.review_model.check_exists(exchange_id, user_id):
            return {
                'code': 1,
                'msg': '您已评价过此交换',
                'data': None
            }

        to_user = exchange.get('to_user') if exchange.get('from_user') == user_id else exchange.get('from_user')

        review_id = self.review_model.create(
            exchange_id=exchange_id,
            from_user=user_id,
            to_user=to_user,
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

    def get_user_reviews(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.review_model.get_by_to_user(user_id, page, page_size)
        
        items = []
        for review in result.get('items', []):
            item = self.review_model.to_dict(review)
            from_user = self.user_model.get_by_id(review.get('from_user'))
            item['from_user_info'] = self.user_model.to_public_dict(from_user) if from_user else None
            items.append(item)

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
        avg_score = self.review_model.get_user_avg_score(user_id)
        review_count = self.review_model.get_user_review_count(user_id)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'user_id': user_id,
                'avg_score': avg_score,
                'review_count': review_count
            }
        }

    def get_exchange_reviews(self, exchange_id: int) -> Dict[str, Any]:
        reviews = self.review_model.get_by_exchange(exchange_id)
        
        items = []
        for review in reviews:
            item = self.review_model.to_dict(review)
            from_user = self.user_model.get_by_id(review.get('from_user'))
            item['from_user_info'] = self.user_model.to_public_dict(from_user) if from_user else None
            items.append(item)

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_all_reviews(self, page: int = 1, page_size: int = 10,
                        to_user: int = None, keyword: str = None) -> Dict[str, Any]:
        result = self.review_model.get_all(page, page_size, to_user, keyword)
        
        items = []
        for review in result.get('items', []):
            item = self.review_model.to_dict(review)
            from_user = self.user_model.get_by_id(review.get('from_user'))
            to_user_info = self.user_model.get_by_id(review.get('to_user'))
            item['from_user_info'] = self.user_model.to_public_dict(from_user) if from_user else None
            item['to_user_info'] = self.user_model.to_public_dict(to_user_info) if to_user_info else None
            items.append(item)

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
