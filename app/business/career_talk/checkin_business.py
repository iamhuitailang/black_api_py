from typing import Dict, Any, List
from app.model.career_talk import CheckinModel, CareerTalkModel, RegistrationModel


class CheckinBusiness:
    def __init__(self):
        self.checkin_model = CheckinModel()
        self.talk_model = CareerTalkModel()
        self.registration_model = RegistrationModel()

    def get_checkin_list(self, talk_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        try:
            talk = self.talk_model.get_by_id(talk_id)
            if not talk:
                return {
                    'code': 1,
                    'message': '宣讲会不存在',
                    'data': None
                }
            
            result = self.checkin_model.paginate_by_talk(talk_id, page, page_size)
            
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

    def get_student_checkins(self, student_id: str) -> Dict[str, Any]:
        try:
            checkins = self.checkin_model.get_by_student_id(student_id)
            
            items = []
            for checkin in checkins:
                talk = self.talk_model.get_by_id(checkin['talk_id'])
                if talk:
                    items.append({
                        'checkin_id': checkin['id'],
                        'talk_id': talk['id'],
                        'company_name': talk['company_name'],
                        'talk_time': talk['talk_time'],
                        'location': talk['location'],
                        'checkin_time': checkin['checkin_time']
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

    def checkin_by_student_id(self, talk_id: int, student_id: str, student_name: str = '') -> Dict[str, Any]:
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
            
            if self.checkin_model.is_checked_in(talk_id, student_id):
                checkin_record = self.checkin_model.get_by_talk_and_student(talk_id, student_id)
                return {
                    'code': 0,
                    'message': '已签到，请勿重复签到',
                    'data': checkin_record
                }
            
            name_to_use = student_name
            if not name_to_use:
                reg = self.registration_model.get_by_talk_and_student(talk_id, student_id)
                if reg:
                    name_to_use = reg['student_name']
            
            new_id = self.checkin_model.create(
                talk_id=talk_id,
                student_id=student_id,
                student_name=name_to_use or ''
            )
            
            checkin_record = self.checkin_model.get_by_id(new_id)
            return {
                'code': 0,
                'message': '签到成功',
                'data': checkin_record
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def checkin_by_short_code(self, short_code: str, student_id: str, student_name: str = '') -> Dict[str, Any]:
        try:
            talk = self.talk_model.get_by_short_code(short_code)
            if not talk:
                return {
                    'code': 1,
                    'message': '宣讲会不存在',
                    'data': None
                }
            
            return self.checkin_by_student_id(talk['id'], student_id, student_name)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_checkin_stats(self, talk_id: int) -> Dict[str, Any]:
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
            
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'registration_count': registration_count,
                    'checkin_count': checkin_count,
                    'checkin_rate': round(checkin_count / registration_count * 100, 1) if registration_count > 0 else 0
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }
