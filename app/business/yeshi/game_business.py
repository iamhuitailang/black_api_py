from typing import Dict, Any, List, Optional
from app.model.yeshi import (
    GameSessionModel, WeatherModel, GuestModel,
    OrderModel, FoodModel, UserFoodModel
)
import random


class GameBusiness:
    def __init__(self):
        self.session_model = GameSessionModel()
        self.weather_model = WeatherModel()
        self.guest_model = GuestModel()
        self.order_model = OrderModel()
        self.food_model = FoodModel()
        self.user_food_model = UserFoodModel()

    def start_session(self, game_user_id: int) -> Dict[str, Any]:
        active_session = self.session_model.get_active_session(game_user_id)
        if active_session:
            return {
                'code': 1,
                'message': '当前已经在营业中，请勿重复操作',
                'data': None
            }
        
        session_id = self.session_model.create(game_user_id)
        session = self.session_model.get_by_id(session_id)
        
        weather_result = self.weather_model.generate_new_weather(game_user_id, force_change=True)
        
        return {
            'code': 0,
            'message': '开始营业',
            'data': {
                'session': session,
                'weather': weather_result.get('weather')
            }
        }

    def end_session(self, game_user_id: int, session_id: int) -> Dict[str, Any]:
        session = self.session_model.get_by_id(session_id)
        if not session or session.get('game_user_id') != game_user_id:
            return {
                'code': 1,
                'message': '营业记录不存在',
                'data': None
            }
        
        if session.get('status') != 'active':
            return {
                'code': 1,
                'message': '当前没有营业中，无法打烊',
                'data': None
            }
        
        pending_orders = self.order_model.get_pending_orders(game_user_id)
        if pending_orders:
            return {
                'code': 1,
                'message': f'还有 {len(pending_orders)} 个订单未完成，请先完成所有订单再打烊',
                'data': None
            }
        
        active_guests = self.guest_model.get_active_guests(game_user_id)
        if active_guests:
            return {
                'code': 1,
                'message': f'还有 {len(active_guests)} 位客人在等待，请先服务完所有客人再打烊',
                'data': None
            }
        
        ended_session = self.session_model.end_session(session_id)
        
        stats = {
            'orders_completed': ended_session.get('orders_completed', 0),
            'orders_failed': ended_session.get('orders_failed', 0),
            'gold_earned': ended_session.get('gold_earned', 0),
            'exp_earned': ended_session.get('exp_earned', 0),
            'duration_seconds': ended_session.get('duration_seconds', 0),
            'peak_customers': ended_session.get('peak_customers', 0)
        }
        
        return {
            'code': 0,
            'message': '营业结束',
            'data': stats
        }

    def get_active_session(self, game_user_id: int) -> Dict[str, Any]:
        session = self.session_model.get_active_session(game_user_id)
        if not session:
            return {
                'code': 1,
                'message': '没有进行中的营业',
                'data': None
            }
        
        weather = self.weather_model.get_current_weather(game_user_id)
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'session': session,
                'weather': weather
            }
        }

    def get_current_weather(self, game_user_id: int) -> Dict[str, Any]:
        weather = self.weather_model.get_current_weather(game_user_id)
        if not weather:
            result = self.weather_model.generate_new_weather(game_user_id)
            weather = result.get('weather')
        
        return {
            'code': 0,
            'message': 'success',
            'data': weather
        }

    def change_weather(self, game_user_id: int) -> Dict[str, Any]:
        result = self.weather_model.generate_new_weather(game_user_id, force_change=True)
        return {
            'code': 0,
            'message': '天气已变化',
            'data': result
        }

    def generate_guest(self, game_user_id: int, reputation: int = 0) -> Dict[str, Any]:
        active_session = self.session_model.get_active_session(game_user_id)
        if not active_session:
            return {
                'code': 1,
                'message': '请先开始营业',
                'data': None
            }
        
        active_guests = self.guest_model.get_active_guests(game_user_id)
        max_customers = 3 + active_session.get('stall_level', 1)
        if len(active_guests) >= max_customers:
            return {
                'code': 1,
                'message': '客人太多了，请先服务现有客人',
                'data': None
            }
        
        user_unlocked_foods = self.user_food_model.get_unlocked_foods_with_details(game_user_id)
        if not user_unlocked_foods:
            return {
                'code': 1,
                'message': '还没有解锁任何食物，请先解锁食物',
                'data': None
            }
        
        desired_food = random.choice(user_unlocked_foods)
        
        special_requests = self.guest_model.get_all_special_requests()
        special_request = None
        if random.random() < 0.3 and special_requests:
            special_request = random.choice(special_requests)
        
        guest = self.guest_model.generate_guest(
            game_user_id=game_user_id,
            reputation=reputation,
            session_id=active_session.get('id'),
            desired_food_id=desired_food.get('id'),
            desired_food_name=desired_food.get('name'),
            desired_food_icon=desired_food.get('icon'),
            special_request=special_request
        )
        
        return {
            'code': 0,
            'message': '新客人到来',
            'data': guest
        }

    def get_active_guests(self, game_user_id: int) -> Dict[str, Any]:
        guests = self.guest_model.get_active_guests(game_user_id)
        return {
            'code': 0,
            'message': 'success',
            'data': guests
        }

    def create_order(self, game_user_id: int, food_id: int, guest_id: int = None, special_request: Dict = None) -> Dict[str, Any]:
        active_session = self.session_model.get_active_session(game_user_id)
        if not active_session:
            return {
                'code': 1,
                'message': '请先开始营业',
                'data': None
            }
        
        if not guest_id:
            return {
                'code': 1,
                'message': '请选择客人',
                'data': None
            }
        
        guest = self.guest_model.get_by_id(guest_id)
        if not guest or guest.get('game_user_id') != game_user_id:
            return {
                'code': 1,
                'message': '客人不存在',
                'data': None
            }
        
        if guest.get('status') not in ['waiting', 'ordering']:
            return {
                'code': 1,
                'message': '该客人已离开',
                'data': None
            }
        
        if guest.get('desired_food_id') and guest.get('desired_food_id') != food_id:
            return {
                'code': 1,
                'message': f'{guest.get("name")} 想要的是 {guest.get("desired_food_name")}',
                'data': None
            }
        
        food = self.food_model.get_by_id(food_id)
        if not food:
            return {
                'code': 1,
                'message': '食物不存在',
                'data': None
            }
        
        user_food = self.user_food_model.get_by_user_and_food(game_user_id, food_id)
        if not user_food or not user_food.get('is_unlocked'):
            return {
                'code': 1,
                'message': '该食物尚未解锁',
                'data': None
            }
        
        special_request_text = guest.get('special_request_text')
        price_bonus = guest.get('special_request_price_bonus', 0)
        base_price = food.get('base_price', 0)
        final_price = int(base_price * (1 + price_bonus))
        
        order_id = self.order_model.create(
            game_user_id=game_user_id,
            food_id=food_id,
            food_name=food.get('name', ''),
            food_icon=food.get('icon', ''),
            guest_id=guest_id,
            guest_name=guest.get('name'),
            special_request=special_request_text,
            base_price=final_price,
            cook_time=food.get('cook_time', 5),
            difficulty=food.get('difficulty', 1)
        )
        
        order = self.order_model.get_by_id(order_id)
        
        self.guest_model.update_status(guest_id, 'ordered')
        
        return {
            'code': 0,
            'message': '订单创建成功',
            'data': order
        }

    def get_pending_orders(self, game_user_id: int) -> Dict[str, Any]:
        orders = self.order_model.get_pending_orders(game_user_id)
        return {
            'code': 0,
            'message': 'success',
            'data': orders
        }

    def complete_order(self, game_user_id: int, order_id: int, success: bool = True, quality: int = 80, time_spent: int = 0) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order or order.get('game_user_id') != game_user_id:
            return {
                'code': 1,
                'message': '订单不存在',
                'data': None
            }
        
        result = self.order_model.complete_order(order_id, success, quality, time_spent)
        
        session = self.session_model.get_active_session(game_user_id)
        if session:
            if success:
                self.session_model.add_order_completed(
                    session['id'],
                    result.get('gold_earned', 0),
                    result.get('experience_earned', 0)
                )
            else:
                self.session_model.add_order_failed(session['id'])
        
        return {
            'code': 0,
            'message': '订单已完成' if success else '订单失败',
            'data': result
        }

    def get_game_stats(self, game_user_id: int) -> Dict[str, Any]:
        session_stats = self.session_model.get_user_stats(game_user_id)
        order_stats = self.order_model.get_user_order_stats(game_user_id)
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'session_stats': session_stats,
                'order_stats': order_stats
            }
        }

    def get_recent_sessions(self, game_user_id: int, limit: int = 10) -> Dict[str, Any]:
        sessions = self.session_model.get_recent_sessions(game_user_id, limit)
        return {
            'code': 0,
            'message': 'success',
            'data': sessions
        }

    def get_all_weather_types(self) -> Dict[str, Any]:
        types = self.weather_model.get_all_weather_types()
        return {
            'code': 0,
            'message': 'success',
            'data': types
        }

    def get_all_guest_types(self) -> Dict[str, Any]:
        types = self.guest_model.get_all_guest_types()
        return {
            'code': 0,
            'message': 'success',
            'data': types
        }

    def get_all_special_requests(self) -> Dict[str, Any]:
        requests = self.guest_model.get_all_special_requests()
        return {
            'code': 0,
            'message': 'success',
            'data': requests
        }
