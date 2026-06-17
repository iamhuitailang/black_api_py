from typing import Dict, Any, List
from app.model.farm import FarmProductModel, FarmOrderModel, FarmerModel


class StatsBusiness:
    def __init__(self):
        self.product_model = FarmProductModel()
        self.order_model = FarmOrderModel()
        self.farmer_model = FarmerModel()

    def category_sales(self) -> Dict[str, Any]:
        sales = self.product_model.get_sales_by_category()
        return {'code': 0, 'message': 'success', 'data': sales}

    def farmer_delivery_ranking(self) -> Dict[str, Any]:
        farmers = self.farmer_model.get_approved()
        rankings = []
        for farmer in farmers:
            fid = farmer.get('id')
            stats = self.order_model.get_farmer_delivery_stats(fid)
            total = stats.get('total_orders', 0) or 0
            delivered = stats.get('delivered_count', 0) or 0
            on_time = stats.get('on_time_count', 0) or 0
            on_time_rate = round((on_time / delivered * 100), 1) if delivered > 0 else 0.0

            rankings.append({
                'farmer_id': fid,
                'farmer_name': farmer.get('name'),
                'shop_name': farmer.get('shop_name'),
                'certification': farmer.get('certification'),
                'total_orders': total,
                'delivered_count': delivered,
                'on_time_count': on_time,
                'on_time_rate': on_time_rate
            })

        rankings.sort(key=lambda x: x['on_time_rate'], reverse=True)
        return {'code': 0, 'message': 'success', 'data': rankings}

    def overview(self) -> Dict[str, Any]:
        farmer_count = self.farmer_model.count(status=FarmerModel.STATUS_APPROVED)
        pending_farmer_count = self.farmer_model.count(status=FarmerModel.STATUS_PENDING)
        product_count = self.product_model.count()
        order_count = self.order_model.count()
        pending_orders = self.order_model.count(status=FarmOrderModel.STATUS_PENDING_CONFIRM)

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'farmer_count': farmer_count,
                'pending_farmer_count': pending_farmer_count,
                'product_count': product_count,
                'order_count': order_count,
                'pending_orders': pending_orders
            }
        }
