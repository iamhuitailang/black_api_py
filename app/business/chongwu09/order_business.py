from typing import Dict, Any
from app.model.chongwu09 import OrderModel, BookingModel, NotificationModel


class OrderBusiness:
    def __init__(self):
        self.order_model = OrderModel()
        self.booking_model = BookingModel()
        self.notification_model = NotificationModel()

    def create_order(self, user_id: int, service_id: int, booking_id: int,
                     pet_id: int, amount: float, days: int = 1) -> Dict[str, Any]:
        existing = self.order_model.query.find_one({'booking_id': booking_id})
        if existing:
            return {'code': 1, 'msg': '该预约已创建订单', 'data': None}
        order_id = self.order_model.create(
            user_id, service_id, booking_id, pet_id, amount, days
        )
        if order_id > 0:
            order = self.order_model.get_by_id(order_id)
            return {'code': 0, 'msg': '创建成功', 'data': self.order_model.to_dict(order)}
        return {'code': 1, 'msg': '创建失败', 'data': None}

    def get_order(self, order_id: int) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {'code': 1, 'msg': '订单不存在', 'data': None}
        return {'code': 0, 'msg': 'success', 'data': self.order_model.to_dict(order)}

    def pay_order(self, order_id: int, user_id: int) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {'code': 1, 'msg': '订单不存在', 'data': None}
        if order.get('user_id') != user_id:
            return {'code': 1, 'msg': '无权操作', 'data': None}
        if order.get('status') != OrderModel.STATUS_UNPAID:
            return {'code': 1, 'msg': '当前状态不可支付', 'data': None}
        affected = self.order_model.update_status(order_id, OrderModel.STATUS_PAID)
        if affected > 0:
            self.notification_model.create(
                user_id=user_id,
                title='支付成功',
                content=f'订单 {order.get("order_no")} 支付成功。',
                notification_type='order',
                related_id=order_id
            )
            return {'code': 0, 'msg': '支付成功', 'data': None}
        return {'code': 1, 'msg': '支付失败', 'data': None}

    def cancel_order(self, order_id: int, user_id: int) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {'code': 1, 'msg': '订单不存在', 'data': None}
        if order.get('user_id') != user_id:
            return {'code': 1, 'msg': '无权操作', 'data': None}
        if order.get('status') not in [OrderModel.STATUS_UNPAID]:
            return {'code': 1, 'msg': '当前状态不可取消', 'data': None}
        affected = self.order_model.update_status(order_id, OrderModel.STATUS_CANCELLED)
        if affected > 0:
            return {'code': 0, 'msg': '取消成功', 'data': None}
        return {'code': 1, 'msg': '取消失败', 'data': None}

    def get_my_orders(self, user_id: int, page: int = 1, page_size: int = 10,
                      status: int = None) -> Dict[str, Any]:
        result = self.order_model.get_by_user(user_id, page, page_size, status)
        items = [self._enrich_order(item) for item in result.get('items', [])]
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

    def get_all_orders(self, page: int = 1, page_size: int = 10,
                       status: int = None, keyword: str = None) -> Dict[str, Any]:
        result = self.order_model.get_all(page, page_size, status, keyword)
        items = [self._enrich_order(item) for item in result.get('items', [])]
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

    def process_order(self, order_id: int, status: int) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {'code': 1, 'msg': '订单不存在', 'data': None}
        affected = self.order_model.update_status(order_id, status)
        if affected > 0:
            updated_order = self.order_model.get_by_id(order_id)
            return {'code': 0, 'msg': '操作成功', 'data': self.order_model.to_dict(updated_order)}
        return {'code': 1, 'msg': '操作失败', 'data': None}

    def _enrich_order(self, order: Dict[str, Any]) -> Dict[str, Any]:
        result = self.order_model.to_dict(order)
        from app.model.chongwu09 import ServiceModel, PetModel, UserModel
        service_model = ServiceModel()
        service = service_model.get_by_id(order.get('service_id'))
        if service:
            result['service'] = service_model.to_dict(service)
        pet_model = PetModel()
        pet = pet_model.get_by_id(order.get('pet_id'))
        if pet:
            result['pet'] = pet_model.to_dict(pet)
        user_model = UserModel()
        user = user_model.get_by_id(order.get('user_id'))
        if user:
            result['user'] = user_model.to_public_dict(user)
        return result
