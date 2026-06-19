import random
import string
from typing import Dict, Any, List, Optional
from app.model.career_talk import CareerTalkModel, RegistrationModel, CheckinModel, FeedbackModel


class CareerTalkBusiness:
    def __init__(self):
        self.talk_model = CareerTalkModel()
        self.registration_model = RegistrationModel()
        self.checkin_model = CheckinModel()
        self.feedback_model = FeedbackModel()

    def _generate_short_code(self) -> str:
        chars = string.ascii_uppercase + string.digits
        while True:
            code = ''.join(random.choices(chars, k=6))
            if not self.talk_model.get_by_short_code(code):
                return code

    def get_talk_list(self, page: int = 1, page_size: int = 10, keyword: str = None, status: int = None) -> Dict[str, Any]:
        try:
            result = self.talk_model.paginate(page=page, page_size=page_size, keyword=keyword, status=status)
            
            items = []
            for talk in result['items']:
                registration_count = self.registration_model.count_by_talk(talk['id'])
                checkin_count = self.checkin_model.count_by_talk(talk['id'])
                items.append({
                    'id': talk['id'],
                    'company_name': talk['company_name'],
                    'talk_time': talk['talk_time'],
                    'location': talk['location'],
                    'description': talk['description'],
                    'short_code': talk['short_code'],
                    'status': talk['status'],
                    'registration_count': registration_count,
                    'checkin_count': checkin_count,
                    'created_at': talk['created_at'],
                    'updated_at': talk['updated_at']
                })
            
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'items': items,
                    'total': result['total'],
                    'page': result['page'],
                    'page_size': result['page_size'],
                    'total_pages': result['total_pages']
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_talk_detail(self, talk_id: int) -> Dict[str, Any]:
        try:
            talk = self.talk_model.get_by_id(talk_id)
            if not talk:
                return {
                    'code': 1,
                    'message': '宣讲会不存在',
                    'data': None
                }
            
            registration_count = self.registration_model.count_by_talk(talk_id)
            checkin_count = self.checkin_model.count_by_talk(talk_id)
            feedback_count = self.feedback_model.count_by_talk(talk_id)
            feedback_stats = self.feedback_model.get_stats(talk_id)
            
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'id': talk['id'],
                    'company_name': talk['company_name'],
                    'talk_time': talk['talk_time'],
                    'location': talk['location'],
                    'description': talk['description'],
                    'short_code': talk['short_code'],
                    'status': talk['status'],
                    'registration_count': registration_count,
                    'checkin_count': checkin_count,
                    'feedback_count': feedback_count,
                    'feedback_stats': feedback_stats,
                    'created_at': talk['created_at'],
                    'updated_at': talk['updated_at']
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_talk_by_short_code(self, short_code: str) -> Dict[str, Any]:
        try:
            talk = self.talk_model.get_by_short_code(short_code)
            if not talk:
                return {
                    'code': 1,
                    'message': '宣讲会不存在',
                    'data': None
                }
            return self.get_talk_detail(talk['id'])
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def create_talk(self, company_name: str, talk_time: str, location: str, 
                    description: str = '', short_code: str = None) -> Dict[str, Any]:
        try:
            if not company_name or not company_name.strip():
                return {
                    'code': 1,
                    'message': '公司名称不能为空',
                    'data': None
                }
            if not talk_time or not talk_time.strip():
                return {
                    'code': 1,
                    'message': '宣讲时间不能为空',
                    'data': None
                }
            if not location or not location.strip():
                return {
                    'code': 1,
                    'message': '宣讲地点不能为空',
                    'data': None
                }
            
            if short_code:
                existing = self.talk_model.get_by_short_code(short_code)
                if existing:
                    return {
                        'code': 1,
                        'message': '短码已存在',
                        'data': None
                    }
            else:
                short_code = self._generate_short_code()
            
            new_id = self.talk_model.create(
                company_name=company_name.strip(),
                talk_time=talk_time.strip(),
                location=location.strip(),
                description=description or '',
                short_code=short_code
            )
            
            return self.get_talk_detail(new_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def update_talk(self, talk_id: int, company_name: str = None, talk_time: str = None, 
                    location: str = None, description: str = None, 
                    short_code: str = None, status: int = None) -> Dict[str, Any]:
        try:
            talk = self.talk_model.get_by_id(talk_id)
            if not talk:
                return {
                    'code': 1,
                    'message': '宣讲会不存在',
                    'data': None
                }
            
            if short_code and short_code != talk['short_code']:
                existing = self.talk_model.get_by_short_code(short_code)
                if existing:
                    return {
                        'code': 1,
                        'message': '短码已存在',
                        'data': None
                    }
            
            affected = self.talk_model.update(
                record_id=talk_id,
                company_name=company_name,
                talk_time=talk_time,
                location=location,
                description=description,
                short_code=short_code,
                status=status
            )
            
            if affected > 0:
                return self.get_talk_detail(talk_id)
            
            return {
                'code': 1,
                'message': '更新失败',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def delete_talk(self, talk_id: int) -> Dict[str, Any]:
        try:
            talk = self.talk_model.get_by_id(talk_id)
            if not talk:
                return {
                    'code': 1,
                    'message': '宣讲会不存在',
                    'data': None
                }
            
            affected = self.talk_model.delete(talk_id)
            if affected > 0:
                return {
                    'code': 0,
                    'message': '删除成功',
                    'data': None
                }
            
            return {
                'code': 1,
                'message': '删除失败',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }
