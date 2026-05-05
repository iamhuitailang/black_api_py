from typing import Dict, Any, List, Optional
from app.model.dota import DotaEquipmentModel, DotaUserEquipmentModel, DotaUserModel, DotaHeroModel


class DotaEquipmentBusiness:
    def __init__(self):
        self.equipment_model = DotaEquipmentModel()
        self.user_equipment_model = DotaUserEquipmentModel()
        self.user_model = DotaUserModel()
        self.hero_model = DotaHeroModel()

    def get_all_equipment(self) -> Dict[str, Any]:
        items = self.equipment_model.get_all()
        return {
            'code': 0,
            'msg': 'success',
            'data': [self.equipment_model.to_dict(i) for i in items]
        }

    def get_shop_items(self, user_id: int = None, hero_type: str = None) -> Dict[str, Any]:
        if hero_type:
            items = self.equipment_model.get_available_for_hero(hero_type)
        else:
            items = self.equipment_model.get_all()

        result = []
        for item in items:
            item_dict = self.equipment_model.to_dict(item)

            if user_id:
                user = self.user_model.get_by_id(user_id)
                if user:
                    item_dict['can_buy'] = user.get('gold', 0) >= item.get('price', 0)

                    user_item = self.user_equipment_model.get_by_user_equipment(user_id, item.get('id'))
                    if user_item:
                        item_dict['owned_quantity'] = user_item.get('quantity', 0)
                        item_dict['is_equipped'] = user_item.get('is_equipped', 0) == 1

            result.append(item_dict)

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_user_inventory(self, user_id: int) -> Dict[str, Any]:
        user_items = self.user_equipment_model.get_by_user(user_id)

        result = []
        for ui in user_items:
            equipment = self.equipment_model.get_by_id(ui.get('equipment_id'))
            if equipment:
                result.append({
                    **self.equipment_model.to_dict(equipment),
                    'user_equipment': self.user_equipment_model.to_dict(ui)
                })

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_equipped_items(self, user_id: int) -> Dict[str, Any]:
        equipped = self.user_equipment_model.get_equipped(user_id)

        result = []
        for ui in equipped:
            equipment = self.equipment_model.get_by_id(ui.get('equipment_id'))
            if equipment:
                result.append({
                    **self.equipment_model.to_dict(equipment),
                    'user_equipment': self.user_equipment_model.to_dict(ui)
                })

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def buy_equipment(self, user_id: int, equipment_id: int, quantity: int = 1) -> Dict[str, Any]:
        if quantity <= 0:
            return {
                'code': 1,
                'msg': '数量必须大于0',
                'data': None
            }

        equipment = self.equipment_model.get_by_id(equipment_id)
        if not equipment:
            return {
                'code': 1,
                'msg': '装备不存在',
                'data': None
            }

        price = equipment.get('price', 0)
        total_cost = price * quantity

        user = self.user_model.get_by_id(user_id)
        if not user or user.get('gold', 0) < total_cost:
            return {
                'code': 1,
                'msg': '金币不足',
                'data': None
            }

        self.user_model.update_gold(user_id, -total_cost)
        self.user_equipment_model.add_or_update(user_id, equipment_id, quantity)

        updated_user = self.user_model.get_by_id(user_id)

        return {
            'code': 0,
            'msg': '购买成功',
            'data': {'gold': updated_user.get('gold', 0)}
        }

    def equip_item(self, user_id: int, equipment_id: int) -> Dict[str, Any]:
        user_item = self.user_equipment_model.get_by_user_equipment(user_id, equipment_id)
        if not user_item or user_item.get('quantity', 0) <= 0:
            return {
                'code': 1,
                'msg': '您没有该装备',
                'data': None
            }

        if user_item.get('is_equipped', 0) == 1:
            return {
                'code': 0,
                'msg': '已装备',
                'data': None
            }

        self.user_equipment_model.equip(user_id, equipment_id)

        bonuses = self.user_equipment_model.get_total_bonuses(user_id)

        return {
            'code': 0,
            'msg': '装备成功',
            'data': bonuses
        }

    def unequip_item(self, user_id: int, equipment_id: int) -> Dict[str, Any]:
        user_item = self.user_equipment_model.get_by_user_equipment(user_id, equipment_id)
        if not user_item:
            return {
                'code': 1,
                'msg': '您没有该装备',
                'data': None
            }

        if user_item.get('is_equipped', 0) == 0:
            return {
                'code': 0,
                'msg': '未装备',
                'data': None
            }

        self.user_equipment_model.unequip(user_id, equipment_id)

        bonuses = self.user_equipment_model.get_total_bonuses(user_id)

        return {
            'code': 0,
            'msg': '卸下成功',
            'data': bonuses
        }

    def get_total_bonuses(self, user_id: int) -> Dict[str, Any]:
        bonuses = self.user_equipment_model.get_total_bonuses(user_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': bonuses
        }
