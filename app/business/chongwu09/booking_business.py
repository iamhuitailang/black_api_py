from typing import Dict, Any
from datetime import datetime
from app.model.chongwu09 import BookingModel, ServiceModel, NotificationModel, OrderModel


class BookingBusiness:
    def __init__(self):
        self.booking_model = BookingModel()
        self.service_model = ServiceModel()
        self.notification_model = NotificationModel()
        self.order_model = OrderModel()

    def create_booking(self, user_id: int, service_id: int, pet_id: int,
                       start_date: str, end_date: str, notes: str = '') -> Dict[str, Any]:
        service = self.service_model.get_by_id(service_id)
        if not service:
            return {'code': 1, 'msg': '服务不存在', 'data': None}
        if service.get('status') != ServiceModel.STATUS_ACTIVE:
            return {'code': 1, 'msg': '服务暂不可用', 'data': None}
        if not start_date or not end_date:
            return {'code': 1, 'msg': '请选择寄养时间', 'data': None}
        booking_id = self.booking_model.create(
            user_id, service_id, pet_id, start_date, end_date, notes
        )
        if booking_id > 0:
            self.service_model.update_booked(service_id, 1)
            self.notification_model.create(
                user_id=user_id,
                title='预约提交成功',
                content=f'您的寄养预约已提交，等待管理员确认。',
                notification_type='booking',
                related_id=booking_id
            )
            booking = self.booking_model.get_by_id(booking_id)
            return {'code': 0, 'msg': '预约成功', 'data': self.booking_model.to_dict(booking)}
        return {'code': 1, 'msg': '预约失败', 'data': None}

    def get_booking(self, booking_id: int) -> Dict[str, Any]:
        booking = self.booking_model.get_by_id(booking_id)
        if not booking:
            return {'code': 1, 'msg': '预约不存在', 'data': None}
        return {'code': 0, 'msg': 'success', 'data': self.booking_model.to_dict(booking)}

    def cancel_booking(self, booking_id: int, user_id: int) -> Dict[str, Any]:
        booking = self.booking_model.get_by_id(booking_id)
        if not booking:
            return {'code': 1, 'msg': '预约不存在', 'data': None}
        if booking.get('user_id') != user_id:
            return {'code': 1, 'msg': '无权操作', 'data': None}
        if booking.get('status') not in [BookingModel.STATUS_PENDING, BookingModel.STATUS_CONFIRMED]:
            return {'code': 1, 'msg': '当前状态不可取消', 'data': None}
        affected = self.booking_model.update_status(booking_id, BookingModel.STATUS_CANCELLED)
        if affected > 0:
            self.service_model.update_booked(booking.get('service_id'), -1)
            self.notification_model.create(
                user_id=user_id,
                title='预约已取消',
                content=f'您的寄养预约已取消。',
                notification_type='booking',
                related_id=booking_id
            )
            return {'code': 0, 'msg': '取消成功', 'data': None}
        return {'code': 1, 'msg': '取消失败', 'data': None}

    def get_my_bookings(self, user_id: int, page: int = 1, page_size: int = 10,
                        status: int = None) -> Dict[str, Any]:
        result = self.booking_model.get_by_user(user_id, page, page_size, status)
        items = [self._enrich_booking(item) for item in result.get('items', [])]
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

    def get_all_bookings(self, page: int = 1, page_size: int = 10,
                         status: int = None, service_id: int = None,
                         keyword: str = None) -> Dict[str, Any]:
        result = self.booking_model.get_all(page, page_size, status, service_id, keyword)
        items = [self._enrich_booking(item) for item in result.get('items', [])]
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

    def confirm_booking(self, booking_id: int, admin_notes: str = '') -> Dict[str, Any]:
        booking = self.booking_model.get_by_id(booking_id)
        if not booking:
            return {'code': 1, 'msg': '预约不存在', 'data': None}
        if booking.get('status') != BookingModel.STATUS_PENDING:
            return {'code': 1, 'msg': '当前状态不可确认', 'data': None}
        affected = self.booking_model.update_status(booking_id, BookingModel.STATUS_CONFIRMED, admin_notes)
        if affected > 0:
            service = self.service_model.get_by_id(booking.get('service_id'))
            try:
                start_date = datetime.strptime(booking.get('start_date'), '%Y-%m-%d')
                end_date = datetime.strptime(booking.get('end_date'), '%Y-%m-%d')
                days = (end_date - start_date).days
                if days <= 0:
                    days = 1
            except:
                days = 1
            price = service.get('price', 0) if service else 0
            amount = price * days
            self.order_model.create(
                user_id=booking.get('user_id'),
                service_id=booking.get('service_id'),
                booking_id=booking_id,
                pet_id=booking.get('pet_id'),
                amount=amount,
                days=days
            )
            self.notification_model.create(
                user_id=booking.get('user_id'),
                title='预约已确认',
                content=f'您的寄养预约已被管理员确认，请按时送达宠物。',
                notification_type='booking',
                related_id=booking_id
            )
            return {'code': 0, 'msg': '确认成功', 'data': None}
        return {'code': 1, 'msg': '确认失败', 'data': None}

    def start_booking(self, booking_id: int, admin_notes: str = '') -> Dict[str, Any]:
        booking = self.booking_model.get_by_id(booking_id)
        if not booking:
            return {'code': 1, 'msg': '预约不存在', 'data': None}
        if booking.get('status') != BookingModel.STATUS_CONFIRMED:
            return {'code': 1, 'msg': '当前状态不可开始寄养', 'data': None}
        affected = self.booking_model.update_status(booking_id, BookingModel.STATUS_ACTIVE, admin_notes)
        if affected > 0:
            self.notification_model.create(
                user_id=booking.get('user_id'),
                title='寄养已开始',
                content=f'您的宠物已开始寄养服务。',
                notification_type='booking',
                related_id=booking_id
            )
            return {'code': 0, 'msg': '操作成功', 'data': None}
        return {'code': 1, 'msg': '操作失败', 'data': None}

    def complete_booking(self, booking_id: int, admin_notes: str = '') -> Dict[str, Any]:
        booking = self.booking_model.get_by_id(booking_id)
        if not booking:
            return {'code': 1, 'msg': '预约不存在', 'data': None}
        if booking.get('status') != BookingModel.STATUS_ACTIVE:
            return {'code': 1, 'msg': '当前状态不可完成', 'data': None}
        affected = self.booking_model.update_status(booking_id, BookingModel.STATUS_COMPLETED, admin_notes)
        if affected > 0:
            self.service_model.update_booked(booking.get('service_id'), -1)
            self.notification_model.create(
                user_id=booking.get('user_id'),
                title='寄养已完成',
                content=f'您的宠物寄养服务已完成，欢迎评价！',
                notification_type='booking',
                related_id=booking_id
            )
            return {'code': 0, 'msg': '操作成功', 'data': None}
        return {'code': 1, 'msg': '操作失败', 'data': None}

    def reject_booking(self, booking_id: int, admin_notes: str = '') -> Dict[str, Any]:
        booking = self.booking_model.get_by_id(booking_id)
        if not booking:
            return {'code': 1, 'msg': '预约不存在', 'data': None}
        if booking.get('status') != BookingModel.STATUS_PENDING:
            return {'code': 1, 'msg': '当前状态不可拒绝', 'data': None}
        affected = self.booking_model.update_status(booking_id, BookingModel.STATUS_CANCELLED, admin_notes)
        if affected > 0:
            self.service_model.update_booked(booking.get('service_id'), -1)
            self.notification_model.create(
                user_id=booking.get('user_id'),
                title='预约被拒绝',
                content=f'您的寄养预约已被管理员拒绝。原因：{admin_notes or "无"}',
                notification_type='booking',
                related_id=booking_id
            )
            return {'code': 0, 'msg': '操作成功', 'data': None}
        return {'code': 1, 'msg': '操作失败', 'data': None}

    def _enrich_booking(self, booking: Dict[str, Any]) -> Dict[str, Any]:
        result = self.booking_model.to_dict(booking)
        from app.model.chongwu09 import PetModel
        pet_model = PetModel()
        pet = pet_model.get_by_id(booking.get('pet_id'))
        if pet:
            result['pet'] = pet_model.to_dict(pet)
        service = self.service_model.get_by_id(booking.get('service_id'))
        if service:
            result['service'] = self.service_model.to_dict(service)
        from app.model.chongwu09 import UserModel
        user_model = UserModel()
        user = user_model.get_by_id(booking.get('user_id'))
        if user:
            result['user'] = user_model.to_public_dict(user)
        return result
