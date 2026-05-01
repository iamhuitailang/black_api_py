from typing import Dict, Any, List, Optional
from app.model.yeyou import ReviewModel, ActivityModel, RegistrationModel, UserModel


class ReviewBusiness:
    def __init__(self):
        self.review_model = ReviewModel()
        self.activity_model = ActivityModel()
        self.registration_model = RegistrationModel()
        self.user_model = UserModel()

    def create_review(self, activity_id: int, reviewer_id: int, target_user_id: int,
                      rating: int = 5, content: str = '') -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {
                'code': 1,
                'msg': '活动不存在',
                'data': None
            }

        if activity.get('status') != ActivityModel.STATUS_FINISHED:
            return {
                'code': 1,
                'msg': '只有已结束的活动才能评价',
                'data': None
            }

        reviewer_reg = self.registration_model.get_by_activity_and_user(activity_id, reviewer_id)
        if not reviewer_reg or reviewer_reg.get('status') != RegistrationModel.STATUS_CHECKED_IN:
            return {
                'code': 1,
                'msg': '只有参与并签到的用户才能评价',
                'data': None
            }

        target_reg = self.registration_model.get_by_activity_and_user(activity_id, target_user_id)
        if not target_reg:
            return {
                'code': 1,
                'msg': '被评价用户未参与此活动',
                'data': None
            }

        if reviewer_id == target_user_id:
            return {
                'code': 1,
                'msg': '不能评价自己',
                'data': None
            }

        existing = self.review_model.get_by_activity_and_reviewer(activity_id, reviewer_id)
        for review in existing:
            if review.get('target_user_id') == target_user_id:
                return {
                    'code': 1,
                    'msg': '已评价过该用户',
                    'data': None
                }

        review_id = self.review_model.create(activity_id, reviewer_id, target_user_id, rating, content)
        if review_id > 0:
            return {
                'code': 0,
                'msg': '评价成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '评价失败',
            'data': None
        }

    def get_user_reviews(self, target_user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.review_model.get_by_target_user(target_user_id, page, page_size)

        items = []
        for review in result.get('items', []):
            review_dict = self.review_model.to_public_dict(review)
            reviewer = self.user_model.get_by_id(review.get('reviewer_id'))
            if reviewer:
                review_dict['reviewer'] = {
                    'id': reviewer.get('id'),
                    'nickname': reviewer.get('nickname'),
                    'avatar': reviewer.get('avatar')
                }
            items.append(review_dict)

        avg_rating = self.review_model.get_user_average_rating(target_user_id)

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

    def get_activity_reviews(self, activity_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.review_model.get_by_activity(activity_id, page, page_size)

        items = []
        for review in result.get('items', []):
            review_dict = self.review_model.to_public_dict(review)
            reviewer = self.user_model.get_by_id(review.get('reviewer_id'))
            if reviewer:
                review_dict['reviewer'] = {
                    'id': reviewer.get('id'),
                    'nickname': reviewer.get('nickname'),
                    'avatar': reviewer.get('avatar')
                }
            target = self.user_model.get_by_id(review.get('target_user_id'))
            if target:
                review_dict['target_user'] = {
                    'id': target.get('id'),
                    'nickname': target.get('nickname'),
                    'avatar': target.get('avatar')
                }
            items.append(review_dict)

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

    def get_my_pending_reviews(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        from datetime import datetime, timedelta

        registrations = self.registration_model.get_by_user(
            user_id, page=1, page_size=100, status=RegistrationModel.STATUS_CHECKED_IN
        )

        pending_activities = []
        for reg in registrations.get('items', []):
            activity = self.activity_model.get_by_id(reg.get('activity_id'))
            if activity and activity.get('status') == ActivityModel.STATUS_FINISHED:
                existing_reviews = self.review_model.get_by_activity_and_reviewer(
                    activity.get('id'), user_id
                )
                reviewed_user_ids = [r.get('target_user_id') for r in existing_reviews]

                all_registrations = self.registration_model.get_by_activity(
                    activity.get('id'), page=1, page_size=100
                )

                pending_targets = []
                for target_reg in all_registrations.get('items', []):
                    target_user_id = target_reg.get('user_id')
                    if target_user_id != user_id and target_user_id not in reviewed_user_ids:
                        target_user = self.user_model.get_by_id(target_user_id)
                        if target_user:
                            pending_targets.append({
                                'user_id': target_user_id,
                                'nickname': target_user.get('nickname'),
                                'avatar': target_user.get('avatar'),
                                'level': target_user.get('level')
                            })

                if pending_targets:
                    activity_dict = self.activity_model.to_public_dict(activity)
                    activity_dict['pending_targets'] = pending_targets
                    activity_dict['reviewed_count'] = len(reviewed_user_ids)
                    activity_dict['total_participants'] = len(all_registrations.get('items', []))
                    pending_activities.append(activity_dict)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': pending_activities,
                'total': len(pending_activities)
            }
        }
