from typing import Dict, Any, Optional
from app.model.dd import ReviewModel, TaskModel, UserModel


class DdReviewBusiness:
    def __init__(self):
        self.review_model = ReviewModel()
        self.task_model = TaskModel()
        self.user_model = UserModel()

    def mark_complete(self, user_id: int, task_id: int) -> Dict[str, Any]:
        task = self.task_model.get_by_id(task_id)
        if not task:
            return {
                'code': 1,
                'msg': '任务不存在',
                'data': None
            }
        
        if task.get('receiver_id') != user_id:
            return {
                'code': 1,
                'msg': '只有接单者可以标记任务完成',
                'data': None
            }
        
        status = task.get('status')
        if status not in [TaskModel.STATUS_ACCEPTED, TaskModel.STATUS_IN_PROGRESS]:
            return {
                'code': 1,
                'msg': '该任务状态不能标记完成',
                'data': None
            }
        
        affected = self.task_model.update_status(task_id, TaskModel.STATUS_COMPLETED)
        if affected > 0:
            updated_task = self.task_model.get_by_id(task_id)
            return {
                'code': 0,
                'msg': '任务已标记完成，等待发布者确认',
                'data': self.task_model.to_dict(updated_task)
            }
        
        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def confirm_complete(self, user_id: int, task_id: int) -> Dict[str, Any]:
        task = self.task_model.get_by_id(task_id)
        if not task:
            return {
                'code': 1,
                'msg': '任务不存在',
                'data': None
            }
        
        if task.get('publisher_id') != user_id:
            return {
                'code': 1,
                'msg': '只有发布者可以确认任务完成',
                'data': None
            }
        
        if task.get('status') != TaskModel.STATUS_COMPLETED:
            return {
                'code': 1,
                'msg': '该任务状态不能确认完成',
                'data': None
            }
        
        return {
            'code': 0,
            'msg': '任务已确认完成，现在可以进行评价',
            'data': self.task_model.to_dict(task)
        }

    def submit_review(self, user_id: int, task_id: int, rating: int, 
                      content: str = '') -> Dict[str, Any]:
        task = self.task_model.get_by_id(task_id)
        if not task:
            return {
                'code': 1,
                'msg': '任务不存在',
                'data': None
            }
        
        publisher_id = task.get('publisher_id')
        receiver_id = task.get('receiver_id')
        
        if user_id != publisher_id and user_id != receiver_id:
            return {
                'code': 1,
                'msg': '您不是该任务的参与者，无法评价',
                'data': None
            }
        
        if task.get('status') != TaskModel.STATUS_COMPLETED:
            return {
                'code': 1,
                'msg': '只能对已完成的任务进行评价',
                'data': None
            }
        
        if self.review_model.has_reviewed(task_id, user_id):
            return {
                'code': 1,
                'msg': '您已经评价过该任务了',
                'data': None
            }
        
        if rating < 1 or rating > 5:
            return {
                'code': 1,
                'msg': '评分必须在1-5星之间',
                'data': None
            }
        
        reviewed_id = receiver_id if user_id == publisher_id else publisher_id
        
        if not reviewed_id:
            return {
                'code': 1,
                'msg': '缺少被评价用户',
                'data': None
            }
        
        review_id = self.review_model.create(task_id, user_id, reviewed_id, rating, content)
        if review_id <= 0:
            return {
                'code': 1,
                'msg': '评价提交失败',
                'data': None
            }
        
        is_positive = rating >= 4
        self.user_model.update_review_stats(reviewed_id, is_positive)
        
        credit_delta = 0
        if rating == 5:
            credit_delta = 1
        elif rating == 1:
            credit_delta = -2
        elif rating == 2:
            credit_delta = -1
        
        if credit_delta != 0:
            self.user_model.update_credit_score(reviewed_id, credit_delta)
        
        review = self.review_model.get_by_id(review_id)
        return {
            'code': 0,
            'msg': '评价提交成功',
            'data': {
                'id': review.get('id'),
                'task_id': review.get('task_id'),
                'reviewer_id': review.get('reviewer_id'),
                'reviewed_id': review.get('reviewed_id'),
                'rating': review.get('rating'),
                'content': review.get('content'),
                'created_at': review.get('created_at')
            }
        }

    def get_task_reviews(self, task_id: int) -> Dict[str, Any]:
        reviews = self.review_model.get_by_task(task_id)
        
        result = []
        for review in reviews:
            reviewer = self.user_model.get_by_id(review.get('reviewer_id'))
            review_dict = {
                'id': review.get('id'),
                'task_id': review.get('task_id'),
                'rating': review.get('rating'),
                'content': review.get('content'),
                'created_at': review.get('created_at'),
                'reviewer': {
                    'id': reviewer.get('id') if reviewer else None,
                    'nickname': reviewer.get('nickname') if reviewer else None,
                    'avatar_url': reviewer.get('avatar_url') if reviewer else None
                } if reviewer else None
            }
            result.append(review_dict)
        
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_user_reviews(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.review_model.get_by_reviewed(user_id, page, page_size)
        
        items = []
        for review in result.get('items', []):
            reviewer = self.user_model.get_by_id(review.get('reviewer_id'))
            review_dict = {
                'id': review.get('id'),
                'task_id': review.get('task_id'),
                'rating': review.get('rating'),
                'content': review.get('content'),
                'created_at': review.get('created_at'),
                'reviewer': {
                    'id': reviewer.get('id') if reviewer else None,
                    'nickname': reviewer.get('nickname') if reviewer else None,
                    'avatar_url': reviewer.get('avatar_url') if reviewer else None
                } if reviewer else None
            }
            items.append(review_dict)
        
        avg_rating = self.review_model.get_average_rating(user_id)
        
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages'),
                'average_rating': round(avg_rating, 1)
            }
        }

    def check_review_status(self, user_id: int, task_id: int) -> Dict[str, Any]:
        task = self.task_model.get_by_id(task_id)
        if not task:
            return {
                'code': 1,
                'msg': '任务不存在',
                'data': None
            }
        
        publisher_id = task.get('publisher_id')
        receiver_id = task.get('receiver_id')
        
        my_review = self.review_model.get_by_task_and_reviewer(task_id, user_id)
        other_review = None
        
        if user_id == publisher_id and receiver_id:
            other_review = self.review_model.get_by_task_and_reviewer(task_id, receiver_id)
        elif user_id == receiver_id:
            other_review = self.review_model.get_by_task_and_reviewer(task_id, publisher_id)
        
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'task_status': task.get('status'),
                'task_status_text': self.task_model.get_status_text(task.get('status')),
                'my_reviewed': my_review is not None,
                'my_review': my_review,
                'other_reviewed': other_review is not None,
                'other_review': other_review
            }
        }
