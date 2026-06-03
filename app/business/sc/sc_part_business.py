from typing import Dict, Any, List, Optional
from app.model.sc import ScPartModel, ScUserPartModel, ScUserModel


class ScPartBusiness:
    def __init__(self):
        self.part_model = ScPartModel()
        self.user_part_model = ScUserPartModel()
        self.user_model = ScUserModel()

    def get_all_parts(self, page: int = 1, page_size: int = 20, part_type: str = None) -> Dict[str, Any]:
        if part_type and part_type in ScPartModel.VALID_TYPES:
            result = self.part_model.get_by_type(part_type, page, page_size)
        else:
            result = self.part_model.get_all(page, page_size)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': result.get('items', []),
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_part_detail(self, part_id: int) -> Dict[str, Any]:
        part = self.part_model.get_by_id(part_id)
        if not part:
            return {
                'code': 1,
                'msg': '零件不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': part
        }

    def buy_part(self, user_id: int, part_id: int) -> Dict[str, Any]:
        part = self.part_model.get_by_id(part_id)
        if not part:
            return {
                'code': 1,
                'msg': '零件不存在',
                'data': None
            }

        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        price = part.get('price', 0)
        user_coins = user.get('coins', 0)

        if user_coins < price:
            return {
                'code': 1,
                'msg': '金币不足',
                'data': None
            }

        affected = self.user_model.update_coins(user_id, -price)
        if affected <= 0:
            return {
                'code': 1,
                'msg': '购买失败，金币扣除失败',
                'data': None
            }

        existing_user_part = self.user_part_model.get_by_user_and_part(user_id, part_id)
        if existing_user_part:
            new_quantity = existing_user_part.get('quantity', 0) + 1
            self.user_part_model.update_quantity(existing_user_part.get('id'), new_quantity)
            user_part_id = existing_user_part.get('id')
        else:
            user_part_id = self.user_part_model.create(user_id, part_id, 1)

        if user_part_id > 0:
            updated_user = self.user_model.get_by_id(user_id)
            return {
                'code': 0,
                'msg': '购买成功',
                'data': {
                    'user_part_id': user_part_id,
                    'user': self.user_model.to_public_dict(updated_user)
                }
            }

        self.user_model.update_coins(user_id, price)
        return {
            'code': 1,
            'msg': '购买失败',
            'data': None
        }

    def get_user_parts(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': {
                    'items': [],
                    'total': 0,
                    'page': page,
                    'page_size': page_size,
                    'total_pages': 0
                }
            }

        result = self.user_part_model.get_by_user_id(user_id, page, page_size)
        items = result.get('items', [])

        for item in items:
            part = self.part_model.get_by_id(item.get('part_id'))
            if part:
                item['part'] = part

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def sell_part(self, user_id: int, user_part_id: int, quantity: int) -> Dict[str, Any]:
        if quantity <= 0:
            return {
                'code': 1,
                'msg': '出售数量必须大于0',
                'data': None
            }

        user_part = self.user_part_model.get_by_id(user_part_id)
        if not user_part:
            return {
                'code': 1,
                'msg': '用户零件记录不存在',
                'data': None
            }

        if user_part.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权出售该零件',
                'data': None
            }

        current_quantity = user_part.get('quantity', 0)
        if current_quantity < quantity:
            return {
                'code': 1,
                'msg': '出售数量超过持有数量',
                'data': None
            }

        part = self.part_model.get_by_id(user_part.get('part_id'))
        if not part:
            return {
                'code': 1,
                'msg': '零件不存在',
                'data': None
            }

        sell_price = int(part.get('price', 0) * 0.7)
        total_price = sell_price * quantity

        new_quantity = current_quantity - quantity
        if new_quantity > 0:
            self.user_part_model.update_quantity(user_part_id, new_quantity)
        else:
            self.user_part_model.delete(user_part_id)

        affected = self.user_model.update_coins(user_id, total_price)
        if affected <= 0:
            return {
                'code': 1,
                'msg': '出售失败，金币增加失败',
                'data': None
            }

        updated_user = self.user_model.get_by_id(user_id)
        return {
            'code': 0,
            'msg': '出售成功',
            'data': {
                'sold_quantity': quantity,
                'total_price': total_price,
                'user': self.user_model.to_public_dict(updated_user)
            }
        }
