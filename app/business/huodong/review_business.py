from typing import Dict, Any
from app.model.huodong import ReviewModel, ActivityModel, HuodongUserModel
from app.model.huodong.points import PointsModel


class ReviewBusiness:
    def __init__(self):
        self.review_model = ReviewModel()
        self.activity_model = ActivityModel()
        self.user_model = HuodongUserModel()
        self.points_model = PointsModel()

    def create_review(self, user_id: int, activity_id: int, rating: int = 5,
                       content: str = '') -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {'code': 1, 'msg': '活动不存在', 'data': None}
        if not content or len(content.strip()) < 2:
            return {'code': 1, 'msg': '评价内容至少2个字符', 'data': None}
        review_id = self.review_model.create(activity_id, user_id, rating, content.strip())
        if review_id > 0:
            self.points_model.add(user_id, 3, PointsModel.TYPE_REVIEW, activity_id, '活动评价+3积分')
            self.user_model.update_points(user_id, 3)
            review = self.review_model.get_by_id(review_id)
            return {'code': 0, 'msg': '评价成功', 'data': self.review_model.to_dict(review)}
        return {'code': 1, 'msg': '评价失败', 'data': None}

    def get_reviews_by_activity(self, activity_id: int, page: int = 1,
                                 page_size: int = 20) -> Dict[str, Any]:
        result = self.review_model.get_by_activity(activity_id, page, page_size)
        items = []
        for review in result.get('items', []):
            review_data = self.review_model.to_dict(review)
            user = self.user_model.get_by_id(review.get('user_id'))
            if user:
                review_data['user'] = self.user_model.to_public_dict(user)
            items.append(review_data)
        avg_rating = self.review_model.get_avg_rating(activity_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'avg_rating': avg_rating,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_my_reviews(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.review_model.get_by_user(user_id, page, page_size)
        items = []
        for review in result.get('items', []):
            review_data = self.review_model.to_dict(review)
            activity = self.activity_model.get_by_id(review.get('activity_id'))
            if activity:
                review_data['activity'] = self.activity_model.to_dict(activity)
            items.append(review_data)
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

    def delete_review(self, user_id: int, review_id: int) -> Dict[str, Any]:
        review = self.review_model.get_by_id(review_id)
        if not review:
            return {'code': 1, 'msg': '评价不存在', 'data': None}
        if review.get('user_id') != user_id:
            return {'code': 1, 'msg': '只能删除自己的评价', 'data': None}
        affected = self.review_model.delete(review_id)
        if affected > 0:
            return {'code': 0, 'msg': '删除成功', 'data': None}
        return {'code': 1, 'msg': '删除失败', 'data': None}
