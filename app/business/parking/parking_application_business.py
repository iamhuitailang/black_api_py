from typing import Dict, Any, List, Optional
from datetime import datetime
import re
from app.model.parking import ParkingApplicationModel, ParkingSpotModel, ParkingPaymentModel


def validate_car_plate(car_plate: str) -> bool:
    if not car_plate:
        return False
    plate = car_plate.strip().upper()
    pattern = r'^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{4,5}[A-Z0-9挂学警港澳]$'
    if re.match(pattern, plate):
        return True
    pattern2 = r'^[A-Z]{2}\d{5}$'
    if re.match(pattern2, plate):
        return True
    return False


def validate_phone(phone: str) -> bool:
    if not phone:
        return False
    return bool(re.match(r'^1[3-9]\d{9}$', phone.strip()))


def add_months(dt: datetime, months: int) -> datetime:
    month = dt.month - 1 + months
    year = dt.year + month // 12
    month = month % 12 + 1
    day = min(dt.day, [31, 29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1])
    return dt.replace(year=year, month=month, day=day)


class ParkingApplicationBusiness:
    def __init__(self):
        self.model = ParkingApplicationModel()
        self.spot_model = ParkingSpotModel()
        self.payment_model = ParkingPaymentModel()

    def get_application_list(self, page: int = 1, page_size: int = 10, status: str = None, keyword: str = None) -> Dict[str, Any]:
        result = self.model.paginate(page, page_size, status, keyword)
        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def get_application_detail(self, application_id: int) -> Dict[str, Any]:
        application = self.model.get_by_id(application_id)
        if not application:
            return {
                'code': 1,
                'message': '申请不存在',
                'data': None
            }

        result = dict(application)

        if application.get('spot_id'):
            spot = self.spot_model.get_by_id(application['spot_id'])
            if spot:
                result['spot'] = spot

        payments = self.payment_model.get_by_application_id(application_id)
        result['payments'] = payments

        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def submit_application(self, car_plate: str, applicant_name: str, applicant_phone: str,
                           applicant_address: str = None, desired_spot_type: str = 'standard') -> Dict[str, Any]:
        if not car_plate or not car_plate.strip():
            return {
                'code': 1,
                'message': '车牌号不能为空',
                'data': None
            }
        if not validate_car_plate(car_plate):
            return {
                'code': 1,
                'message': '车牌号格式不正确，请输入正确的车牌号（如：京A12345）',
                'data': None
            }
        if not applicant_name or not applicant_name.strip():
            return {
                'code': 1,
                'message': '申请人姓名不能为空',
                'data': None
            }
        if not applicant_phone or not applicant_phone.strip():
            return {
                'code': 1,
                'message': '联系电话不能为空',
                'data': None
            }
        if not validate_phone(applicant_phone):
            return {
                'code': 1,
                'message': '手机号格式不正确，请输入11位有效手机号',
                'data': None
            }

        application_id = self.model.create(
            car_plate.strip(),
            applicant_name.strip(),
            applicant_phone.strip(),
            applicant_address.strip() if applicant_address else None,
            desired_spot_type
        )

        application = self.model.get_by_id(application_id)
        return {
            'code': 0,
            'message': '申请提交成功',
            'data': application
        }

    def approve_application(self, application_id: int, reviewer: str = 'admin') -> Dict[str, Any]:
        application = self.model.get_by_id(application_id)
        if not application:
            return {
                'code': 1,
                'message': '申请不存在',
                'data': None
            }

        if application['status'] != ParkingApplicationModel.STATUS_PENDING:
            return {
                'code': 1,
                'message': '当前状态不允许审批',
                'data': None
            }

        affected = self.model.approve(application_id, reviewer)
        if affected > 0:
            application = self.model.get_by_id(application_id)
            return {
                'code': 0,
                'message': '审批通过',
                'data': application
            }
        return {
            'code': 1,
            'message': '审批失败',
            'data': None
        }

    def reject_application(self, application_id: int, reject_reason: str, reviewer: str = 'admin') -> Dict[str, Any]:
        application = self.model.get_by_id(application_id)
        if not application:
            return {
                'code': 1,
                'message': '申请不存在',
                'data': None
            }

        if application['status'] != ParkingApplicationModel.STATUS_PENDING:
            return {
                'code': 1,
                'message': '当前状态不允许审批',
                'data': None
            }

        if not reject_reason or not reject_reason.strip():
            return {
                'code': 1,
                'message': '拒绝原因不能为空',
                'data': None
            }

        affected = self.model.reject(application_id, reject_reason.strip(), reviewer)
        if affected > 0:
            application = self.model.get_by_id(application_id)
            return {
                'code': 0,
                'message': '已拒绝申请',
                'data': application
            }
        return {
            'code': 1,
            'message': '操作失败',
            'data': None
        }

    def assign_spot(self, application_id: int, spot_id: int, months: int = 1) -> Dict[str, Any]:
        application = self.model.get_by_id(application_id)
        if not application:
            return {
                'code': 1,
                'message': '申请不存在',
                'data': None
            }

        if application['status'] not in [ParkingApplicationModel.STATUS_APPROVED, ParkingApplicationModel.STATUS_ASSIGNED]:
            return {
                'code': 1,
                'message': '当前状态不允许分配车位',
                'data': None
            }

        spot = self.spot_model.get_by_id(spot_id)
        if not spot:
            return {
                'code': 1,
                'message': '车位不存在',
                'data': None
            }

        if spot['status'] != ParkingSpotModel.STATUS_AVAILABLE:
            return {
                'code': 1,
                'message': '车位不可用',
                'data': None
            }

        if application['desired_spot_type'] and spot['spot_type'] != application['desired_spot_type']:
            pass

        now = datetime.now()
        start_date = now.strftime('%Y-%m-%d')
        end_date = add_months(now, months).strftime('%Y-%m-%d')

        old_spot_id = application.get('spot_id')

        self.model.assign_spot(application_id, spot_id, start_date, end_date)
        self.spot_model.update_status(spot_id, ParkingSpotModel.STATUS_OCCUPIED)

        if old_spot_id and old_spot_id != spot_id:
            self.spot_model.update_status(old_spot_id, ParkingSpotModel.STATUS_AVAILABLE)

        monthly_fee = spot['monthly_fee']
        for i in range(months):
            month_date = add_months(now, i)
            month_str = month_date.strftime('%Y-%m')
            existing_payments = self.payment_model.get_by_application_id(application_id)
            month_exists = any(p['month'] == month_str for p in existing_payments)
            if not month_exists:
                self.payment_model.create(
                    application_id,
                    spot_id,
                    application['car_plate'],
                    application['applicant_name'],
                    monthly_fee,
                    month_str
                )

        application = self.model.get_by_id(application_id)
        return {
            'code': 0,
            'message': '车位分配成功',
            'data': application
        }

    def get_my_applications(self, phone: str) -> Dict[str, Any]:
        if not phone or not phone.strip():
            return {
                'code': 1,
                'message': '请输入手机号查询',
                'data': []
            }

        applications = self.model.query.find_all(
            {'applicant_phone': phone.strip()},
            order_by='id DESC'
        )

        for app in applications:
            if app.get('spot_id'):
                spot = self.spot_model.get_by_id(app['spot_id'])
                app['spot'] = spot

        return {
            'code': 0,
            'message': 'success',
            'data': applications
        }

    def get_statistics(self) -> Dict[str, Any]:
        total = self.model.count()
        pending = self.model.count(status=ParkingApplicationModel.STATUS_PENDING)
        approved = self.model.count(status=ParkingApplicationModel.STATUS_APPROVED)
        rejected = self.model.count(status=ParkingApplicationModel.STATUS_REJECTED)
        assigned = self.model.count(status=ParkingApplicationModel.STATUS_ASSIGNED)

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'total': total,
                'pending': pending,
                'approved': approved,
                'rejected': rejected,
                'assigned': assigned
            }
        }
