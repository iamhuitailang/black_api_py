from typing import Dict, Any, List, Optional
from app.model.yeshi import OrderModel, FoodModel, GameUserModel, GameSessionModel


class OrderBusiness:
    def __init__(self):
        self.order_model = OrderModel()
        self.food_model = FoodModel()
        self.game_user_model = GameUserModel()
        self.session_model = GameSessionModel()

    def create_order(self, game_user_id: int, food_id: int, **kwargs) -> Dict[str, Any]:
        food = self.food_model.get_by_id(food_id)
        if not food:
            return {
                'code': 1,
                'message': '食物不存在',
                'data': None
            }
        
        order_id = self.order_model.create(
            game_user_id=game_user_id,
            food_id=food_id,
            food_name=food.get('name', ''),
            food_icon=food.get('icon', ''),
            base_price=food.get('base_price', 0),
            cook_time=food.get('cook_time', 5),
            difficulty=food.get('difficulty', 1),
            **kwargs
        )
        
        order = self.order_model.get_by_id(order_id)
        
        return {
            'code': 0,
            'message': '订单创建成功',
            'data': order
        }

    def get_order_by_id(self, order_id: int) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {
                'code': 1,
                'message': '订单不存在',
                'data': None
            }
        return {
            'code': 0,
            'message': 'success',
            'data': order
        }

    def get_user_orders(self, game_user_id: int, status: str = None, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        orders = self.order_model.get_by_user_id(game_user_id, status)
        start = (page - 1) * page_size
        end = start + page_size
        paginated_orders = orders[start:end]
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'list': paginated_orders,
                'total': len(orders),
                'page': page,
                'page_size': page_size
            }
        }

    def get_pending_orders(self, game_user_id: int) -> Dict[str, Any]:
        orders = self.order_model.get_pending_orders(game_user_id)
        return {
            'code': 0,
            'message': 'success',
            'data': orders
        }

    def start_cooking(self, game_user_id: int, order_id: int) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order or order.get('game_user_id') != game_user_id:
            return {
                'code': 1,
                'message': '订单不存在',
                'data': None
            }
        
        if order.get('status') != 'pending':
            return {
                'code': 1,
                'message': '订单状态不正确',
                'data': None
            }
        
        self.order_model.start_cooking(order_id)
        order = self.order_model.get_by_id(order_id)
        
        return {
            'code': 0,
            'message': '开始烹饪',
            'data': order
        }

    def complete_order(self, game_user_id: int, order_id: int, success: bool = True, quality: int = 80, time_spent: int = 0) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order or order.get('game_user_id') != game_user_id:
            return {
                'code': 1,
                'message': '订单不存在',
                'data': None
            }
        
        if order.get('status') not in ['pending', 'cooking']:
            return {
                'code': 1,
                'message': '订单状态不正确',
                'data': None
            }
        
        result = self.order_model.complete_order(order_id, success, quality, time_spent)
        
        if success:
            gold_earned = result.get('gold_earned', 0)
            exp_earned = result.get('experience_earned', 0)
            
            self.game_user_model.add_gold(game_user_id, gold_earned)
            self.game_user_model.add_experience(game_user_id, exp_earned)
            self.game_user_model.record_order(game_user_id, gold_earned)
            
            if quality >= 90:
                self.game_user_model.add_reputation(game_user_id, 5)
            elif quality >= 70:
                self.game_user_model.add_reputation(game_user_id, 3)
            else:
                self.game_user_model.add_reputation(game_user_id, 1)
            
            session = self.session_model.get_active_session(game_user_id)
            if session:
                self.session_model.add_order_completed(session['id'], gold_earned, exp_earned)
        else:
            self.game_user_model.add_reputation(game_user_id, -2)
            
            session = self.session_model.get_active_session(game_user_id)
            if session:
                self.session_model.add_order_failed(session['id'])
        
        return {
            'code': 0,
            'message': '订单完成' if success else '订单失败',
            'data': result
        }

    def cancel_order(self, game_user_id: int, order_id: int) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order or order.get('game_user_id') != game_user_id:
            return {
                'code': 1,
                'message': '订单不存在',
                'data': None
            }
        
        if order.get('status') == 'completed':
            return {
                'code': 1,
                'message': '已完成的订单无法取消',
                'data': None
            }
        
        self.order_model.cancel_order(order_id)
        
        return {
            'code': 0,
            'message': '订单已取消',
            'data': None
        }

    def get_order_stats(self, game_user_id: int) -> Dict[str, Any]:
        stats = self.order_model.get_user_order_stats(game_user_id)
        return {
            'code': 0,
            'message': 'success',
            'data': stats
        }

    def get_recent_orders(self, game_user_id: int, limit: int = 10) -> Dict[str, Any]:
        orders = self.order_model.get_recent_orders(game_user_id, limit)
        return {
            'code': 0,
            'message': 'success',
            'data': orders
        }
