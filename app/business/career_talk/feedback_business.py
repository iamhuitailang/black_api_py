from typing import Dict, Any, List
from app.model.career_talk import FeedbackModel, CareerTalkModel


class FeedbackBusiness:
    def __init__(self):
        self.feedback_model = FeedbackModel()
        self.talk_model = CareerTalkModel()

    def get_feedback_list(self, talk_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        try:
            talk = self.talk_model.get_by_id(talk_id)
            if not talk:
                return {
                    'code': 1,
                    'message': '宣讲会不存在',
                    'data': None
                }
            
            result = self.feedback_model.paginate_by_talk(talk_id, page, page_size)
            
            return {
                'code': 0,
                'message': 'success',
                'data': result
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_feedback_stats(self, talk_id: int) -> Dict[str, Any]:
        try:
            talk = self.talk_model.get_by_id(talk_id)
            if not talk:
                return {
                    'code': 1,
                    'message': '宣讲会不存在',
                    'data': None
                }
            
            stats = self.feedback_model.get_stats(talk_id)
            
            return {
                'code': 0,
                'message': 'success',
                'data': stats
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def submit_feedback(self, talk_id: int, student_id: str, student_name: str = '', 
                        rating: int = 0, content: str = '') -> Dict[str, Any]:
        try:
            talk = self.talk_model.get_by_id(talk_id)
            if not talk:
                return {
                    'code': 1,
                    'message': '宣讲会不存在',
                    'data': None
                }
            
            if not student_id or not student_id.strip():
                return {
                    'code': 1,
                    'message': '学号不能为空',
                    'data': None
                }
            
            student_id = student_id.strip()
            
            if self.feedback_model.has_submitted(talk_id, student_id):
                return {
                    'code': 1,
                    'message': '您已提交过反馈',
                    'data': None
                }
            
            if rating < 1 or rating > 5:
                return {
                    'code': 1,
                    'message': '评分必须在1-5之间',
                    'data': None
                }
            
            new_id = self.feedback_model.create(
                talk_id=talk_id,
                student_id=student_id,
                student_name=student_name or '',
                rating=rating,
                content=content or ''
            )
            
            feedback = self.feedback_model.get_by_id(new_id)
            return {
                'code': 0,
                'message': '反馈提交成功',
                'data': feedback
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_student_feedback(self, student_id: str) -> Dict[str, Any]:
        try:
            feedbacks = self.feedback_model.get_by_student_id(student_id)
            
            items = []
            for fb in feedbacks:
                talk = self.talk_model.get_by_id(fb['talk_id'])
                if talk:
                    items.append({
                        'feedback_id': fb['id'],
                        'talk_id': talk['id'],
                        'company_name': talk['company_name'],
                        'talk_time': talk['talk_time'],
                        'rating': fb['rating'],
                        'content': fb['content'],
                        'submitted_at': fb['created_at']
                    })
            
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'items': items
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def check_feedback_status(self, talk_id: int, student_id: str) -> Dict[str, Any]:
        try:
            has_submitted = self.feedback_model.has_submitted(talk_id, student_id)
            
            feedback = None
            if has_submitted:
                feedback = self.feedback_model.get_by_talk_and_student(talk_id, student_id)
            
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'has_submitted': has_submitted,
                    'feedback': feedback
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }
