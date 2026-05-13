from typing import Dict, Any, List
from app.model.bm import RegistrationModel, ActivityModel, CheckinLogModel


class BmAdminBusiness:
    def __init__(self):
        self.registration_model = RegistrationModel()
        self.activity_model = ActivityModel()
        self.checkin_log_model = CheckinLogModel()

    def get_registration_list(self, activity_id: int = None, page: int = 1,
                               page_size: int = 10, status: int = None,
                               keyword: str = None) -> Dict[str, Any]:
        if activity_id:
            result = self.registration_model.get_by_activity(activity_id, page, page_size, status)
        else:
            result = self.registration_model.get_all(page, page_size, status, keyword)

        items = [self.registration_model.to_dict(item) for item in result.get('items', [])]

        for item in items:
            activity = self.activity_model.get_by_id(item['activity_id'])
            if activity:
                item['activity'] = self.activity_model.to_dict(activity)

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

    def approve_registration(self, registration_id: int) -> Dict[str, Any]:
        registration = self.registration_model.get_by_id(registration_id)
        if not registration:
            return {
                'code': 1,
                'msg': '报名记录不存在',
                'data': None
            }

        if registration.get('status') != self.registration_model.STATUS_PENDING:
            return {
                'code': 1,
                'msg': '该报名无需审核',
                'data': None
            }

        affected = self.registration_model.update_status(
            registration_id,
            self.registration_model.STATUS_APPROVED
        )

        if affected > 0:
            return {
                'code': 0,
                'msg': '审核通过',
                'data': None
            }

        return {
            'code': 1,
            'msg': '审核失败',
            'data': None
        }

    def reject_registration(self, registration_id: int) -> Dict[str, Any]:
        registration = self.registration_model.get_by_id(registration_id)
        if not registration:
            return {
                'code': 1,
                'msg': '报名记录不存在',
                'data': None
            }

        if registration.get('status') != self.registration_model.STATUS_PENDING:
            return {
                'code': 1,
                'msg': '该报名无需审核',
                'data': None
            }

        affected = self.registration_model.update_status(
            registration_id,
            self.registration_model.STATUS_REJECTED
        )

        if affected > 0:
            self.activity_model.increase_quota(registration.get('activity_id'))
            return {
                'code': 0,
                'msg': '已拒绝',
                'data': None
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def checkin_by_qrcode(self, qrcode: str, operator_id: int = None,
                          operator_name: str = '', device_info: str = '',
                          ip_address: str = '') -> Dict[str, Any]:
        registration = self.registration_model.get_by_qrcode(qrcode)
        if not registration:
            return {
                'code': 1,
                'msg': '签到码无效',
                'data': None
            }

        if registration.get('status') != self.registration_model.STATUS_APPROVED:
            return {
                'code': 1,
                'msg': '报名未通过，无法签到',
                'data': None
            }

        if registration.get('checked_in') == 1:
            return {
                'code': 1,
                'msg': '已签到，请勿重复签到',
                'data': None
            }

        affected = self.registration_model.checkin(registration.get('id'))

        if affected > 0:
            self.checkin_log_model.create(
                registration_id=registration.get('id'),
                qrcode=qrcode,
                operator_id=operator_id,
                operator_name=operator_name,
                device_info=device_info,
                ip_address=ip_address
            )
            return {
                'code': 0,
                'msg': '签到成功',
                'data': self.registration_model.to_dict(registration)
            }

        return {
            'code': 1,
            'msg': '签到失败',
            'data': None
        }

    def checkin_by_registration_id(self, registration_id: int, operator_id: int = None,
                                    operator_name: str = '') -> Dict[str, Any]:
        registration = self.registration_model.get_by_id(registration_id)
        if not registration:
            return {
                'code': 1,
                'msg': '报名记录不存在',
                'data': None
            }

        if registration.get('status') != self.registration_model.STATUS_APPROVED:
            return {
                'code': 1,
                'msg': '报名未通过，无法签到',
                'data': None
            }

        if registration.get('checked_in') == 1:
            return {
                'code': 1,
                'msg': '已签到，请勿重复签到',
                'data': None
            }

        affected = self.registration_model.checkin(registration_id)

        if affected > 0:
            self.checkin_log_model.create(
                registration_id=registration_id,
                qrcode=registration.get('qrcode', ''),
                operator_id=operator_id,
                operator_name=operator_name
            )
            return {
                'code': 0,
                'msg': '签到成功',
                'data': self.registration_model.to_dict(registration)
            }

        return {
            'code': 1,
            'msg': '签到失败',
            'data': None
        }

    def get_activity_statistics(self, activity_id: int) -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {
                'code': 1,
                'msg': '活动不存在',
                'data': None
            }

        stats = self.registration_model.get_statistics_by_activity(activity_id)

        result = self.activity_model.to_dict(activity)
        result.update(stats)

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_checkin_logs(self, registration_id: int = None, page: int = 1,
                         page_size: int = 10) -> Dict[str, Any]:
        if registration_id:
            result = self.checkin_log_model.get_by_registration(registration_id, page, page_size)
        else:
            result = self.checkin_log_model.get_all(page, page_size)

        items = [self.checkin_log_model.to_dict(item) for item in result.get('items', [])]

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
