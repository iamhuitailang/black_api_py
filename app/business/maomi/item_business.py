from typing import Dict, Any, List, Optional
from app.model.maomi_model import ItemModel, CatItemModel, UserProfileModel, GameRecordModel


class ItemBusiness:
    def __init__(self):
        self.model = ItemModel()
        self.cat_item_model = CatItemModel()
        self.user_profile_model = UserProfileModel()
        self.record_model = GameRecordModel()

    def get_all_items(self, level: int = 1) -> Dict[str, Any]:
        try:
            items = self.model.get_available_for_level(level)
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'items': items,
                    'count': len(items)
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_items_by_type(self, type: str) -> Dict[str, Any]:
        try:
            items = self.model.get_by_type(type)
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'items': items,
                    'count': len(items)
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_item(self, item_id: int) -> Dict[str, Any]:
        item = self.model.get_by_id(item_id)
        if item:
            return {
                'code': 0,
                'message': 'success',
                'data': item
            }
        return {
            'code': 1,
            'message': '物品不存在',
            'data': None
        }

    def get_user_items(self, user_id: int) -> Dict[str, Any]:
        try:
            items = self.cat_item_model.get_by_user_id(user_id)
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'items': items,
                    'count': len(items)
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def buy_item(self, user_id: int, item_id: int, quantity: int = 1) -> Dict[str, Any]:
        item = self.model.get_by_id(item_id)
        if not item:
            return {
                'code': 1,
                'message': '物品不存在',
                'data': None
            }

        profile = self.user_profile_model.get_by_user_id(user_id)
        if not profile:
            return {
                'code': 1,
                'message': '用户档案不存在',
                'data': None
            }

        total_cost = item.get('price', 0) * quantity

        if profile.get('coins', 0) < total_cost:
            return {
                'code': 1,
                'message': '金币不足',
                'data': None
            }

        if profile.get('level', 1) < item.get('unlock_level', 1):
            return {
                'code': 1,
                'message': f'等级不足，需要{item.get("unlock_level", 1)}级',
                'data': None
            }

        try:
            self.user_profile_model.add_coins(user_id, -total_cost)
            self.cat_item_model.create(user_id, item_id, item.get('name', ''), quantity)
            self.record_model.add_purchase_record(user_id, item.get('name', ''), total_cost)

            return {
                'code': 0,
                'message': '购买成功',
                'data': {
                    'item': item,
                    'quantity': quantity,
                    'total_cost': total_cost
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def use_item(self, user_id: int, item_id: int, cat_id: int = None) -> Dict[str, Any]:
        cat_item = self.cat_item_model.get_by_item_id(user_id, item_id)
        if not cat_item:
            return {
                'code': 1,
                'message': '没有该物品',
                'data': None
            }

        item = self.model.get_by_id(item_id)
        if not item:
            return {
                'code': 1,
                'message': '物品不存在',
                'data': None
            }

        try:
            self.cat_item_model.use_item(user_id, item_id)

            effect_type = item.get('effect_type', '')
            effect_value = item.get('effect_value', 0)

            return {
                'code': 0,
                'message': '使用成功',
                'data': {
                    'item': item,
                    'effect_type': effect_type,
                    'effect_value': effect_value
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def create_default_items(self) -> Dict[str, Any]:
        try:
            count = self.model.create_default_items()
            return {
                'code': 0,
                'message': f'成功创建{count}个默认物品',
                'data': {
                    'count': count
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def add_item(self, name: str, type: str, category: str, price: int,
                 description: str = '', effect_type: str = '', effect_value: int = 0,
                 rarity: str = 'normal', unlock_level: int = 1) -> Dict[str, Any]:
        if type not in ['toy', 'food', 'decoration', 'furniture']:
            return {
                'code': 1,
                'message': '类型不正确',
                'data': None
            }
        if rarity not in ['normal', 'rare', 'epic', 'legendary']:
            return {
                'code': 1,
                'message': '稀有度不正确',
                'data': None
            }
        try:
            item_id = self.model.create(
                name=name,
                type=type,
                category=category,
                price=price,
                description=description,
                effect_type=effect_type,
                effect_value=effect_value,
                rarity=rarity,
                unlock_level=unlock_level
            )
            return self.get_item(item_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }
