from typing import Dict, Any
from app.model.ershoushu_077_model import ErshoushuReviewModel, ErshoushuTradeModel, ErshoushuUserModel


class ErshoushuReviewBusiness:
    def __init__(self):
        self.review_model = ErshoushuReviewModel()
        self.trade_model = ErshoushuTradeModel()
        self.user_model = ErshoushuUserModel()

    def create_review(self, trade_id: int, reviewer_id: int, rating: int,
                      content: str = '') -> Dict[str, Any]:
        trade = self.trade_model.get_by_id(trade_id)
        if not trade:
            return {'code': 1, 'msg': '交易不存在', 'data': None}

        if trade.get('status') != ErshoushuTradeModel.STATUS_COMPLETED:
            return {'code': 1, 'msg': '只能评价已完成的交易', 'data': None}

        if reviewer_id not in [trade.get('buyer_id'), trade.get('seller_id')]:
            return {'code': 1, 'msg': '只能评价自己参与的交易', 'data': None}

        if self.review_model.has_reviewed(trade_id, reviewer_id):
            return {'code': 1, 'msg': '已经评价过此交易', 'data': None}

        if rating < 1 or rating > 5:
            return {'code': 1, 'msg': '评分范围1-5', 'data': None}

        reviewee_id = trade.get('seller_id') if reviewer_id == trade.get('buyer_id') else trade.get('buyer_id')

        review_id = self.review_model.create(
            trade_id=trade_id,
            reviewer_id=reviewer_id,
            reviewee_id=reviewee_id,
            rating=rating,
            content=content
        )

        if review_id > 0:
            review = self.review_model.get_by_id(review_id)
            return {'code': 0, 'msg': '评价成功', 'data': self.review_model.to_dict(review)}
        return {'code': 1, 'msg': '评价失败', 'data': None}

    def get_trade_reviews(self, trade_id: int) -> Dict[str, Any]:
        reviews = self.review_model.get_by_trade(trade_id)
        items = []
        for review in reviews:
            review_data = self.review_model.to_dict(review)
            reviewer = self.user_model.get_by_id(review.get('reviewer_id'))
            if reviewer:
                review_data['reviewer'] = self.user_model.to_public_dict(reviewer)
            items.append(review_data)
        return {'code': 0, 'msg': 'success', 'data': items}

    def get_user_reviews(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.review_model.get_by_reviewee(user_id, page, page_size)
        items = []
        for review in result.get('items', []):
            review_data = self.review_model.to_dict(review)
            reviewer = self.user_model.get_by_id(review.get('reviewer_id'))
            if reviewer:
                review_data['reviewer'] = self.user_model.to_public_dict(reviewer)
            items.append(review_data)
        return {
            'code': 0, 'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_user_avg_rating(self, user_id: int) -> Dict[str, Any]:
        avg_rating = self.review_model.get_avg_rating(user_id)
        return {'code': 0, 'msg': 'success', 'data': {'avg_rating': avg_rating}}
