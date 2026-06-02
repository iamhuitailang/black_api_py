from typing import Dict, Any, List
from app.model.zuma_model import ZumaUserItemModel, ZumaUserModel


class ZumaItemBusiness:
    def __init__(self):
        self.user_item_model = ZumaUserItemModel()
        self.user_model = ZumaUserModel()

    def get_all_items(self) -> Dict[str, Any]:
        items = ZumaUserItemModel.get_all_items_info()
        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_user_items(self, user_id: int) -> Dict[str, Any]:
        items = self.user_item_model.get_user_items(user_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def buy_item(self, user_id: int, item_type: str, quantity: int = 1) -> Dict[str, Any]:
        item_info = ZumaUserItemModel.ITEM_INFO.get(item_type)
        if not item_info:
            return {
                'code': 1,
                'msg': '道具不存在',
                'data': None
            }

        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        total_cost = item_info['price'] * quantity
        if user.get('coins', 0) < total_cost:
            return {
                'code': 1,
                'msg': '金币不足',
                'data': None
            }

        self.user_model.update_coins(user_id, -total_cost)
        self.user_item_model.add_item(user_id, item_type, quantity)

        updated_user = self.user_model.get_by_id(user_id)
        return {
            'code': 0,
            'msg': '购买成功',
            'data': {
                'user': self.user_model.to_public_dict(updated_user)
            }
        }

    def use_item(self, user_id: int, item_type: str) -> Dict[str, Any]:
        success = self.user_item_model.use_item(user_id, item_type)
        if success:
            return {
                'code': 0,
                'msg': '使用成功',
                'data': None
            }
        return {
            'code': 1,
            'msg': '道具数量不足',
            'data': None
        }

    def add_item(self, user_id: int, item_type: str, quantity: int = 1) -> Dict[str, Any]:
        item_info = ZumaUserItemModel.ITEM_INFO.get(item_type)
        if not item_info:
            return {
                'code': 1,
                'msg': '道具不存在',
                'data': None
            }

        affected = self.user_item_model.add_item(user_id, item_type, quantity)
        if affected > 0:
            return {
                'code': 0,
                'msg': '道具添加成功',
                'data': None
            }
        return {
            'code': 1,
            'msg': '道具添加失败',
            'data': None
        }
