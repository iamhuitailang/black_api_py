from typing import Dict, Any, List, Optional
import random
from app.model.maomi_model import OrderModel, DrinkModel, CatModel, UserProfileModel, GameRecordModel


class OrderBusiness:
    def __init__(self):
        self.model = OrderModel()
        self.drink_model = DrinkModel()
        self.cat_model = CatModel()
        self.user_profile_model = UserProfileModel()
        self.record_model = GameRecordModel()

    def get_all_orders(self, user_id: int, limit: int = 20) -> Dict[str, Any]:
        try:
            orders = self.model.get_by_user_id(user_id, limit)
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'items': orders,
                    'count': len(orders)
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_pending_orders(self, user_id: int) -> Dict[str, Any]:
        try:
            orders = self.model.get_pending_orders(user_id)
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'items': orders,
                    'count': len(orders)
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_completed_orders(self, user_id: int, limit: int = 50) -> Dict[str, Any]:
        try:
            orders = self.model.get_completed_orders(user_id, limit)
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'items': orders,
                    'count': len(orders)
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_order(self, order_id: int) -> Dict[str, Any]:
        order = self.model.get_by_id(order_id)
        if order:
            return {
                'code': 0,
                'message': 'success',
                'data': order
            }
        return {
            'code': 1,
            'message': '订单不存在',
            'data': None
        }

    def generate_order(self, user_id: int, customer_name: str, drink_ids: List[int],
                    cat_id: int = 0, is_special: int = 0, activity_id: int = 0) -> Dict[str, Any]:
        if not drink_ids:
            return {
                'code': 1,
                'message': '请选择饮品',
                'data': None
            }

        drinks = []
        total_amount = 0
        for drink_id in drink_ids:
            drink = self.drink_model.get_by_id(drink_id)
            if drink and drink.get('user_id') == user_id and drink.get('is_available', 0) == 1:
                drinks.append(drink)
                total_amount += drink.get('price', 0)

        if not drinks:
            return {
                'code': 1,
                'message': '所选饮品不可用',
                'data': None
            }

        cat_name = ''
        if cat_id > 0:
            cat = self.cat_model.get_by_id(cat_id)
            if cat and cat.get('user_id') == user_id:
                cat_name = cat.get('name', '')

        drink_ids_str = ','.join([str(d.get('id')) for d in drinks])
        drink_names_str = ','.join([d.get('name', '') for d in drinks])

        try:
            order_id = self.model.create(
                user_id=user_id,
                customer_name=customer_name,
                drink_ids=drink_ids_str,
                drink_names=drink_names_str,
                total_amount=total_amount,
                cat_id=cat_id,
                cat_name=cat_name,
                is_special=is_special,
                activity_id=activity_id
            )

            for drink in drinks:
                self.drink_model.update_stock(drink.get('id'), -1)
                self.drink_model.update_popularity(drink.get('id'), 1)

            return self.get_order(order_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def complete_order(self, user_id: int, order_id: int) -> Dict[str, Any]:
        order = self.model.get_by_id(order_id)
        if not order:
            return {
                'code': 1,
                'message': '订单不存在',
                'data': None
            }
        if order.get('user_id') != user_id:
            return {
                'code': 1,
                'message': '无权限操作此订单',
                'data': None
            }
        if order.get('status') != 'pending':
            return {
                'code': 1,
                'message': '订单状态不正确',
                'data': None
            }

        cat_cuteness = 0
        cat_id = order.get('cat_id', 0)
        if cat_id > 0:
            cat = self.cat_model.get_by_id(cat_id)
            if cat:
                cat_cuteness = cat.get('cuteness', 0)

        base_tip = int(order.get('total_amount', 0) * 0.1)
        cuteness_bonus = int(cat_cuteness * 0.5)
        tip_amount = base_tip + cuteness_bonus
        satisfaction = min(100, 70 + random.randint(0, 30))

        try:
            order = self.model.complete_order(order_id, tip_amount, satisfaction)

            total_income = order.get('total_amount', 0) + tip_amount

            self.user_profile_model.add_coins(user_id, total_income)
            self.user_profile_model.add_experience(user_id, 20)

            profile = self.user_profile_model.get_by_user_id(user_id)
            if profile:
                new_total_customers = profile.get('total_customers', 0) + 1
                new_total_income = profile.get('total_income', 0) + total_income
                self.user_profile_model.update(profile.get('id'),
                                              total_customers=new_total_customers,
                                              total_income=new_total_income)

            self.record_model.add_order_record(user_id, order.get('order_no', ''),
                                        order.get('total_amount', 0), tip_amount)

            return {
                'code': 0,
                'message': '订单完成',
                'data': {
                    'order': order,
                    'tip_amount': tip_amount,
                    'satisfaction': satisfaction,
                    'total_income': total_income
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def cancel_order(self, user_id: int, order_id: int) -> Dict[str, Any]:
        order = self.model.get_by_id(order_id)
        if not order:
            return {
                'code': 1,
                'message': '订单不存在',
                'data': None
            }
        if order.get('user_id') != user_id:
            return {
                'code': 1,
                'message': '无权限操作此订单',
                'data': None
            }
        if order.get('status') != 'pending':
            return {
                'code': 1,
                'message': '订单状态不正确',
                'data': None
            }
        try:
            order = self.model.cancel_order(order_id)
            if order:
                return {
                    'code': 0,
                    'message': '订单已取消',
                    'data': order
                }
            return {
                'code': 1,
                'message': '取消失败',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_statistics(self, user_id: int) -> Dict[str, Any]:
        try:
            stats = self.model.get_statistics(user_id)
            return {
                'code': 0,
                'message': 'success',
                'data': stats
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def generate_random_order(self, user_id: int) -> Dict[str, Any]:
        names = ['小明', '小红', '阿强', '美美', '大叔', '阿姨', '学生', '上班族']
        customer_name = random.choice(names)

        available_drinks = self.drink_model.get_available(user_id)
        if not available_drinks:
            return {
                'code': 1,
                'message': '没有可用的饮品',
                'data': None
            }

        num_drinks = random.randint(1, min(3, len(available_drinks)))
        selected_drinks = random.sample(available_drinks, num_drinks)
        drink_ids = [d.get('id') for d in selected_drinks]

        cats = self.cat_model.get_all_active(user_id)
        cat_id = 0
        if cats and random.random() > 0.3:
            selected_cat = random.choice(cats)
            cat_id = selected_cat.get('id')

        return self.generate_order(user_id, customer_name, drink_ids, cat_id)
