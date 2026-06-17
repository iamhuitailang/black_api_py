from typing import Dict, Any, List, Optional
from app.model.farm import FarmProductModel, FarmerModel


class ProductBusiness:
    def __init__(self):
        self.product_model = FarmProductModel()
        self.farmer_model = FarmerModel()

    def create(self, farmer_id: int, name: str, category: str, price: float,
               unit: str = 'jin', stock: int = 0, harvest_date: str = '',
               delivery_range: str = '', expected_delivery: str = '',
               description: str = '', image_url: str = '') -> Dict[str, Any]:
        farmer = self.farmer_model.get_by_id(farmer_id)
        if not farmer:
            return {'code': 404, 'message': '农户不存在', 'data': None}

        product_id = self.product_model.create(
            farmer_id=farmer_id, name=name, category=category, price=price,
            unit=unit, stock=stock, harvest_date=harvest_date,
            delivery_range=delivery_range, expected_delivery=expected_delivery,
            description=description, image_url=image_url
        )
        product = self.product_model.get_by_id(product_id)
        return {'code': 0, 'message': '发布成功', 'data': product}

    def update(self, product_id: int, **kwargs) -> Dict[str, Any]:
        product = self.product_model.get_by_id(product_id)
        if not product:
            return {'code': 404, 'message': '产品不存在', 'data': None}

        self.product_model.update(product_id, **kwargs)
        product = self.product_model.get_by_id(product_id)
        return {'code': 0, 'message': '更新成功', 'data': product}

    def delete(self, product_id: int) -> Dict[str, Any]:
        rows = self.product_model.delete(product_id)
        if rows == 0:
            return {'code': 404, 'message': '产品不存在', 'data': None}
        return {'code': 0, 'message': '删除成功', 'data': None}

    def set_active(self, product_id: int, is_active: bool) -> Dict[str, Any]:
        rows = self.product_model.set_active(product_id, is_active)
        if rows == 0:
            return {'code': 404, 'message': '产品不存在', 'data': None}
        product = self.product_model.get_by_id(product_id)
        return {'code': 0, 'message': '更新成功', 'data': product}

    def get_by_id(self, product_id: int) -> Dict[str, Any]:
        product = self.product_model.get_by_id(product_id)
        if not product:
            return {'code': 404, 'message': '产品不存在', 'data': None}
        farmer = self.farmer_model.get_by_id(product.get('farmer_id'))
        if farmer:
            product['farmer_name'] = farmer.get('name')
            product['shop_name'] = farmer.get('shop_name')
            product['certification'] = farmer.get('certification')
        return {'code': 0, 'message': 'success', 'data': product}

    def get_by_farmer(self, farmer_id: int) -> Dict[str, Any]:
        products = self.product_model.get_by_farmer(farmer_id)
        return {'code': 0, 'message': 'success', 'data': products}

    def list_all(self, category: str = None, delivery_range: str = None) -> Dict[str, Any]:
        products = self.product_model.get_all_active(category=category, delivery_range=delivery_range)
        for p in products:
            farmer = self.farmer_model.get_by_id(p.get('farmer_id'))
            if farmer:
                p['farmer_name'] = farmer.get('name')
                p['shop_name'] = farmer.get('shop_name')
                p['certification'] = farmer.get('certification')
        return {'code': 0, 'message': 'success', 'data': products}

    def get_filters(self) -> Dict[str, Any]:
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'categories': self.product_model.get_categories(),
                'delivery_ranges': self.product_model.get_delivery_ranges()
            }
        }
