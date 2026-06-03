from typing import Dict, Any, List, Optional
from app.model.sc import ScPaintModel, ScUserModel


class ScPaintBusiness:
    def __init__(self):
        self.paint_model = ScPaintModel()
        self.user_model = ScUserModel()

    def _validate_color_hex(self, color: str) -> bool:
        if not color:
            return False
        import re
        pattern = r'^#[0-9A-Fa-f]{6}$'
        return re.match(pattern, color) is not None

    def create_paint(self, user_id: int, name: str, paint_type: str,
                     color_hex: str, price: int, is_public: int = 0) -> Dict[str, Any]:
        if not user_id or user_id <= 0:
            return {
                'code': 1,
                'msg': '用户ID无效',
                'data': None
            }

        if not name or len(name.strip()) == 0:
            return {
                'code': 1,
                'msg': '油漆名称不能为空',
                'data': None
            }

        if len(name) > 50:
            return {
                'code': 1,
                'msg': '油漆名称不能超过50个字符',
                'data': None
            }

        valid_types = [self.paint_model.TYPE_SOLID, self.paint_model.TYPE_METALLIC,
                       self.paint_model.TYPE_MATTE, self.paint_model.TYPE_PEARLESCENT]
        if paint_type not in valid_types:
            return {
                'code': 1,
                'msg': f'油漆类型无效，有效值为：{", ".join(valid_types)}',
                'data': None
            }

        if not self._validate_color_hex(color_hex):
            return {
                'code': 1,
                'msg': '颜色格式不正确，应为#RRGGBB格式',
                'data': None
            }

        if price is None or price < 0:
            return {
                'code': 1,
                'msg': '价格不能为负数',
                'data': None
            }

        if is_public not in [0, 1]:
            return {
                'code': 1,
                'msg': 'is_public 只能是 0 或 1',
                'data': None
            }

        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        paint_id = self.paint_model.create(
            name=name.strip(),
            type=paint_type,
            color_hex=color_hex,
            price=price,
            user_id=user_id,
            is_public=is_public
        )

        if paint_id > 0:
            paint = self.paint_model.get_by_id(paint_id)
            return {
                'code': 0,
                'msg': '油漆创建成功',
                'data': paint
            }

        return {
            'code': 1,
            'msg': '油漆创建失败',
            'data': None
        }

    def get_user_paints(self, user_id: int) -> Dict[str, Any]:
        if not user_id or user_id <= 0:
            return {
                'code': 1,
                'msg': '用户ID无效',
                'data': None
            }

        paints = self.paint_model.get_by_user_id(user_id)
        result = []
        for paint in paints:
            paint['type_text'] = self.paint_model.get_type_text(paint.get('type', ''))
            result.append(paint)

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_public_paints(self, paint_type: str = None, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        if page < 1:
            page = 1
        if page_size < 1 or page_size > 100:
            page_size = 20

        if paint_type:
            valid_types = [self.paint_model.TYPE_SOLID, self.paint_model.TYPE_METALLIC,
                           self.paint_model.TYPE_MATTE, self.paint_model.TYPE_PEARLESCENT]
            if paint_type not in valid_types:
                return {
                    'code': 1,
                    'msg': f'油漆类型无效，有效值为：{", ".join(valid_types)}',
                    'data': None
                }

        all_paints = self.paint_model.get_public_paints(paint_type)

        total = len(all_paints)
        total_pages = (total + page_size - 1) // page_size
        start = (page - 1) * page_size
        end = start + page_size
        paginated_paints = all_paints[start:end]

        result = []
        for paint in paginated_paints:
            paint['type_text'] = self.paint_model.get_type_text(paint.get('type', ''))
            result.append(paint)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': result,
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': total_pages
            }
        }

    def update_paint(self, user_id: int, paint_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        if not paint_id or paint_id <= 0:
            return {
                'code': 1,
                'msg': '油漆ID无效',
                'data': None
            }

        paint = self.paint_model.get_by_id(paint_id)
        if not paint:
            return {
                'code': 1,
                'msg': '油漆不存在',
                'data': None
            }

        if paint.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权修改该油漆',
                'data': None
            }

        if 'name' in data and (not data['name'] or len(data['name'].strip()) == 0):
            return {
                'code': 1,
                'msg': '油漆名称不能为空',
                'data': None
            }

        if 'name' in data and len(data['name']) > 50:
            return {
                'code': 1,
                'msg': '油漆名称不能超过50个字符',
                'data': None
            }

        if 'type' in data:
            valid_types = [self.paint_model.TYPE_SOLID, self.paint_model.TYPE_METALLIC,
                           self.paint_model.TYPE_MATTE, self.paint_model.TYPE_PEARLESCENT]
            if data['type'] not in valid_types:
                return {
                    'code': 1,
                    'msg': f'油漆类型无效，有效值为：{", ".join(valid_types)}',
                    'data': None
                }

        if 'color_hex' in data and not self._validate_color_hex(data['color_hex']):
            return {
                'code': 1,
                'msg': '颜色格式不正确，应为#RRGGBB格式',
                'data': None
            }

        if 'price' in data and data['price'] < 0:
            return {
                'code': 1,
                'msg': '价格不能为负数',
                'data': None
            }

        if 'is_public' in data and data['is_public'] not in [0, 1]:
            return {
                'code': 1,
                'msg': 'is_public 只能是 0 或 1',
                'data': None
            }

        update_data = {}
        for key in ['name', 'type', 'color_hex', 'price', 'is_public']:
            if key in data:
                update_data[key] = data[key]

        if len(update_data) == 0:
            return {
                'code': 1,
                'msg': '没有有效的更新字段',
                'data': None
            }

        affected = self.paint_model.update(paint_id, update_data)
        if affected >= 0:
            updated_paint = self.paint_model.get_by_id(paint_id)
            updated_paint['type_text'] = self.paint_model.get_type_text(updated_paint.get('type', ''))
            return {
                'code': 0,
                'msg': '油漆更新成功',
                'data': updated_paint
            }

        return {
            'code': 1,
            'msg': '油漆更新失败',
            'data': None
        }

    def delete_paint(self, user_id: int, paint_id: int) -> Dict[str, Any]:
        if not paint_id or paint_id <= 0:
            return {
                'code': 1,
                'msg': '油漆ID无效',
                'data': None
            }

        paint = self.paint_model.get_by_id(paint_id)
        if not paint:
            return {
                'code': 1,
                'msg': '油漆不存在',
                'data': None
            }

        if paint.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权删除该油漆',
                'data': None
            }

        affected = self.paint_model.delete(paint_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '油漆删除成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '油漆删除失败',
            'data': None
        }

    def buy_paint(self, user_id: int, paint_id: int) -> Dict[str, Any]:
        if not user_id or user_id <= 0:
            return {
                'code': 1,
                'msg': '用户ID无效',
                'data': None
            }

        if not paint_id or paint_id <= 0:
            return {
                'code': 1,
                'msg': '油漆ID无效',
                'data': None
            }

        buyer = self.user_model.get_by_id(user_id)
        if not buyer:
            return {
                'code': 1,
                'msg': '购买用户不存在',
                'data': None
            }

        paint = self.paint_model.get_by_id(paint_id)
        if not paint:
            return {
                'code': 1,
                'msg': '油漆不存在',
                'data': None
            }

        if paint.get('is_public', 0) != 1:
            return {
                'code': 1,
                'msg': '该油漆未公开，无法购买',
                'data': None
            }

        if paint.get('user_id') == user_id:
            return {
                'code': 1,
                'msg': '不能购买自己创建的油漆',
                'data': None
            }

        price = paint.get('price', 0)
        buyer_coins = buyer.get('coins', 0)

        if buyer_coins < price:
            return {
                'code': 1,
                'msg': f'金币不足，需要 {price} 金币，当前只有 {buyer_coins} 金币',
                'data': None
            }

        seller_id = paint.get('user_id')
        seller = self.user_model.get_by_id(seller_id)
        if not seller:
            return {
                'code': 1,
                'msg': '卖家不存在',
                'data': None
            }

        new_paint_id = self.paint_model.create(
            name=paint.get('name', ''),
            type=paint.get('type', ''),
            color_hex=paint.get('color_hex', ''),
            price=0,
            user_id=user_id,
            is_public=0
        )

        if new_paint_id > 0:
            self.user_model.update_coins(user_id, -price)
            self.user_model.update_coins(seller_id, price)

            new_paint = self.paint_model.get_by_id(new_paint_id)
            new_paint['type_text'] = self.paint_model.get_type_text(new_paint.get('type', ''))

            updated_buyer = self.user_model.get_by_id(user_id)

            return {
                'code': 0,
                'msg': '油漆购买成功',
                'data': {
                    'paint': new_paint,
                    'remaining_coins': updated_buyer.get('coins', 0)
                }
            }

        return {
            'code': 1,
            'msg': '油漆购买失败',
            'data': None
        }
