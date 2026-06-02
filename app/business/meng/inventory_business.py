from typing import Dict, Any, List, Optional
from app.model.meng_model import InventoryModel, UserModel


class MengInventoryBusiness:
    def __init__(self):
        self.inventory_model = InventoryModel()
        self.user_model = UserModel()

    def get_inventory(self, user_id: int, item_type: Optional[str] = None) -> Dict[str, Any]:
        try:
            user = self.user_model.get_by_id(user_id)
            if not user:
                return {
                    'code': 1,
                    'msg': '用户不存在',
                    'data': None
                }

            items = self.inventory_model.get_by_user(user_id, item_type)
            result = [self.inventory_model.to_dict(item) for item in items]

            return {
                'code': 0,
                'msg': 'success',
                'data': result
            }
        except Exception as e:
            return {
                'code': 1,
                'msg': str(e),
                'data': None
            }

    def add_item(self, user_id: int, item_type: str, item_subtype: str,
                 quantity: int = 1, properties: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        try:
            user = self.user_model.get_by_id(user_id)
            if not user:
                return {
                    'code': 1,
                    'msg': '用户不存在',
                    'data': None
                }

            if not item_type or not item_subtype:
                return {
                    'code': 1,
                    'msg': '物品类型和子类型不能为空',
                    'data': None
                }

            if quantity <= 0:
                return {
                    'code': 1,
                    'msg': '数量必须大于0',
                    'data': None
                }

            affected = self.inventory_model.add_item(user_id, item_type, item_subtype, quantity, properties)

            if affected > 0:
                item = self.inventory_model.get_item(user_id, item_type, item_subtype)
                return {
                    'code': 0,
                    'msg': '添加成功',
                    'data': self.inventory_model.to_dict(item)
                }

            return {
                'code': 1,
                'msg': '添加失败',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'msg': str(e),
                'data': None
            }

    def remove_item(self, user_id: int, item_type: str, item_subtype: str, quantity: int = 1) -> Dict[str, Any]:
        try:
            user = self.user_model.get_by_id(user_id)
            if not user:
                return {
                    'code': 1,
                    'msg': '用户不存在',
                    'data': None
                }

            if not item_type or not item_subtype:
                return {
                    'code': 1,
                    'msg': '物品类型和子类型不能为空',
                    'data': None
                }

            if quantity <= 0:
                return {
                    'code': 1,
                    'msg': '数量必须大于0',
                    'data': None
                }

            existing = self.inventory_model.get_item(user_id, item_type, item_subtype)
            if not existing:
                return {
                    'code': 1,
                    'msg': '物品不存在',
                    'data': None
                }

            current_quantity = existing.get('quantity', 0)
            if current_quantity < quantity:
                return {
                    'code': 1,
                    'msg': f'物品数量不足，当前数量：{current_quantity}',
                    'data': None
                }

            affected = self.inventory_model.remove_item(user_id, item_type, item_subtype, quantity)

            if affected > 0:
                return {
                    'code': 0,
                    'msg': '移除成功',
                    'data': None
                }

            return {
                'code': 1,
                'msg': '移除失败',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'msg': str(e),
                'data': None
            }

    def get_item(self, user_id: int, item_type: str, item_subtype: str) -> Dict[str, Any]:
        try:
            user = self.user_model.get_by_id(user_id)
            if not user:
                return {
                    'code': 1,
                    'msg': '用户不存在',
                    'data': None
                }

            if not item_type or not item_subtype:
                return {
                    'code': 1,
                    'msg': '物品类型和子类型不能为空',
                    'data': None
                }

            item = self.inventory_model.get_item(user_id, item_type, item_subtype)

            if item:
                return {
                    'code': 0,
                    'msg': 'success',
                    'data': self.inventory_model.to_dict(item)
                }

            return {
                'code': 0,
                'msg': '物品不存在',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'msg': str(e),
                'data': None
            }

    def batch_add_items(self, user_id: int, items: List[Dict[str, Any]]) -> Dict[str, Any]:
        try:
            user = self.user_model.get_by_id(user_id)
            if not user:
                return {
                    'code': 1,
                    'msg': '用户不存在',
                    'data': None
                }

            if not items or not isinstance(items, list):
                return {
                    'code': 1,
                    'msg': '物品列表不能为空',
                    'data': None
                }

            success_count = 0
            failed_items = []

            for index, item in enumerate(items):
                try:
                    item_type = item.get('item_type')
                    item_subtype = item.get('item_subtype')
                    quantity = item.get('quantity', 1)
                    properties = item.get('properties')

                    if not item_type or not item_subtype:
                        failed_items.append({
                            'index': index,
                            'item': item,
                            'reason': '物品类型和子类型不能为空'
                        })
                        continue

                    if quantity <= 0:
                        failed_items.append({
                            'index': index,
                            'item': item,
                            'reason': '数量必须大于0'
                        })
                        continue

                    affected = self.inventory_model.add_item(
                        user_id, item_type, item_subtype, quantity, properties
                    )

                    if affected > 0:
                        success_count += 1
                    else:
                        failed_items.append({
                            'index': index,
                            'item': item,
                            'reason': '添加失败'
                        })
                except Exception as e:
                    failed_items.append({
                        'index': index,
                        'item': item,
                        'reason': str(e)
                    })

            return {
                'code': 0,
                'msg': f'批量添加完成，成功 {success_count} 个，失败 {len(failed_items)} 个',
                'data': {
                    'success_count': success_count,
                    'failed_count': len(failed_items),
                    'failed_items': failed_items
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'msg': str(e),
                'data': None
            }
