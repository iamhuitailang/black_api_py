from typing import Dict, Any, List, Optional
from app.model.feipin import OrderModel, UserModel, CategoryModel, ReviewModel
from datetime import datetime


class FeipinOrderBusiness:
    def __init__(self):
        self.order_model = OrderModel()
        self.user_model = UserModel()
        self.category_model = CategoryModel()
        self.review_model = ReviewModel()

    def create_order(self, user_id: int, category_id: int, weight: float,
                     address: str, contact_name: str = '', contact_phone: str = '',
                     photos: List[str] = None, schedule_time: str = '',
                     note: str = '') -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        category = self.category_model.get_by_id(category_id)
        if not category:
            return {
                'code': 1,
                'msg': '废品种类不存在',
                'data': None
            }

        if weight <= 0:
            return {
                'code': 1,
                'msg': '重量必须大于0',
                'data': None
            }

        if not address:
            return {
                'code': 1,
                'msg': '地址不能为空',
                'data': None
            }

        price_per_kg = category.get('price', 0.0)
        total_price = price_per_kg * weight

        order_id = self.order_model.create(
            user_id=user_id,
            category_id=category_id,
            weight=weight,
            address=address,
            contact_name=contact_name,
            contact_phone=contact_phone,
            photos=photos,
            schedule_time=schedule_time,
            total_price=total_price,
            note=note
        )

        if order_id > 0:
            order = self.order_model.get_by_id(order_id)
            order_dict = self._enrich_order(order)
            return {
                'code': 0,
                'msg': '下单成功',
                'data': order_dict
            }

        return {
            'code': 1,
            'msg': '下单失败',
            'data': None
        }

    def _enrich_order(self, order: Dict[str, Any]) -> Dict[str, Any]:
        if not order:
            return None

        order_dict = self.order_model.to_dict(order)

        category = self.category_model.get_by_id(order.get('category_id'))
        if category:
            order_dict['category'] = self.category_model.to_dict(category)

        user = self.user_model.get_by_id(order.get('user_id'))
        if user:
            order_dict['user'] = {
                'id': user.get('id'),
                'nickname': user.get('nickname'),
                'phone': user.get('phone'),
                'avatar': user.get('avatar')
            }

        collector_id = order.get('collector_id')
        if collector_id:
            collector = self.user_model.get_by_id(collector_id)
            if collector:
                order_dict['collector'] = {
                    'id': collector.get('id'),
                    'nickname': collector.get('nickname'),
                    'phone': collector.get('phone'),
                    'avatar': collector.get('avatar')
                }
                rating = self.review_model.get_collector_rating(collector_id)
                order_dict['collector']['rating'] = rating

        review = self.review_model.get_by_order_id(order.get('id'))
        if review:
            order_dict['review'] = self.review_model.to_dict(review)

        return order_dict

    def get_order_by_id(self, order_id: int) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {
                'code': 1,
                'msg': '订单不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self._enrich_order(order)
        }

    def get_user_orders(self, user_id: int, page: int = 1, page_size: int = 10,
                        status: str = None) -> Dict[str, Any]:
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

    def get_collector_orders(self, collector_id: int, page: int = 1, page_size: int = 10,
                              status: str = None) -> Dict[str, Any]:
        result = self.order_model.get_by_collector_id(collector_id, page, page_size, status)
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

    def get_pending_orders(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.order_model.get_pending_orders(page, page_size)
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
                       status: str = None, keyword: str = None) -> Dict[str, Any]:
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

    def accept_order(self, order_id: int, collector_id: int) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {
                'code': 1,
                'msg': '订单不存在',
                'data': None
            }

        if order.get('status') != OrderModel.STATUS_PENDING:
            return {
                'code': 1,
                'msg': '订单状态不正确，无法接单',
                'data': None
            }

        collector = self.user_model.get_by_id(collector_id)
        if not collector:
            return {
                'code': 1,
                'msg': '回收员不存在',
                'data': None
            }

        if collector.get('role') != UserModel.ROLE_COLLECTOR:
            return {
                'code': 1,
                'msg': '您不是回收员，无法接单',
                'data': None
            }

        if collector.get('status') != UserModel.STATUS_ACTIVE:
            return {
                'code': 1,
                'msg': '您的账号尚未通过审核或已被禁用',
                'data': None
            }

        affected = self.order_model.accept_order(order_id, collector_id)
        if affected > 0:
            updated_order = self.order_model.get_by_id(order_id)
            return {
                'code': 0,
                'msg': '接单成功',
                'data': self._enrich_order(updated_order)
            }

        return {
            'code': 1,
            'msg': '接单失败',
            'data': None
        }

    def complete_order(self, order_id: int, collector_id: int,
                       actual_price: float = None) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {
                'code': 1,
                'msg': '订单不存在',
                'data': None
            }

        if order.get('status') != OrderModel.STATUS_ACCEPTED:
            return {
                'code': 1,
                'msg': '订单状态不正确，无法完成',
                'data': None
            }

        if order.get('collector_id') != collector_id:
            return {
                'code': 1,
                'msg': '您不是该订单的回收员',
                'data': None
            }

        final_price = actual_price if actual_price is not None else order.get('total_price')

        affected = self.order_model.complete_order(order_id, final_price)
        if affected > 0:
            if final_price > 0:
                self.user_model.update_balance(collector_id, final_price)

            updated_order = self.order_model.get_by_id(order_id)
            return {
                'code': 0,
                'msg': '订单完成成功',
                'data': self._enrich_order(updated_order)
            }

        return {
            'code': 1,
            'msg': '订单完成失败',
            'data': None
        }

    def cancel_order(self, order_id: int, user_id: int) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {
                'code': 1,
                'msg': '订单不存在',
                'data': None
            }

        if order.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '您不是该订单的创建者',
                'data': None
            }

        if order.get('status') not in [OrderModel.STATUS_PENDING, OrderModel.STATUS_ACCEPTED]:
            return {
                'code': 1,
                'msg': '订单状态不正确，无法取消',
                'data': None
            }

        affected = self.order_model.cancel_order(order_id)
        if affected > 0:
            updated_order = self.order_model.get_by_id(order_id)
            return {
                'code': 0,
                'msg': '订单取消成功',
                'data': self._enrich_order(updated_order)
            }

        return {
            'code': 1,
            'msg': '订单取消失败',
            'data': None
        }

    def get_user_income(self, user_id: int) -> Dict[str, Any]:
        income = self.order_model.get_user_income(user_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_income': income
            }
        }

    def get_collector_income(self, collector_id: int) -> Dict[str, Any]:
        income = self.order_model.get_collector_income(collector_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_income': income
            }
        }

    def get_collector_monthly_stats(self, collector_id: int, year: int = None, month: int = None) -> Dict[str, Any]:
        if year is None:
            year = datetime.now().year
        if month is None:
            month = datetime.now().month

        stats = self.order_model.get_collector_monthly_stats(collector_id, year, month)
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'year': year,
                'month': month,
                'order_count': stats.get('order_count', 0),
                'total_income': stats.get('total_income', 0.0)
            }
        }

    def get_statistics(self) -> Dict[str, Any]:
        stats = self.order_model.get_statistics()
        return {
            'code': 0,
            'msg': 'success',
            'data': stats
        }
