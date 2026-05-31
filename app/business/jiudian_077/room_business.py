from typing import Dict, Any, Optional
from app.model.jiudian_077_model import RoomModel


class JiudianRoomBusiness:
    def __init__(self):
        self.room_model = RoomModel()

    def _validate_room_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        if not data.get('room_number'):
            return {'valid': False, 'msg': '房间号不能为空'}

        if not data.get('type'):
            return {'valid': False, 'msg': '房间类型不能为空'}

        if data.get('price') is None or data.get('price') < 0:
            return {'valid': False, 'msg': '价格不能为空且不能为负数'}

        return {'valid': True, 'msg': ''}

    def create_room(self, room_number: str, type: str, floor: int, price: float,
                    area: float = 0, bed_count: int = 1, max_guests: int = 2,
                    facilities: list = None, description: str = '',
                    images: list = None) -> Dict[str, Any]:
        data = {
            'room_number': room_number,
            'type': type,
            'floor': floor,
            'price': price,
            'area': area,
            'bed_count': bed_count,
            'max_guests': max_guests,
            'facilities': facilities,
            'description': description,
            'images': images
        }

        validate_result = self._validate_room_data(data)
        if not validate_result['valid']:
            return {
                'code': 1,
                'msg': validate_result['msg'],
                'data': None
            }

        existing = self.room_model.get_by_room_number(room_number)
        if existing:
            return {
                'code': 1,
                'msg': '房间号已存在',
                'data': None
            }

        facilities_str = ','.join(facilities) if facilities else ''
        images_str = ','.join(images) if images else ''

        room_id = self.room_model.create(
            room_number, type, floor, price, area,
            bed_count, max_guests, facilities_str, description, images_str
        )

        if room_id > 0:
            room = self.room_model.get_by_id(room_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.room_model.to_public_dict(room)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_room(self, room_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        room = self.room_model.get_by_id(room_id)
        if not room:
            return {
                'code': 1,
                'msg': '房间不存在',
                'data': None
            }

        validate_result = self._validate_room_data({
            'room_number': data.get('room_number', room.get('room_number')),
            'type': data.get('type', room.get('type')),
            'price': data.get('price', room.get('price'))
        })
        if not validate_result['valid']:
            return {
                'code': 1,
                'msg': validate_result['msg'],
                'data': None
            }

        room_number = data.get('room_number')
        if room_number and room_number != room.get('room_number'):
            existing = self.room_model.get_by_room_number(room_number)
            if existing:
                return {
                    'code': 1,
                    'msg': '房间号已存在',
                    'data': None
                }

        update_data = {}
        if 'room_number' in data:
            update_data['room_number'] = data['room_number']
        if 'type' in data:
            update_data['type'] = data['type']
        if 'floor' in data:
            update_data['floor'] = data['floor']
        if 'price' in data:
            update_data['price'] = data['price']
        if 'area' in data:
            update_data['area'] = data['area']
        if 'bed_count' in data:
            update_data['bed_count'] = data['bed_count']
        if 'max_guests' in data:
            update_data['max_guests'] = data['max_guests']
        if 'facilities' in data:
            update_data['facilities'] = ','.join(data['facilities']) if data['facilities'] else ''
        if 'description' in data:
            update_data['description'] = data['description']
        if 'images' in data:
            update_data['images'] = ','.join(data['images']) if data['images'] else ''
        if 'status' in data:
            update_data['status'] = data['status']

        affected = self.room_model.update(room_id, update_data)
        if affected >= 0:
            updated_room = self.room_model.get_by_id(room_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.room_model.to_public_dict(updated_room)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def update_room_status(self, room_id: int, status: int) -> Dict[str, Any]:
        room = self.room_model.get_by_id(room_id)
        if not room:
            return {
                'code': 1,
                'msg': '房间不存在',
                'data': None
            }

        affected = self.room_model.update_status(room_id, status)
        if affected > 0:
            updated_room = self.room_model.get_by_id(room_id)
            return {
                'code': 0,
                'msg': '状态更新成功',
                'data': self.room_model.to_public_dict(updated_room)
            }

        return {
            'code': 1,
            'msg': '状态更新失败',
            'data': None
        }

    def delete_room(self, room_id: int) -> Dict[str, Any]:
        room = self.room_model.get_by_id(room_id)
        if not room:
            return {
                'code': 1,
                'msg': '房间不存在',
                'data': None
            }

        from app.model.jiudian_077_model import BookingModel
        booking_model = BookingModel()
        active_bookings = booking_model.get_all(page=1, page_size=100, status=None, room_id=room_id)
        has_active = any(
            b.get('status') in [booking_model.STATUS_PENDING, booking_model.STATUS_CONFIRMED, booking_model.STATUS_CHECKED_IN]
            for b in active_bookings.get('items', [])
        )
        if has_active:
            return {
                'code': 1,
                'msg': '该房间存在未完成的预订，无法删除',
                'data': None
            }

        affected = self.room_model.delete(room_id)
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

    def get_room_by_id(self, room_id: int) -> Dict[str, Any]:
        room = self.room_model.get_by_id(room_id)
        if not room:
            return {
                'code': 1,
                'msg': '房间不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.room_model.to_public_dict(room)
        }

    def get_room_list(self, page: int = 1, page_size: int = 10, type: str = None,
                      status: int = None, min_price: float = None, max_price: float = None,
                      keyword: str = None) -> Dict[str, Any]:
        result = self.room_model.get_all(page, page_size, type, status, min_price, max_price, keyword)
        items = [self.room_model.to_public_dict(item) for item in result.get('items', [])]

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

    def get_available_rooms(self, check_in_date: str = None, check_out_date: str = None,
                            page: int = 1, page_size: int = 10, type: str = None,
                            min_price: float = None, max_price: float = None,
                            keyword: str = None) -> Dict[str, Any]:
        result = self.room_model.get_available_rooms(
            check_in_date, check_out_date, page, page_size,
            type, min_price, max_price, keyword
        )
        items = [self.room_model.to_public_dict(item) for item in result.get('items', [])]

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

    def get_room_types(self) -> Dict[str, Any]:
        types = [
            {'key': 'single', 'label': '单人间'},
            {'key': 'double', 'label': '双人间'},
            {'key': 'twin', 'label': '标准间'},
            {'key': 'suite', 'label': '套房'},
            {'key': 'family', 'label': '家庭房'},
            {'key': 'deluxe', 'label': '豪华间'}
        ]
        return {
            'code': 0,
            'msg': 'success',
            'data': types
        }

    def get_room_status_list(self) -> Dict[str, Any]:
        statuses = [
            {'key': 0, 'label': '空闲'},
            {'key': 1, 'label': '已入住'},
            {'key': 2, 'label': '维护中'},
            {'key': 3, 'label': '清洁中'}
        ]
        return {
            'code': 0,
            'msg': 'success',
            'data': statuses
        }
