from typing import Dict, Any, List, Optional
from app.model.fuwu_077_model import OrderModel, ServiceModel, StaffModel, UserModel


class StatisticsBusiness:
    def __init__(self):
        self.order_model = OrderModel()
        self.service_model = ServiceModel()
        self.staff_model = StaffModel()
        self.user_model = UserModel()

    def get_overview(self, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        order_stats = self.order_model.get_statistics(start_date, end_date)
        
        total_users = self.user_model.query.count({'role': 'user'})
        total_staff = self.staff_model.query.count({'status': 1})
        total_services = self.service_model.query.count({'status': 1})
        
        overview = order_stats.get('overview', {})
        
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_orders': overview.get('total_orders', 0),
                'pending_orders': overview.get('pending_orders', 0),
                'assigned_orders': overview.get('assigned_orders', 0),
                'confirmed_orders': overview.get('confirmed_orders', 0),
                'completed_orders': overview.get('completed_orders', 0),
                'cancelled_orders': overview.get('cancelled_orders', 0),
                'total_amount': overview.get('total_amount') or 0,
                'total_users': total_users,
                'total_staff': total_staff,
                'total_services': total_services
            }
        }

    def get_daily_stats(self, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        order_stats = self.order_model.get_statistics(start_date, end_date)
        return {
            'code': 0,
            'msg': 'success',
            'data': order_stats.get('daily_stats', [])
        }

    def get_service_stats(self, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        order_stats = self.order_model.get_statistics(start_date, end_date)
        return {
            'code': 0,
            'msg': 'success',
            'data': order_stats.get('service_stats', [])
        }

    def get_full_statistics(self, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        order_stats = self.order_model.get_statistics(start_date, end_date)
        
        total_users = self.user_model.query.count({'role': 'user'})
        total_staff = self.staff_model.query.count({'status': 1})
        total_services = self.service_model.query.count({'status': 1})
        
        overview = order_stats.get('overview', {})
        
        upcoming_orders = self.order_model.get_upcoming_orders(24)
        
        staff_list = self.staff_model.query.find_all(
            {'status': 1}, 
            order_by='rating DESC',
            limit=5
        )
        top_staff = [self.staff_model.to_dict(s) for s in staff_list]
        
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'overview': {
                    'total_orders': overview.get('total_orders', 0),
                    'pending_orders': overview.get('pending_orders', 0),
                    'assigned_orders': overview.get('assigned_orders', 0),
                    'confirmed_orders': overview.get('confirmed_orders', 0),
                    'completed_orders': overview.get('completed_orders', 0),
                    'cancelled_orders': overview.get('cancelled_orders', 0),
                    'total_amount': overview.get('total_amount') or 0,
                    'total_users': total_users,
                    'total_staff': total_staff,
                    'total_services': total_services
                },
                'daily_stats': order_stats.get('daily_stats', []),
                'service_stats': order_stats.get('service_stats', []),
                'upcoming_orders': [
                    self.order_model.to_dict(o) for o in upcoming_orders
                ],
                'top_staff': top_staff
            }
        }
