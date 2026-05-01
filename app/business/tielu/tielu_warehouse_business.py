from typing import Dict, Any, List, Optional
from app.model.tielu import TieluWarehouseModel, TieluGoodsConfigModel, TieluCityModel


class TieluWarehouseBusiness:
    def __init__(self):
        self.warehouse_model = TieluWarehouseModel()
        self.goods_config_model = TieluGoodsConfigModel()
        self.city_model = TieluCityModel()

    def get_user_warehouse(self, user_id: int) -> Dict[str, Any]:
        warehouses = self.warehouse_model.get_by_user_id(user_id)
        result = [self.warehouse_model.to_public_dict(w) for w in warehouses]

        grouped = {}
        for item in result:
            city = item.get('city_name', '')
            if city not in grouped:
                grouped[city] = []
            grouped[city].append(item)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'list': result,
                'grouped': grouped
            }
        }

    def get_warehouse_by_city(self, user_id: int, city_name: str) -> Dict[str, Any]:
        warehouses = self.warehouse_model.get_by_user_and_city(user_id, city_name)
        result = [self.warehouse_model.to_public_dict(w) for w in warehouses]

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def add_goods(self, user_id: int, city_name: str, goods_type: str, amount: int) -> Dict[str, Any]:
        if amount <= 0:
            return {
                'code': 1,
                'msg': '数量必须大于0',
                'data': None
            }

        goods_config = self.goods_config_model.get_by_name(goods_type)
        if not goods_config:
            return {
                'code': 1,
                'msg': '货物类型不存在',
                'data': None
            }

        affected = self.warehouse_model.add_goods(user_id, city_name, goods_type, amount)

        return {
            'code': 0,
            'msg': '货物入库成功',
            'data': {
                'city': city_name,
                'goods_type': goods_type,
                'amount': amount
            }
        }

    def remove_goods(self, user_id: int, city_name: str, goods_type: str, amount: int) -> Dict[str, Any]:
        if amount <= 0:
            return {
                'code': 1,
                'msg': '数量必须大于0',
                'data': None
            }

        result = self.warehouse_model.remove_goods(user_id, city_name, goods_type, amount)

        if result.get('success'):
            return {
                'code': 0,
                'msg': result.get('msg'),
                'data': {
                    'city': city_name,
                    'goods_type': goods_type,
                    'amount': amount,
                    'remaining': result.get('remaining', 0)
                }
            }

        return {
            'code': 1,
            'msg': result.get('msg'),
            'data': None
        }

    def transfer_goods(self, user_id: int, from_city: str, to_city: str, 
                       goods_type: str, amount: int) -> Dict[str, Any]:
        if amount <= 0:
            return {
                'code': 1,
                'msg': '数量必须大于0',
                'data': None
            }

        if from_city == to_city:
            return {
                'code': 1,
                'msg': '不能转移到同一城市',
                'data': None
            }

        result = self.warehouse_model.transfer_goods(user_id, from_city, to_city, goods_type, amount)

        if result.get('success'):
            return {
                'code': 0,
                'msg': result.get('msg'),
                'data': {
                    'from_city': from_city,
                    'to_city': to_city,
                    'goods_type': goods_type,
                    'amount': amount
                }
            }

        return {
            'code': 1,
            'msg': result.get('msg'),
            'data': None
        }

    def get_goods_amount(self, user_id: int, city_name: str, goods_type: str) -> Dict[str, Any]:
        warehouse = self.warehouse_model.get_by_user_city_goods(user_id, city_name, goods_type)
        amount = warehouse.get('amount', 0) if warehouse else 0

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'city': city_name,
                'goods_type': goods_type,
                'amount': amount
            }
        }
