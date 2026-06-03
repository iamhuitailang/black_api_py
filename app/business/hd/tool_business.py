from typing import Dict, Any, Optional
from app.model.hd_model import ToolModel, UserToolModel, UserModel


class HdToolBusiness:
    def __init__(self):
        self.tool_model = ToolModel()
        self.user_tool_model = UserToolModel()
        self.user_model = UserModel()

    def _to_tool_dict(self, tool: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': tool.get('id'),
            'name': tool.get('name'),
            'description': tool.get('description'),
            'type': tool.get('type'),
            'type_text': self.tool_model.get_type_text(tool.get('type')),
            'effect': tool.get('effect'),
            'damage': tool.get('damage'),
            'heal': tool.get('heal'),
            'duration': tool.get('duration'),
            'price': tool.get('price'),
            'icon': tool.get('icon'),
            'created_at': tool.get('created_at')
        }

    def _to_user_tool_dict(self, user_tool: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': user_tool.get('id'),
            'user_id': user_tool.get('user_id'),
            'tool_id': user_tool.get('tool_id'),
            'quantity': user_tool.get('quantity'),
            'name': user_tool.get('name'),
            'description': user_tool.get('description'),
            'type': user_tool.get('type'),
            'type_text': self.tool_model.get_type_text(user_tool.get('type')),
            'effect': user_tool.get('effect'),
            'damage': user_tool.get('damage'),
            'heal': user_tool.get('heal'),
            'duration': user_tool.get('duration'),
            'price': user_tool.get('price'),
            'icon': user_tool.get('icon'),
            'created_at': user_tool.get('created_at'),
            'updated_at': user_tool.get('updated_at')
        }

    def get_all_tools(self, type: int = None, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.tool_model.get_all(page=page, page_size=page_size, type=type)
        
        items = []
        for tool in result.get('items', []):
            items.append(self._to_tool_dict(tool))

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

    def get_user_tools(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        user_tools = self.user_tool_model.get_user_tools(user_id)
        
        items = []
        for user_tool in user_tools:
            items.append(self._to_user_tool_dict(user_tool))

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def buy_tool(self, user_id: int, tool_id: int, quantity: int = 1) -> Dict[str, Any]:
        if quantity <= 0:
            return {
                'code': 1,
                'msg': '购买数量必须大于0',
                'data': None
            }

        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        tool = self.tool_model.get_by_id(tool_id)
        if not tool:
            return {
                'code': 1,
                'msg': '忍具不存在',
                'data': None
            }

        total_price = tool.get('price', 0) * quantity
        user_gold = user.get('gold', 0)
        if user_gold < total_price:
            return {
                'code': 1,
                'msg': f'金币不足，购买需要{total_price}金币',
                'data': None
            }

        affected = self.user_model.update_gold(user_id, -total_price)
        if affected <= 0:
            return {
                'code': 1,
                'msg': '购买失败，金币扣除失败',
                'data': None
            }

        result = self.user_tool_model.add_tool(user_id, tool_id, quantity)
        if result:
            return {
                'code': 0,
                'msg': '购买成功',
                'data': {
                    'id': result.get('id'),
                    'user_id': result.get('user_id'),
                    'tool_id': result.get('tool_id'),
                    'quantity': result.get('quantity'),
                    'tool': self._to_tool_dict(tool)
                }
            }

        self.user_model.update_gold(user_id, total_price)
        return {
            'code': 1,
            'msg': '购买失败',
            'data': None
        }

    def use_tool(self, user_id: int, tool_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        tool = self.tool_model.get_by_id(tool_id)
        if not tool:
            return {
                'code': 1,
                'msg': '忍具不存在',
                'data': None
            }

        user_tool = self.user_tool_model.get_user_tool(user_id, tool_id)
        if not user_tool or user_tool.get('quantity', 0) <= 0:
            return {
                'code': 1,
                'msg': '忍具数量不足',
                'data': None
            }

        tool_type = tool.get('type')
        effect_data = {
            'type': tool_type,
            'type_text': self.tool_model.get_type_text(tool_type),
            'name': tool.get('name'),
            'effect': tool.get('effect'),
            'damage': tool.get('damage'),
            'heal': tool.get('heal'),
            'duration': tool.get('duration')
        }

        result = self.user_tool_model.use_tool(user_id, tool_id, 1)
        
        remaining_quantity = 0
        if result:
            remaining_quantity = result.get('quantity', 0)

        if tool_type == ToolModel.TYPE_HEAL and tool.get('heal', 0) > 0:
            heal_amount = tool.get('heal', 0)
            current_chakra = user.get('chakra', 0)
            max_chakra = user.get('max_chakra', 100)
            new_chakra = min(max_chakra, current_chakra + heal_amount)
            self.user_model.update_chakra(user_id, new_chakra - current_chakra)
            effect_data['actual_heal'] = new_chakra - current_chakra

        return {
            'code': 0,
            'msg': '使用成功',
            'data': {
                'effect': effect_data,
                'remaining_quantity': remaining_quantity
            }
        }

    def get_tool_detail(self, tool_id: int) -> Dict[str, Any]:
        tool = self.tool_model.get_by_id(tool_id)
        if not tool:
            return {
                'code': 1,
                'msg': '忍具不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self._to_tool_dict(tool)
        }

    def create_tool(self, data: Dict[str, Any]) -> Dict[str, Any]:
        name = data.get('name', '').strip()
        if not name:
            return {
                'code': 1,
                'msg': '忍具名称不能为空',
                'data': None
            }

        tool_type = data.get('type')
        if tool_type not in [ToolModel.TYPE_ATTACK, ToolModel.TYPE_SUPPORT, ToolModel.TYPE_HEAL, ToolModel.TYPE_TRAP]:
            return {
                'code': 1,
                'msg': '忍具类型不正确',
                'data': None
            }

        tool_id = self.tool_model.create(
            name=name,
            description=data.get('description', ''),
            type=tool_type,
            effect=data.get('effect', ''),
            damage=data.get('damage', 0),
            heal=data.get('heal', 0),
            duration=data.get('duration', 0),
            price=data.get('price', 0),
            icon=data.get('icon', '')
        )

        if tool_id > 0:
            tool = self.tool_model.get_by_id(tool_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self._to_tool_dict(tool)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_tool(self, tool_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        tool = self.tool_model.get_by_id(tool_id)
        if not tool:
            return {
                'code': 1,
                'msg': '忍具不存在',
                'data': None
            }

        if 'type' in data and data['type'] not in [ToolModel.TYPE_ATTACK, ToolModel.TYPE_SUPPORT, ToolModel.TYPE_HEAL, ToolModel.TYPE_TRAP]:
            return {
                'code': 1,
                'msg': '忍具类型不正确',
                'data': None
            }

        affected = self.tool_model.update(
            tool_id,
            name=data.get('name'),
            description=data.get('description'),
            type=data.get('type'),
            effect=data.get('effect'),
            damage=data.get('damage'),
            heal=data.get('heal'),
            duration=data.get('duration'),
            price=data.get('price'),
            icon=data.get('icon')
        )

        if affected >= 0:
            updated_tool = self.tool_model.get_by_id(tool_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self._to_tool_dict(updated_tool)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_tool(self, tool_id: int) -> Dict[str, Any]:
        tool = self.tool_model.get_by_id(tool_id)
        if not tool:
            return {
                'code': 1,
                'msg': '忍具不存在',
                'data': None
            }

        affected = self.tool_model.delete(tool_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '删除成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '删除失败',
            'data': None
        }
