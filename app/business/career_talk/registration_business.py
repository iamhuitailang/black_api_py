from typing import Dict, Any, List
from app.model.career_talk import RegistrationModel, CareerTalkModel, CheckinModel


class RegistrationBusiness:
    def __init__(self):
        self.registration_model = RegistrationModel()
        self.talk_model = CareerTalkModel()
        self.checkin_model = CheckinModel()

    def get_registration_list(self, talk_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        try:
            talk = self.talk_model.get_by_id(talk_id)
            if not talk:
                return {
                    'code': 1,
                    'message': '宣讲会不存在',
                    'data': None
                }
            
            result = self.registration_model.paginate_by_talk(talk_id, page, page_size)
            
            items = []
            for reg in result['items']:
                is_checked_in = self.checkin_model.is_checked_in(talk_id, reg['student_id'])
                items.append({
                    'id': reg['id'],
                    'talk_id': reg['talk_id'],
                    'student_id': reg['student_id'],
                    'student_name': reg['student_name'],
                    'phone': reg['phone'],
                    'major': reg['major'],
                    'status': reg['status'],
                    'is_checked_in': is_checked_in,
                    'created_at': reg['created_at'],
                    'updated_at': reg['updated_at']
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

    def get_student_registrations(self, student_id: str) -> Dict[str, Any]:
        try:
            registrations = self.registration_model.get_by_student_id(student_id)
            
            items = []
            for reg in registrations:
                talk = self.talk_model.get_by_id(reg['talk_id'])
                is_checked_in = self.checkin_model.is_checked_in(reg['talk_id'], student_id)
                if talk:
                    items.append({
                        'registration_id': reg['id'],
                        'talk_id': talk['id'],
                        'company_name': talk['company_name'],
                        'talk_time': talk['talk_time'],
                        'location': talk['location'],
                        'status': reg['status'],
                        'is_checked_in': is_checked_in,
                        'registered_at': reg['created_at']
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

    def register(self, talk_id: int, student_id: str, student_name: str, 
                 phone: str = '', major: str = '') -> Dict[str, Any]:
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
            if not student_name or not student_name.strip():
                return {
                    'code': 1,
                    'message': '姓名不能为空',
                    'data': None
                }
            
            if self.registration_model.is_registered(talk_id, student_id.strip()):
                return {
                    'code': 1,
                    'message': '您已报名该宣讲会',
                    'data': None
                }
            
            new_id = self.registration_model.create(
                talk_id=talk_id,
                student_id=student_id.strip(),
                student_name=student_name.strip(),
                phone=phone or '',
                major=major or ''
            )
            
            reg = self.registration_model.get_by_id(new_id)
            return {
                'code': 0,
                'message': '报名成功',
                'data': reg
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def cancel_registration(self, talk_id: int, student_id: str) -> Dict[str, Any]:
        try:
            reg = self.registration_model.get_by_talk_and_student(talk_id, student_id)
            if not reg:
                return {
                    'code': 1,
                    'message': '报名记录不存在',
                    'data': None
                }
            
            affected = self.registration_model.update(reg['id'], status=0)
            if affected > 0:
                return {
                    'code': 0,
                    'message': '取消报名成功',
                    'data': None
                }
            
            return {
                'code': 1,
                'message': '取消报名失败',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def check_registration_status(self, talk_id: int, student_id: str) -> Dict[str, Any]:
        try:
            is_registered = self.registration_model.is_registered(talk_id, student_id)
            is_checked_in = self.checkin_model.is_checked_in(talk_id, student_id)
            
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'is_registered': is_registered,
                    'is_checked_in': is_checked_in
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }
