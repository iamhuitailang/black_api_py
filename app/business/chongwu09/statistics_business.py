from typing import Dict, Any
from app.model.chongwu09 import ServiceModel, BookingModel, OrderModel, UserModel, PetModel, ReviewModel


class StatisticsBusiness:
    def __init__(self):
        self.service_model = ServiceModel()
        self.booking_model = BookingModel()
        self.order_model = OrderModel()
        self.user_model = UserModel()
        self.pet_model = PetModel()
        self.review_model = ReviewModel()

    def get_dashboard(self) -> Dict[str, Any]:
        service_total = self.service_model.query.count()
        service_active = self.service_model.query.count({'status': ServiceModel.STATUS_ACTIVE})
        booking_total = self.booking_model.query.count()
        booking_pending = self.booking_model.query.count({'status': BookingModel.STATUS_PENDING})
        booking_active = self.booking_model.query.count({'status': BookingModel.STATUS_ACTIVE})
        booking_completed = self.booking_model.query.count({'status': BookingModel.STATUS_COMPLETED})
        order_total = self.order_model.query.count()
        order_paid = self.order_model.query.count({'status': OrderModel.STATUS_PAID})
        order_completed = self.order_model.query.count({'status': OrderModel.STATUS_COMPLETED})
        user_total = self.user_model.query.count()
        user_active = self.user_model.query.count({'status': UserModel.STATUS_ACTIVE})
        pet_total = self.pet_model.query.count()

        total_revenue = 0.0
        revenue_result = self.order_model.db.fetch_one(
            f"SELECT SUM(amount) as total FROM {OrderModel.TABLE_NAME} WHERE status IN (?, ?)",
            (OrderModel.STATUS_PAID, OrderModel.STATUS_COMPLETED)
        )
        if revenue_result and revenue_result['total']:
            total_revenue = revenue_result['total']

        type_stats = self.service_model.db.fetch_all(
            f"SELECT type, COUNT(*) as count FROM {ServiceModel.TABLE_NAME} GROUP BY type"
        )

        booking_status_stats = []
        for status_val, status_name in BookingModel.STATUS_MAP.items():
            count = self.booking_model.query.count({'status': status_val})
            booking_status_stats.append({'status': status_val, 'name': status_name, 'count': count})

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'service_total': service_total,
                'service_active': service_active,
                'booking_total': booking_total,
                'booking_pending': booking_pending,
                'booking_active': booking_active,
                'booking_completed': booking_completed,
                'order_total': order_total,
                'order_paid': order_paid,
                'order_completed': order_completed,
                'user_total': user_total,
                'user_active': user_active,
                'pet_total': pet_total,
                'total_revenue': round(total_revenue, 2),
                'type_stats': type_stats,
                'booking_status_stats': booking_status_stats
            }
        }
