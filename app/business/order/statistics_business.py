from typing import Dict, Any, List, Optional
from app.model.order.order import OrderModel


class OrderStatisticsBusiness:
    def __init__(self):
        self.order_model = OrderModel()

    def get_statistics(self, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        result = self.order_model.get_statistics(start_date, end_date)
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_daily_summary(self, date: str) -> Dict[str, Any]:
        result = self.order_model.get_statistics(date, date)
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }