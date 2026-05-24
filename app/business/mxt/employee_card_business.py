import random
import string
from typing import Dict, Any, List, Optional
from app.model.mxt import EmployeeCardModel, ApplicationModel, JobModel


VALID_PERIODS = [
    '永远',
    '直到被狮子吃掉',
    '一年（试用期99年）',
    '直到大象学会飞',
    '合同期：一万年',
    '随时可能被解雇'
]


class EmployeeCardBusiness:
    def __init__(self):
        self.model = EmployeeCardModel()
        self.application_model = ApplicationModel()
        self.job_model = JobModel()

    def _generate_employee_no(self) -> str:
        prefix = 'MXT'
        random_digits = ''.join(random.choices(string.digits, k=6))
        return f"{prefix}{random_digits}"

    def generate_card(self, application_id: int) -> Dict[str, Any]:
        application = self.application_model.get_by_id(application_id)
        if not application:
            return {
                'code': 1,
                'message': '投递记录不存在',
                'data': None
            }
        
        if application.get('status') != 'hired':
            return {
                'code': 1,
                'message': '只有被录用的申请才能生成员工证',
                'data': None
            }
        
        existing_card = self.model.get_by_application_id(application_id)
        if existing_card:
            return {
                'code': 0,
                'message': 'success',
                'data': self._format_card(existing_card)
            }
        
        job = self.job_model.get_by_id(application.get('job_id'))
        job_name = job.get('name', '') if job else ''
        
        employee_no = self._generate_employee_no()
        valid_period = random.choice(VALID_PERIODS)
        
        try:
            new_id = self.model.create(
                application_id=application_id,
                employee_no=employee_no,
                applicant_name=application.get('applicant_name', ''),
                job_id=application.get('job_id'),
                job_name=job_name,
                valid_period=valid_period
            )
            
            card = self.model.get_by_id(new_id)
            return {
                'code': 0,
                'message': '员工证生成成功',
                'data': self._format_card(card)
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def _format_card(self, card: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': card.get('id'),
            'application_id': card.get('application_id'),
            'employee_no': card.get('employee_no'),
            'applicant_name': card.get('applicant_name'),
            'job_id': card.get('job_id'),
            'job_name': card.get('job_name'),
            'valid_period': card.get('valid_period'),
            'is_shared': card.get('is_shared'),
            'created_at': card.get('created_at'),
            'updated_at': card.get('updated_at')
        }

    def get_card_by_id(self, record_id: int) -> Dict[str, Any]:
        card = self.model.get_by_id(record_id)
        
        if card:
            return {
                'code': 0,
                'message': 'success',
                'data': self._format_card(card)
            }
        
        return {
            'code': 1,
            'message': '员工证不存在',
            'data': None
        }

    def get_card_by_application(self, application_id: int) -> Dict[str, Any]:
        card = self.model.get_by_application_id(application_id)
        
        if card:
            return {
                'code': 0,
                'message': 'success',
                'data': self._format_card(card)
            }
        
        return {
            'code': 1,
            'message': '员工证不存在',
            'data': None
        }

    def get_card_by_employee_no(self, employee_no: str) -> Dict[str, Any]:
        card = self.model.get_by_employee_no(employee_no)
        
        if card:
            return {
                'code': 0,
                'message': 'success',
                'data': self._format_card(card)
            }
        
        return {
            'code': 1,
            'message': '员工证不存在',
            'data': None
        }

    def share_card(self, record_id: int) -> Dict[str, Any]:
        card = self.model.get_by_id(record_id)
        if not card:
            return {
                'code': 1,
                'message': '员工证不存在',
                'data': None
            }
        
        if card.get('is_shared'):
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    **self._format_card(card),
                    'was_newly_shared': False
                }
            }
        
        self.model.update_shared(record_id)
        updated_card = self.model.get_by_id(record_id)
        
        return {
            'code': 0,
            'message': '分享成功',
            'data': {
                **self._format_card(updated_card),
                'was_newly_shared': True
            }
        }

    def get_all_cards(self) -> Dict[str, Any]:
        cards = self.model.get_all()
        
        result = [self._format_card(card) for card in cards]
        
        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def delete_card(self, record_id: int) -> Dict[str, Any]:
        existing = self.model.get_by_id(record_id)
        if not existing:
            return {
                'code': 1,
                'message': f'员工证ID {record_id} 不存在',
                'data': None
            }
        
        affected = self.model.delete(record_id)
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
