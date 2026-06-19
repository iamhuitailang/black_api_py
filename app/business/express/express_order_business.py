from typing import Dict, Any, Optional
from datetime import datetime
from app.model.express import ExpressOrderModel, OrderStatus
from app.model.express import UserProfileModel


class ExpressOrderBusiness:
    def __init__(self):
        self.order_model = ExpressOrderModel()
        self.profile_model = UserProfileModel()
    
    def _format_order(self, order: Dict[str, Any]) -> Dict[str, Any]:
        if not order:
            return None
        
        status_map = {
            OrderStatus.PENDING.value: 'pending',
            OrderStatus.ACCEPTED.value: 'accepted',
            OrderStatus.PICKED_UP.value: 'picked_up',
            OrderStatus.DELIVERED.value: 'delivered',
            OrderStatus.CANCELLED.value: 'cancelled'
        }
        
        status_text_map = {
            OrderStatus.PENDING.value: '待接单',
            OrderStatus.ACCEPTED.value: '已接单',
            OrderStatus.PICKED_UP.value: '已取件',
            OrderStatus.DELIVERED.value: '已送达',
            OrderStatus.CANCELLED.value: '已取消'
        }
        
        status = order.get('status', 0)
        
        return {
            'id': order.get('id'),
            'publisher_id': order.get('publisher_id'),
            'taker_id': order.get('taker_id'),
            'courier_company': order.get('courier_company'),
            'pickup_location': order.get('pickup_location'),
            'estimated_arrival': order.get('estimated_arrival'),
            'pickup_deadline': order.get('pickup_deadline'),
            'reward': order.get('reward'),
            'pickup_code': order.get('pickup_code'),
            'remark': order.get('remark'),
            'status': status_map.get(status, 'pending'),
            'status_text': status_text_map.get(status, '未知'),
            'publisher_nickname': order.get('publisher_nickname'),
            'publisher_avatar': order.get('publisher_avatar'),
            'publisher_reputation': order.get('publisher_reputation'),
            'taker_nickname': order.get('taker_nickname'),
            'taker_avatar': order.get('taker_avatar'),
            'taker_reputation': order.get('taker_reputation'),
            'accepted_at': order.get('accepted_at'),
            'picked_up_at': order.get('picked_up_at'),
            'delivered_at': order.get('delivered_at'),
            'created_at': order.get('created_at'),
            'updated_at': order.get('updated_at')
        }
    
    def create_order(self, publisher_id: int, courier_company: str, pickup_location: str,
                     estimated_arrival: str, pickup_deadline: str, reward: float,
                     pickup_code: str = '', remark: str = '') -> Dict[str, Any]:
        if not publisher_id or publisher_id <= 0:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        
        if not courier_company or not courier_company.strip():
            return {
                'code': 1,
                'message': '请填写快递公司',
                'data': None
            }
        
        if not pickup_location or not pickup_location.strip():
            return {
                'code': 1,
                'message': '请填写取件地点',
                'data': None
            }
        
        if not estimated_arrival:
            return {
                'code': 1,
                'message': '请填写预计到达时间',
                'data': None
            }
        
        if not pickup_deadline:
            return {
                'code': 1,
                'message': '请填写取件截止时间',
                'data': None
            }
        
        if reward is None or reward < 0:
            return {
                'code': 1,
                'message': '请填写有效的报酬金额',
                'data': None
            }
        
        try:
            est_dt = datetime.fromisoformat(estimated_arrival.replace('Z', '+00:00'))
            deadline_dt = datetime.fromisoformat(pickup_deadline.replace('Z', '+00:00'))
            
            if deadline_dt <= est_dt:
                return {
                    'code': 1,
                    'message': '取件截止时间必须晚于预计到达时间',
                    'data': None
                }
        except (ValueError, TypeError):
            return {
                'code': 1,
                'message': '时间格式不正确',
                'data': None
            }
        
        self.profile_model.get_or_create_profile(publisher_id)
        
        try:
            order_id = self.order_model.create_order(
                publisher_id=publisher_id,
                courier_company=courier_company.strip(),
                pickup_location=pickup_location.strip(),
                estimated_arrival=estimated_arrival,
                pickup_deadline=pickup_deadline,
                reward=float(reward),
                pickup_code=pickup_code or '',
                remark=remark or ''
            )
            
            self.profile_model.increment_total_orders(publisher_id)
            
            return self.get_order_detail(order_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }
    
    def get_order_detail(self, order_id: int) -> Dict[str, Any]:
        if not order_id or order_id <= 0:
            return {
                'code': 1,
                'message': '订单ID无效',
                'data': None
            }
        
        order = self.order_model.get_order_detail(order_id)
        if not order:
            return {
                'code': 1,
                'message': '订单不存在',
                'data': None
            }
        
        return {
            'code': 0,
            'message': 'success',
            'data': self._format_order(order)
        }
    
    def get_order_list(self, status: str = None, page: int = 1, page_size: int = 20,
                       user_id: int = None, role: str = None) -> Dict[str, Any]:
        status_value = None
        if status:
            status_map = {
                'pending': OrderStatus.PENDING.value,
                'accepted': OrderStatus.ACCEPTED.value,
                'picked_up': OrderStatus.PICKED_UP.value,
                'delivered': OrderStatus.DELIVERED.value,
                'cancelled': OrderStatus.CANCELLED.value
            }
            status_value = status_map.get(status)
        
        if page <= 0:
            page = 1
        if page_size <= 0 or page_size > 100:
            page_size = 20
        
        result = self.order_model.get_list(
            status=status_value,
            page=page,
            page_size=page_size,
            user_id=user_id,
            role=role
        )
        
        formatted_items = [self._format_order(item) for item in result.get('items', [])]
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': formatted_items,
                'total': result.get('total', 0),
                'page': result.get('page', 1),
                'page_size': result.get('page_size', 20),
                'total_pages': result.get('total_pages', 0)
            }
        }
    
    def accept_order(self, order_id: int, taker_id: int) -> Dict[str, Any]:
        if not order_id or order_id <= 0:
            return {
                'code': 1,
                'message': '订单ID无效',
                'data': None
            }
        
        if not taker_id or taker_id <= 0:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {
                'code': 1,
                'message': '订单不存在',
                'data': None
            }
        
        if order.get('status') != OrderStatus.PENDING.value:
            return {
                'code': 1,
                'message': '订单状态不允许接单',
                'data': None
            }
        
        if order.get('publisher_id') == taker_id:
            return {
                'code': 1,
                'message': '不能接自己发布的订单',
                'data': None
            }
        
        self.profile_model.get_or_create_profile(taker_id)
        
        affected = self.order_model.accept_order(order_id, taker_id)
        if affected > 0:
            return self.get_order_detail(order_id)
        
        return {
            'code': 1,
            'message': '接单失败，请稍后重试',
            'data': None
        }
    
    def pick_up_order(self, order_id: int, taker_id: int) -> Dict[str, Any]:
        if not order_id or order_id <= 0:
            return {
                'code': 1,
                'message': '订单ID无效',
                'data': None
            }
        
        if not taker_id or taker_id <= 0:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {
                'code': 1,
                'message': '订单不存在',
                'data': None
            }
        
        if order.get('status') != OrderStatus.ACCEPTED.value:
            return {
                'code': 1,
                'message': '订单状态不允许标记取件',
                'data': None
            }
        
        if order.get('taker_id') != taker_id:
            return {
                'code': 1,
                'message': '只有接单者可以标记取件',
                'data': None
            }
        
        affected = self.order_model.pick_up_order(order_id, taker_id)
        if affected > 0:
            return self.get_order_detail(order_id)
        
        return {
            'code': 1,
            'message': '标记取件失败，请稍后重试',
            'data': None
        }
    
    def confirm_delivery(self, order_id: int, publisher_id: int) -> Dict[str, Any]:
        if not order_id or order_id <= 0:
            return {
                'code': 1,
                'message': '订单ID无效',
                'data': None
            }
        
        if not publisher_id or publisher_id <= 0:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {
                'code': 1,
                'message': '订单不存在',
                'data': None
            }
        
        if order.get('status') != OrderStatus.PICKED_UP.value:
            return {
                'code': 1,
                'message': '订单状态不允许确认送达',
                'data': None
            }
        
        if order.get('publisher_id') != publisher_id:
            return {
                'code': 1,
                'message': '只有发布者可以确认送达',
                'data': None
            }
        
        affected = self.order_model.confirm_delivery(order_id, publisher_id)
        if affected > 0:
            reward = order.get('reward', 0)
            taker_id = order.get('taker_id')
            
            if taker_id:
                self.profile_model.increment_completed_orders(publisher_id)
                self.profile_model.increment_completed_orders(taker_id)
                self.profile_model.update_reputation(taker_id, 1)
                self.profile_model.update_balance(taker_id, float(reward))
            
            return self.get_order_detail(order_id)
        
        return {
            'code': 1,
            'message': '确认送达失败，请稍后重试',
            'data': None
        }
    
    def cancel_order(self, order_id: int, publisher_id: int) -> Dict[str, Any]:
        if not order_id or order_id <= 0:
            return {
                'code': 1,
                'message': '订单ID无效',
                'data': None
            }
        
        if not publisher_id or publisher_id <= 0:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {
                'code': 1,
                'message': '订单不存在',
                'data': None
            }
        
        if order.get('publisher_id') != publisher_id:
            return {
                'code': 1,
                'message': '只有发布者可以取消订单',
                'data': None
            }
        
        if order.get('status') not in [OrderStatus.PENDING.value, OrderStatus.ACCEPTED.value]:
            return {
                'code': 1,
                'message': '当前状态不允许取消订单',
                'data': None
            }
        
        affected = self.order_model.cancel_order(order_id, publisher_id)
        if affected > 0:
            if order.get('status') == OrderStatus.ACCEPTED.value:
                taker_id = order.get('taker_id')
                if taker_id:
                    self.profile_model.update_reputation(publisher_id, -2)
            
            return self.get_order_detail(order_id)
        
        return {
            'code': 1,
            'message': '取消订单失败，请稍后重试',
            'data': None
        }
    
    def get_user_order_stats(self, user_id: int, role: str = 'publisher') -> Dict[str, Any]:
        if not user_id or user_id <= 0:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        
        if role not in ['publisher', 'taker']:
            role = 'publisher'
        
        counts = self.order_model.get_user_order_count(user_id, role)
        
        return {
            'code': 0,
            'message': 'success',
            'data': counts
        }
