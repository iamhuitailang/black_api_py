from typing import Dict, Any, Optional
from datetime import datetime
from app.model.jiudian_077_model import BookingModel, RoomModel, MessageModel
import re


class JiudianBookingBusiness:
    def __init__(self):
        self.booking_model = BookingModel()
        self.room_model = RoomModel()
        self.message_model = MessageModel()

    def _validate_phone(self, phone: str) -> bool:
        if not phone:
            return False
        pattern = r'^1[3-9]\d{9}$'
        return re.match(pattern, phone) is not None

    def _validate_id_card(self, id_card: str) -> bool:
        if not id_card:
            return True
        pattern = r'(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)'
        return re.match(pattern, id_card) is not None

    def _calculate_days(self, check_in_date: str, check_out_date: str) -> int:
        try:
            in_date = datetime.strptime(check_in_date, '%Y-%m-%d')
            out_date = datetime.strptime(check_out_date, '%Y-%m-%d')
            delta = out_date - in_date
            return max(1, delta.days)
        except:
            return 1

    def create_booking(self, user_id: int, room_id: int, check_in_date: str, check_out_date: str,
                       guest_name: str, guest_phone: str, guest_id_card: str = '',
                       guests_count: int = 1, remark: str = '') -> Dict[str, Any]:
        if not check_in_date or not check_out_date:
            return {
                'code': 1,
                'msg': '入住日期和退房日期不能为空',
                'data': None
            }

        try:
            in_date = datetime.strptime(check_in_date, '%Y-%m-%d')
            out_date = datetime.strptime(check_out_date, '%Y-%m-%d')
            if in_date >= out_date:
                return {
                    'code': 1,
                    'msg': '退房日期必须晚于入住日期',
                    'data': None
                }
            if in_date.date() < datetime.now().date():
                return {
                    'code': 1,
                    'msg': '入住日期不能早于今天',
                    'data': None
                }
        except:
            return {
                'code': 1,
                'msg': '日期格式不正确，请使用YYYY-MM-DD格式',
                'data': None
            }

        if not guest_name:
            return {
                'code': 1,
                'msg': '入住人姓名不能为空',
                'data': None
            }

        if not self._validate_phone(guest_phone):
            return {
                'code': 1,
                'msg': '手机号格式不正确',
                'data': None
            }

        if not self._validate_id_card(guest_id_card):
            return {
                'code': 1,
                'msg': '身份证号格式不正确',
                'data': None
            }

        if guests_count < 1:
            return {
                'code': 1,
                'msg': '入住人数至少为1人',
                'data': None
            }

        room = self.room_model.get_by_id(room_id)
        if not room:
            return {
                'code': 1,
                'msg': '房间不存在',
                'data': None
            }

        if room.get('status') != self.room_model.STATUS_AVAILABLE:
            return {
                'code': 1,
                'msg': '该房间当前不可预订',
                'data': None
            }

        if guests_count > room.get('max_guests', 2):
            return {
                'code': 1,
                'msg': f'该房间最多入住{room.get("max_guests", 2)}人',
                'data': None
            }

        if not self.booking_model.is_room_available(room_id, check_in_date, check_out_date):
            return {
                'code': 1,
                'msg': '该房间在所选日期已被预订',
                'data': None
            }

        days = self._calculate_days(check_in_date, check_out_date)
        total_price = days * room.get('price', 0)

        booking_id = self.booking_model.create(
            user_id, room_id, check_in_date, check_out_date,
            guest_name, guest_phone, guest_id_card, guests_count,
            total_price, remark
        )

        if booking_id > 0:
            booking = self.booking_model.get_by_id(booking_id)
            self.booking_model.confirm(booking_id)
            self.message_model.send_booking_confirm(
                user_id, booking_id, booking.get('booking_no', '')
            )

            booking = self.booking_model.get_by_id(booking_id)
            return {
                'code': 0,
                'msg': '预订成功',
                'data': self.booking_model.to_public_dict(booking)
            }

        return {
            'code': 1,
            'msg': '预订失败',
            'data': None
        }

    def cancel_booking(self, booking_id: int, user_id: int = None, is_admin: bool = False) -> Dict[str, Any]:
        booking = self.booking_model.get_by_id(booking_id)
        if not booking:
            return {
                'code': 1,
                'msg': '预订不存在',
                'data': None
            }

        if not is_admin and booking.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权取消他人的预订',
                'data': None
            }

        if booking.get('status') == self.booking_model.STATUS_CANCELLED:
            return {
                'code': 1,
                'msg': '该预订已取消',
                'data': None
            }

        if booking.get('status') == self.booking_model.STATUS_CHECKED_IN:
            return {
                'code': 1,
                'msg': '已入住的预订无法取消，请办理退房',
                'data': None
            }

        if booking.get('status') == self.booking_model.STATUS_CHECKED_OUT:
            return {
                'code': 1,
                'msg': '已退房的预订无法取消',
                'data': None
            }

        affected = self.booking_model.cancel(booking_id)
        if affected > 0:
            self.message_model.send_booking_cancel(
                booking.get('user_id'), booking_id, booking.get('booking_no', '')
            )

            updated_booking = self.booking_model.get_by_id(booking_id)
            return {
                'code': 0,
                'msg': '取消成功',
                'data': self.booking_model.to_public_dict(updated_booking)
            }

        return {
            'code': 1,
            'msg': '取消失败',
            'data': None
        }

    def confirm_booking(self, booking_id: int) -> Dict[str, Any]:
        booking = self.booking_model.get_by_id(booking_id)
        if not booking:
            return {
                'code': 1,
                'msg': '预订不存在',
                'data': None
            }

        if booking.get('status') != self.booking_model.STATUS_PENDING:
            return {
                'code': 1,
                'msg': '该预订状态不允许确认',
                'data': None
            }

        affected = self.booking_model.confirm(booking_id)
        if affected > 0:
            self.message_model.send_booking_confirm(
                booking.get('user_id'), booking_id, booking.get('booking_no', '')
            )

            updated_booking = self.booking_model.get_by_id(booking_id)
            return {
                'code': 0,
                'msg': '确认成功',
                'data': self.booking_model.to_public_dict(updated_booking)
            }

        return {
            'code': 1,
            'msg': '确认失败',
            'data': None
        }

    def check_in(self, booking_id: int) -> Dict[str, Any]:
        booking = self.booking_model.get_by_id(booking_id)
        if not booking:
            return {
                'code': 1,
                'msg': '预订不存在',
                'data': None
            }

        if booking.get('status') != self.booking_model.STATUS_CONFIRMED:
            return {
                'code': 1,
                'msg': '只有已确认的预订才能办理入住',
                'data': None
            }

        affected = self.booking_model.check_in(booking_id)
        if affected > 0:
            self.room_model.update_status(booking.get('room_id'), self.room_model.STATUS_OCCUPIED)

            updated_booking = self.booking_model.get_by_id(booking_id)
            return {
                'code': 0,
                'msg': '入住办理成功',
                'data': self.booking_model.to_public_dict(updated_booking)
            }

        return {
            'code': 1,
            'msg': '入住办理失败',
            'data': None
        }

    def check_out(self, booking_id: int) -> Dict[str, Any]:
        booking = self.booking_model.get_by_id(booking_id)
        if not booking:
            return {
                'code': 1,
                'msg': '预订不存在',
                'data': None
            }

        if booking.get('status') != self.booking_model.STATUS_CHECKED_IN:
            return {
                'code': 1,
                'msg': '只有已入住的预订才能办理退房',
                'data': None
            }

        affected = self.booking_model.check_out(booking_id)
        if affected > 0:
            self.room_model.update_status(booking.get('room_id'), self.room_model.STATUS_CLEANING)

            updated_booking = self.booking_model.get_by_id(booking_id)
            return {
                'code': 0,
                'msg': '退房办理成功',
                'data': self.booking_model.to_public_dict(updated_booking)
            }

        return {
            'code': 1,
            'msg': '退房办理失败',
            'data': None
        }

    def get_booking_by_id(self, booking_id: int) -> Dict[str, Any]:
        booking = self.booking_model.get_by_id(booking_id)
        if not booking:
            return {
                'code': 1,
                'msg': '预订不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.booking_model.to_public_dict(booking)
        }

    def get_my_bookings(self, user_id: int, page: int = 1, page_size: int = 10,
                        status: int = None) -> Dict[str, Any]:
        result = self.booking_model.get_by_user_id(user_id, page, page_size, status)
        items = [self.booking_model.to_public_dict(item) for item in result.get('items', [])]

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

    def get_booking_list(self, page: int = 1, page_size: int = 10, status: int = None,
                         user_id: int = None, room_id: int = None,
                         start_date: str = None, end_date: str = None,
                         keyword: str = None) -> Dict[str, Any]:
        result = self.booking_model.get_all(
            page, page_size, status, user_id, room_id,
            start_date, end_date, keyword
        )
        items = [self.booking_model.to_public_dict(item) for item in result.get('items', [])]

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

    def get_booking_status_list(self) -> Dict[str, Any]:
        statuses = [
            {'key': 0, 'label': '待确认'},
            {'key': 1, 'label': '已确认'},
            {'key': 2, 'label': '已入住'},
            {'key': 3, 'label': '已退房'},
            {'key': 4, 'label': '已取消'}
        ]
        return {
            'code': 0,
            'msg': 'success',
            'data': statuses
        }

    def delete_booking(self, booking_id: int) -> Dict[str, Any]:
        booking = self.booking_model.get_by_id(booking_id)
        if not booking:
            return {
                'code': 1,
                'msg': '预订不存在',
                'data': None
            }

        if booking.get('status') == self.booking_model.STATUS_CHECKED_IN:
            return {
                'code': 1,
                'msg': '已入住的预订无法删除，请先办理退房',
                'data': None
            }

        affected = self.booking_model.delete(booking_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '删除成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '删除失败',
            'data': None
        }
