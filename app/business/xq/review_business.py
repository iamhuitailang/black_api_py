from typing import Dict, Any, Optional
from app.model.xq import ReviewModel, UserModel, PostModel, ClaimModel


class XqReviewBusiness:
    def __init__(self):
        self.review_model = ReviewModel()
        self.user_model = UserModel()
        self.post_model = PostModel()
        self.claim_model = ClaimModel()

    def create_review(self, user_id: int, order_id: int, score: int, content: str = '') -> Dict[str, Any]:
        claim = self.claim_model.get_by_id(order_id)
        if not claim:
            return {
                'code': 1,
                'msg': '订单不存在',
                'data': None
            }

        if claim.get('status') != ClaimModel.STATUS_COMPLETED:
            return {
                'code': 1,
                'msg': '订单未完成，无法评价',
                'data': None
            }

        post = self.post_model.get_by_id(claim.get('post_id'))
        if not post:
            return {
                'code': 1,
                'msg': '帖子不存在',
                'data': None
            }

        existing = self.review_model.get_by_order(order_id)
        if existing:
            return {
                'code': 1,
                'msg': '该订单已评价',
                'data': None
            }

        if post.get('user_id') == user_id:
            to_user_id = claim.get('helper_id')
        elif claim.get('helper_id') == user_id:
            to_user_id = post.get('user_id')
        else:
            return {
                'code': 1,
                'msg': '没有权限评价',
                'data': None
            }

        review_id = self.review_model.create(
            order_id=order_id,
            from_user_id=user_id,
            to_user_id=to_user_id,
            post_id=post.get('id'),
            score=score,
            content=content or ''
        )

        if review_id > 0:
            if score >= 4:
                self.user_model.update_credit(to_user_id, 1)
            elif score <= 2:
                self.user_model.update_credit(to_user_id, -1)

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
            review_data = self.review_model.to_dict(review)
            from_user = self.user_model.get_by_id(review.get('from_user_id'))
            if from_user:
                review_data['from_user'] = {
                    'id': from_user.get('id'),
                    'nickname': from_user.get('nickname'),
                    'avatar': from_user.get('avatar')
                }
            items.append(review_data)

        avg_score = self.review_model.get_user_average_score(user_id)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages'),
                'avg_score': avg_score
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

        review_data = self.review_model.to_dict(review)

        from_user = self.user_model.get_by_id(review.get('from_user_id'))
        if from_user:
            review_data['from_user'] = {
                'id': from_user.get('id'),
                'nickname': from_user.get('nickname'),
                'avatar': from_user.get('avatar')
            }

        to_user = self.user_model.get_by_id(review.get('to_user_id'))
        if to_user:
            review_data['to_user'] = {
                'id': to_user.get('id'),
                'nickname': to_user.get('nickname'),
                'avatar': to_user.get('avatar')
            }

        post = self.post_model.get_by_id(review.get('post_id'))
        if post:
            review_data['post'] = self.post_model.to_dict(post)

        return {
            'code': 0,
            'msg': 'success',
            'data': review_data
        }
