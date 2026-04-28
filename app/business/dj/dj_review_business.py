from typing import Dict, Any, List, Optional
from app.model.dj import ReviewModel, MarketModel, BoothModel


class DjReviewBusiness:
    def __init__(self):
        self.review_model = ReviewModel()
        self.market_model = MarketModel()
        self.booth_model = BoothModel()

    def create_review(self, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        market_id = data.get('market_id')
        booth_id = data.get('booth_id')

        if not market_id and not booth_id:
            return {
                'code': 1,
                'msg': '请选择集市或摊位',
                'data': None
            }

        if data.get('rating') is None or data.get('rating') < 1 or data.get('rating') > 5:
            return {
                'code': 1,
                'msg': '评分必须在1-5之间',
                'data': None
            }

        if market_id:
            market = self.market_model.get_by_id(market_id)
            if not market:
                return {
                    'code': 1,
                    'msg': '集市不存在',
                    'data': None
                }

        if booth_id:
            booth = self.booth_model.get_by_id(booth_id)
            if not booth:
                return {
                    'code': 1,
                    'msg': '摊位不存在',
                    'data': None
                }

        review_data = {
            'user_id': user_id,
            'market_id': market_id,
            'booth_id': booth_id,
            'item_name': data.get('item_name'),
            'rating': data.get('rating'),
            'content': data.get('content'),
            'images': data.get('images'),
            'status': 1
        }

        review_id = self.review_model.create(review_data)
        if review_id > 0:
            if market_id:
                self.market_model.update_rating(market_id, data.get('rating'))
            if booth_id:
                self.booth_model.update_rating(booth_id, data.get('rating'))

            return {
                'code': 0,
                'msg': '评价成功',
                'data': {'id': review_id}
            }

        return {
            'code': 1,
            'msg': '评价失败',
            'data': None
        }

    def get_review_detail(self, review_id: int) -> Dict[str, Any]:
        review = self.review_model.get_by_id(review_id)
        if not review:
            return {
                'code': 1,
                'msg': '评价不存在',
                'data': None
            }

        market = self.market_model.get_by_id(review.get('market_id')) if review.get('market_id') else None
        booth = self.booth_model.get_by_id(review.get('booth_id')) if review.get('booth_id') else None

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'id': review.get('id'),
                'user_id': review.get('user_id'),
                'market_id': review.get('market_id'),
                'market_name': market.get('name') if market else None,
                'booth_id': review.get('booth_id'),
                'vendor_name': booth.get('vendor_name') if booth else None,
                'item_name': review.get('item_name'),
                'rating': review.get('rating'),
                'content': review.get('content'),
                'images': review.get('images'),
                'reply_content': review.get('reply_content'),
                'reply_images': review.get('reply_images'),
                'is_replied': review.get('is_replied'),
                'status': review.get('status'),
                'created_at': review.get('created_at')
            }
        }

    def get_market_reviews(self, market_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        market = self.market_model.get_by_id(market_id)
        if not market:
            return {
                'code': 1,
                'msg': '集市不存在',
                'data': None
            }

        result = self.review_model.paginate(page, page_size, {'market_id': market_id, 'status': 1})

        reviews = []
        for item in result.get('items', []):
            reviews.append({
                'id': item.get('id'),
                'user_id': item.get('user_id'),
                'rating': item.get('rating'),
                'content': item.get('content'),
                'images': item.get('images'),
                'reply_content': item.get('reply_content'),
                'is_replied': item.get('is_replied'),
                'created_at': item.get('created_at')
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': reviews,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages'),
                'avg_rating': market.get('rating'),
                'rating_count': market.get('rating_count')
            }
        }

    def get_booth_reviews(self, booth_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        booth = self.booth_model.get_by_id(booth_id)
        if not booth:
            return {
                'code': 1,
                'msg': '摊位不存在',
                'data': None
            }

        result = self.review_model.paginate(page, page_size, {'booth_id': booth_id, 'status': 1})

        reviews = []
        for item in result.get('items', []):
            reviews.append({
                'id': item.get('id'),
                'user_id': item.get('user_id'),
                'item_name': item.get('item_name'),
                'rating': item.get('rating'),
                'content': item.get('content'),
                'images': item.get('images'),
                'reply_content': item.get('reply_content'),
                'is_replied': item.get('is_replied'),
                'created_at': item.get('created_at')
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': reviews,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages'),
                'avg_rating': booth.get('rating'),
                'rating_count': booth.get('rating_count')
            }
        }

    def get_user_reviews(self, user_id: int) -> Dict[str, Any]:
        reviews = self.review_model.get_by_user_id(user_id)

        result = []
        for review in reviews:
            market = self.market_model.get_by_id(review.get('market_id')) if review.get('market_id') else None
            booth = self.booth_model.get_by_id(review.get('booth_id')) if review.get('booth_id') else None

            result.append({
                'id': review.get('id'),
                'market_id': review.get('market_id'),
                'market_name': market.get('name') if market else None,
                'booth_id': review.get('booth_id'),
                'vendor_name': booth.get('vendor_name') if booth else None,
                'item_name': review.get('item_name'),
                'rating': review.get('rating'),
                'content': review.get('content'),
                'images': review.get('images'),
                'status': review.get('status'),
                'created_at': review.get('created_at')
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def reply_review(self, review_id: int, reply_content: str, reply_images: str = None) -> Dict[str, Any]:
        review = self.review_model.get_by_id(review_id)
        if not review:
            return {
                'code': 1,
                'msg': '评价不存在',
                'data': None
            }

        affected = self.review_model.reply(review_id, reply_content, reply_images)
        if affected > 0:
            return {
                'code': 0,
                'msg': '回复成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '回复失败',
            'data': None
        }

    def update_status(self, review_id: int, status: int) -> Dict[str, Any]:
        review = self.review_model.get_by_id(review_id)
        if not review:
            return {
                'code': 1,
                'msg': '评价不存在',
                'data': None
            }

        affected = self.review_model.update_status(review_id, status)
        if affected > 0:
            return {
                'code': 0,
                'msg': '更新成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_review(self, review_id: int, user_id: int = None) -> Dict[str, Any]:
        review = self.review_model.get_by_id(review_id)
        if not review:
            return {
                'code': 1,
                'msg': '评价不存在',
                'data': None
            }

        if user_id is not None and review.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限删除此评价',
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

    def get_all_reviews(self, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status

        result = self.review_model.paginate(page, page_size, conditions)

        reviews = []
        for item in result.get('items', []):
            market = self.market_model.get_by_id(item.get('market_id')) if item.get('market_id') else None
            booth = self.booth_model.get_by_id(item.get('booth_id')) if item.get('booth_id') else None

            reviews.append({
                'id': item.get('id'),
                'user_id': item.get('user_id'),
                'market_id': item.get('market_id'),
                'market_name': market.get('name') if market else None,
                'booth_id': item.get('booth_id'),
                'vendor_name': booth.get('vendor_name') if booth else None,
                'rating': item.get('rating'),
                'content': item.get('content'),
                'images': item.get('images'),
                'status': item.get('status'),
                'is_replied': item.get('is_replied'),
                'created_at': item.get('created_at')
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': reviews,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_statistics(self) -> Dict[str, Any]:
        total = self.review_model.count()
        active = self.review_model.count({'status': 1})
        replied = self.review_model.count({'is_replied': 1})

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_reviews': total,
                'active_reviews': active,
                'replied_reviews': replied
            }
        }
