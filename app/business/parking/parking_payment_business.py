from typing import Dict, Any, List, Optional
from app.model.parking import ParkingPaymentModel


class ParkingPaymentBusiness:
    def __init__(self):
        self.model = ParkingPaymentModel()

    def get_payment_list(self, page: int = 1, page_size: int = 10, status: str = None,
                         month: str = None, keyword: str = None) -> Dict[str, Any]:
        result = self.model.paginate(page, page_size, status, month, keyword)
        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def get_payment_detail(self, payment_id: int) -> Dict[str, Any]:
        payment = self.model.get_by_id(payment_id)
        if not payment:
            return {
                'code': 1,
                'message': '缴费记录不存在',
                'data': None
            }
        return {
            'code': 0,
            'message': 'success',
            'data': payment
        }

    def mark_paid(self, payment_id: int, payment_method: str = 'cash', remark: str = None) -> Dict[str, Any]:
        payment = self.model.get_by_id(payment_id)
        if not payment:
            return {
                'code': 1,
                'message': '缴费记录不存在',
                'data': None
            }

        if payment['status'] == ParkingPaymentModel.STATUS_PAID:
            return {
                'code': 1,
                'message': '该记录已缴费',
                'data': None
            }

        affected = self.model.mark_paid(payment_id, payment_method, remark)
        if affected > 0:
            payment = self.model.get_by_id(payment_id)
            return {
                'code': 0,
                'message': '标记缴费成功',
                'data': payment
            }
        return {
            'code': 1,
            'message': '操作失败',
            'data': None
        }

    def get_my_payments(self, car_plate: str = None, phone: str = None) -> Dict[str, Any]:
        from app.model.parking import ParkingApplicationModel

        if not car_plate and not phone:
            return {
                'code': 1,
                'message': '请提供车牌号或手机号',
                'data': []
            }

        if car_plate:
            payments = self.model.get_by_car_plate(car_plate.strip())
        else:
            app_model = ParkingApplicationModel()
            applications = app_model.query.find_all(
                {'applicant_phone': phone.strip()},
                order_by='id DESC'
            )
            payments = []
            for app in applications:
                app_payments = self.model.get_by_application_id(app['id'])
                payments.extend(app_payments)

        return {
            'code': 0,
            'message': 'success',
            'data': payments
        }

    def get_statistics(self, month: str = None) -> Dict[str, Any]:
        stats = self.model.get_statistics(month)
        return {
            'code': 0,
            'message': 'success',
            'data': stats
        }

    def delete_payment(self, payment_id: int) -> Dict[str, Any]:
        existing = self.model.get_by_id(payment_id)
        if not existing:
            return {
                'code': 1,
                'message': '缴费记录不存在',
                'data': None
            }

        affected = self.model.delete(payment_id)
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
