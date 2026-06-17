from typing import Dict, Any, List, Optional
from app.model.farm import FarmOrderModel, FarmProductModel, FarmerModel, ConsumerModel


class OrderBusiness:
    def __init__(self):
        self.order_model = FarmOrderModel()
        self.product_model = FarmProductModel()
        self.farmer_model = FarmerModel()
        self.consumer_model = ConsumerModel()

    def create(self, consumer_id: int, consumer_name: str, consumer_phone: str,
               delivery_address: str, product_id: int, quantity: int,
               remark: str = '') -> Dict[str, Any]:
        product = self.product_model.get_by_id(product_id)
        if not product:
            return {'code': 404, 'message': '产品不存在', 'data': None}
        if (product.get('stock') or 0) < quantity:
            return {'code': 400, 'message': '库存不足', 'data': None}

        unit_price = product.get('price', 0)
        total_price = round(unit_price * quantity, 2)
        farmer_id = product.get('farmer_id')

        order_id = self.order_model.create(
            consumer_id=consumer_id,
            consumer_name=consumer_name,
            consumer_phone=consumer_phone,
            delivery_address=delivery_address,
            farmer_id=farmer_id,
            product_id=product_id,
            product_name=product.get('name'),
            product_image=product.get('image_url'),
            unit_price=unit_price,
            unit=product.get('unit', 'jin'),
            quantity=quantity,
            total_price=total_price,
            expected_delivery=product.get('expected_delivery'),
            remark=remark
        )

        self.product_model.decrease_stock(product_id, quantity)

        order = self.order_model.get_by_id(order_id)
        return {'code': 0, 'message': '下单成功', 'data': order}

    def get_by_id(self, order_id: int) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {'code': 404, 'message': '订单不存在', 'data': None}
        farmer = self.farmer_model.get_by_id(order.get('farmer_id'))
        if farmer:
            order['farmer_name'] = farmer.get('name')
            order['shop_name'] = farmer.get('shop_name')
        return {'code': 0, 'message': 'success', 'data': order}

    def get_by_farmer(self, farmer_id: int, status: str = None) -> Dict[str, Any]:
        orders = self.order_model.get_by_farmer(farmer_id, status=status)
        return {'code': 0, 'message': 'success', 'data': orders}

    def get_by_consumer(self, consumer_id: int, status: str = None) -> Dict[str, Any]:
        orders = self.order_model.get_by_consumer(consumer_id, status=status)
        return {'code': 0, 'message': 'success', 'data': orders}

    def get_all(self, status: str = None) -> Dict[str, Any]:
        orders = self.order_model.get_all(status=status)
        for o in orders:
            farmer = self.farmer_model.get_by_id(o.get('farmer_id'))
            if farmer:
                o['farmer_name'] = farmer.get('name')
        return {'code': 0, 'message': 'success', 'data': orders}

    def advance_status(self, order_id: int) -> Dict[str, Any]:
        next_status = self.order_model.advance_status(order_id)
        if next_status is None:
            return {'code': 404, 'message': '订单不存在或状态无法流转', 'data': None}

        order = self.order_model.get_by_id(order_id)
        if next_status == FarmOrderModel.STATUS_DELIVERED:
            farmer_id = order.get('farmer_id')
            self.farmer_model.update_delivery_stats(farmer_id, True)

        return {'code': 0, 'message': f'状态已更新为{self._status_text(next_status)}', 'data': order}

    def cancel(self, order_id: int) -> Dict[str, Any]:
        rows = self.order_model.cancel(order_id)
        if rows == 0:
            return {'code': 404, 'message': '订单不存在', 'data': None}
        order = self.order_model.get_by_id(order_id)
        return {'code': 0, 'message': '订单已取消', 'data': order}

    def _status_text(self, status: str) -> str:
        mapping = {
            FarmOrderModel.STATUS_PENDING_CONFIRM: '待确认',
            FarmOrderModel.STATUS_ACCEPTED: '已接单',
            FarmOrderModel.STATUS_PICKING: '采摘中',
            FarmOrderModel.STATUS_DELIVERING: '配送中',
            FarmOrderModel.STATUS_DELIVERED: '已送达',
            FarmOrderModel.STATUS_CANCELLED: '已取消'
        }
        return mapping.get(status, status)
