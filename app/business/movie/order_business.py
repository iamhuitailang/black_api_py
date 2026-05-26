from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from app.model.movie import OrderModel, ShowtimeModel, MovieModel, UserModel
import json


class OrderBusiness:
    def __init__(self):
        self.order_model = OrderModel()
        self.showtime_model = ShowtimeModel()
        self.movie_model = MovieModel()
        self.user_model = UserModel()

    def _enrich_order(self, order: Dict[str, Any]) -> Dict[str, Any]:
        order['status_text'] = self.order_model.get_status_text(order.get('status', 0))
        order['seats'] = json.loads(order.get('seats', '[]')) if isinstance(order.get('seats'), str) else order.get('seats', [])

        showtime_id = order.get('showtime_id')
        if showtime_id:
            showtime = self.showtime_model.get_by_id(showtime_id)
            if showtime:
                order['showtime'] = {
                    'hall_name': showtime.get('hall_name', ''),
                    'show_date': showtime.get('show_date', ''),
                    'show_time': showtime.get('show_time', ''),
                    'price': showtime.get('price', 0)
                }
                movie_id = showtime.get('movie_id')
                if movie_id:
                    movie = self.movie_model.get_by_id(movie_id)
                    if movie:
                        order['movie'] = {
                            'title': movie.get('title', ''),
                            'poster': movie.get('poster', '')
                        }

        user_id = order.get('user_id')
        if user_id:
            user = self.user_model.get_by_id(user_id)
            if user:
                order['user'] = {
                    'username': user.get('username', ''),
                    'nickname': user.get('nickname', '')
                }

        return order

    def create_order(self, user_id: int, showtime_id: int,
                     seats: list) -> Dict[str, Any]:
        showtime = self.showtime_model.get_by_id(showtime_id)
        if not showtime:
            return {'code': 1, 'msg': '场次不存在', 'data': None}

        if showtime.get('status') != ShowtimeModel.STATUS_ACTIVE:
            return {'code': 1, 'msg': '该场次已关闭', 'data': None}

        if len(seats) == 0:
            return {'code': 1, 'msg': '请选择座位', 'data': None}

        if len(seats) > showtime.get('available_seats', 0):
            return {'code': 1, 'msg': '剩余座位不足', 'data': None}

        price = showtime.get('price', 0)
        total_amount = round(price * len(seats), 2)

        order_id = self.order_model.create(
            user_id=user_id,
            showtime_id=showtime_id,
            seats=seats,
            total_amount=total_amount
        )
        if order_id > 0:
            self.showtime_model.update_available_seats(showtime_id, -len(seats))
            order = self.order_model.get_by_id(order_id)
            return {
                'code': 0,
                'msg': '下单成功',
                'data': self._enrich_order(order)
            }

        return {'code': 1, 'msg': '下单失败', 'data': None}

    def pay_order(self, order_id: int, user_id: int) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {'code': 1, 'msg': '订单不存在', 'data': None}

        if order.get('user_id') != user_id:
            return {'code': 1, 'msg': '无权操作此订单', 'data': None}

        if order.get('status') != OrderModel.STATUS_PENDING:
            return {'code': 1, 'msg': '订单状态不正确', 'data': None}

        affected = self.order_model.update_status(order_id, OrderModel.STATUS_PAID)
        if affected > 0:
            return {'code': 0, 'msg': '支付成功', 'data': None}

        return {'code': 1, 'msg': '支付失败', 'data': None}

    def cancel_order(self, order_id: int, user_id: int) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {'code': 1, 'msg': '订单不存在', 'data': None}

        if order.get('user_id') != user_id:
            return {'code': 1, 'msg': '无权操作此订单', 'data': None}

        if order.get('status') not in [OrderModel.STATUS_PENDING, OrderModel.STATUS_PAID]:
            return {'code': 1, 'msg': '订单状态不允许取消', 'data': None}

        showtime_id = order.get('showtime_id')
        seats = json.loads(order.get('seats', '[]')) if isinstance(order.get('seats'), str) else order.get('seats', [])

        affected = self.order_model.update_status(order_id, OrderModel.STATUS_CANCELLED)
        if affected > 0:
            if showtime_id and seats:
                self.showtime_model.update_available_seats(showtime_id, len(seats))
            return {'code': 0, 'msg': '取消成功', 'data': None}

        return {'code': 1, 'msg': '取消失败', 'data': None}

    def verify_order(self, order_id: int) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {'code': 1, 'msg': '订单不存在', 'data': None}

        if order.get('status') != OrderModel.STATUS_PAID:
            return {'code': 1, 'msg': '订单状态不允许核销', 'data': None}

        affected = self.order_model.update_status(order_id, OrderModel.STATUS_VERIFIED)
        if affected > 0:
            return {'code': 0, 'msg': '核销成功', 'data': None}

        return {'code': 1, 'msg': '核销失败', 'data': None}

    def get_order_detail(self, order_id: int, user_id: int = None) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {'code': 1, 'msg': '订单不存在', 'data': None}

        if user_id and order.get('user_id') != user_id:
            return {'code': 1, 'msg': '无权查看此订单', 'data': None}

        return {'code': 0, 'msg': 'success', 'data': self._enrich_order(order)}

    def get_my_orders(self, user_id: int, page: int = 1,
                      page_size: int = 10, status: int = None) -> Dict[str, Any]:
        result = self.order_model.get_by_user_id(user_id, page, page_size, status)
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

    def get_order_by_no(self, order_no: str) -> Dict[str, Any]:
        order = self.order_model.get_by_order_no(order_no)
        if not order:
            return {'code': 1, 'msg': '订单不存在', 'data': None}

        return {'code': 0, 'msg': 'success', 'data': self._enrich_order(order)}