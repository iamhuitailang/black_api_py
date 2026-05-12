from datetime import datetime
from typing import Dict, Any, List, Optional
from app.model.order.order import OrderModel
from app.model.order.order_detail import OrderDetailModel
from app.model.order.verify_log import VerifyLogModel
from app.model.order.cancel_log import CancelLogModel
from app.model.order.dish import DishModel


class OrderBusiness:
    def __init__(self):
        self.order_model = OrderModel()
        self.order_detail_model = OrderDetailModel()
        self.verify_log_model = VerifyLogModel()
        self.cancel_log_model = CancelLogModel()
        self.dish_model = DishModel()

    def create(self, user_id: int, menu_date: str, meal_type: str,
               items: List[Dict[str, Any]], remark: str = '') -> Dict[str, Any]:
        if not user_id:
            return {
                'code': 1,
                'msg': '用户ID不能为空',
                'data': None
            }

        if not menu_date:
            return {
                'code': 1,
                'msg': '请选择日期',
                'data': None
            }

        if not meal_type:
            return {
                'code': 1,
                'msg': '请选择餐段',
                'data': None
            }

        if not items or len(items) == 0:
            return {
                'code': 1,
                'msg': '请选择菜品',
                'data': None
            }

        total_amount = 0
        order_details = []
        for item in items:
            dish = self.dish_model.get_by_id(item['dish_id'])
            if not dish:
                return {
                    'code': 1,
                    'msg': f"菜品ID {item['dish_id']} 不存在",
                    'data': None
                }
            price = dish['price']
            quantity = item['quantity']
            total_amount += price * quantity
            order_details.append({
                'dish_id': item['dish_id'],
                'quantity': quantity,
                'price': price,
                'remark': item.get('remark', '')
            })

        order_result = self.order_model.create(
            user_id=user_id,
            menu_date=menu_date,
            meal_type=meal_type,
            total_amount=total_amount,
            remark=remark
        )

        if order_result and order_result['id'] > 0:
            order_id = order_result['id']
            self.order_detail_model.batch_create(order_id, order_details)

            for item in items:
                self.dish_model.increment_sold_count(item['dish_id'], item['quantity'])

            order = self.order_model.get_by_id(order_id)
            details = self.order_model.get_order_details(order_id)
            return {
                'code': 0,
                'msg': '下单成功',
                'data': {
                    'order': order,
                    'details': details
                }
            }

        return {
            'code': 1,
            'msg': '下单失败',
            'data': None
        }

    def cancel(self, order_id: int, user_id: int, reason: str = '') -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {
                'code': 1,
                'msg': '订单不存在',
                'data': None
            }

        if order['status'] != self.order_model.STATUS_PENDING:
            return {
                'code': 1,
                'msg': '订单状态不允许取消',
                'data': None
            }

        cancel_deadline = datetime.fromisoformat(order['cancel_deadline'])
        if datetime.now() > cancel_deadline:
            return {
                'code': 1,
                'msg': '已超过取消时限',
                'data': None
            }

        affected = self.order_model.cancel(order_id)
        if affected > 0:
            self.cancel_log_model.create(order_id, user_id, reason)
            return {
                'code': 0,
                'msg': '取消成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '取消失败',
            'data': None
        }

    def verify(self, qrcode: str, verified_by: int) -> Dict[str, Any]:
        order = self.order_model.get_by_qrcode(qrcode)
        if not order:
            return {
                'code': 1,
                'msg': '订单不存在',
                'data': None
            }

        if order['status'] == self.order_model.STATUS_CANCELLED:
            return {
                'code': 1,
                'msg': '订单已取消',
                'data': None
            }

        if order['status'] == self.order_model.STATUS_COMPLETED:
            return {
                'code': 1,
                'msg': '订单已核销',
                'data': None
            }

        affected = self.order_model.verify(order['id'], verified_by)
        if affected > 0:
            self.verify_log_model.create(qrcode, order['id'], verified_by)
            return {
                'code': 0,
                'msg': '核销成功',
                'data': {
                    'order': order
                }
            }

        return {
            'code': 1,
            'msg': '核销失败',
            'data': None
        }

    def get_by_id(self, order_id: int) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {
                'code': 1,
                'msg': '订单不存在',
                'data': None
            }

        details = self.order_model.get_order_details(order_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'order': order,
                'details': details
            }
        }

    def get_by_qrcode(self, qrcode: str) -> Dict[str, Any]:
        order = self.order_model.get_by_qrcode(qrcode)
        if not order:
            return {
                'code': 1,
                'msg': '订单不存在',
                'data': None
            }

        details = self.order_model.get_order_details(order['id'])
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'order': order,
                'details': details
            }
        }

    def get_by_user_id(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.order_model.get_by_user_id(user_id, page, page_size)
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_all(self, page: int = 1, page_size: int = 10, status: str = None,
                menu_date: str = None, meal_type: str = None, user_id: int = None) -> Dict[str, Any]:
        result = self.order_model.get_all(page, page_size, status, menu_date, meal_type, user_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def reorder(self, order_id: int, user_id: int) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {
                'code': 1,
                'msg': '订单不存在',
                'data': None
            }

        details = self.order_detail_model.get_by_order_id(order_id)
        if not details or len(details) == 0:
            return {
                'code': 1,
                'msg': '订单详情为空',
                'data': None
            }

        items = []
        for detail in details:
            items.append({
                'dish_id': detail['dish_id'],
                'quantity': detail['quantity'],
                'remark': detail.get('remark', '')
            })

        return self.create(
            user_id=user_id,
            menu_date=order['menu_date'],
            meal_type=order['meal_type'],
            items=items,
            remark=order.get('remark', '')
        )