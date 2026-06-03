from typing import Dict, Any, Optional
from app.model.hd_model import EquipmentModel, UserEquipmentModel, UserModel


class HdEquipmentBusiness:
    def __init__(self):
        self.equipment_model = EquipmentModel()
        self.user_equipment_model = UserEquipmentModel()
        self.user_model = UserModel()

    def _to_equipment_dict(self, equipment: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': equipment.get('id'),
            'name': equipment.get('name'),
            'description': equipment.get('description'),
            'type': equipment.get('type'),
            'type_text': self.equipment_model.get_type_text(equipment.get('type')),
            'level': equipment.get('level'),
            'attack': equipment.get('attack'),
            'defense': equipment.get('defense'),
            'hp': equipment.get('hp'),
            'chakra': equipment.get('chakra'),
            'price': equipment.get('price'),
            'icon': equipment.get('icon'),
            'created_at': equipment.get('created_at')
        }

    def _to_user_equipment_dict(self, user_eq: Dict[str, Any], equipment: Dict[str, Any] = None) -> Dict[str, Any]:
        if equipment is None:
            equipment = self.equipment_model.get_by_id(user_eq.get('equipment_id'))
        
        result = {
            'id': user_eq.get('id'),
            'user_id': user_eq.get('user_id'),
            'equipment_id': user_eq.get('equipment_id'),
            'level': user_eq.get('level'),
            'is_equipped': user_eq.get('is_equipped'),
            'slot': user_eq.get('slot'),
            'slot_text': self.user_equipment_model.get_slot_text(user_eq.get('slot')),
            'created_at': user_eq.get('created_at'),
            'updated_at': user_eq.get('updated_at')
        }

        if equipment:
            base_attack = equipment.get('attack', 0)
            base_defense = equipment.get('defense', 0)
            base_hp = equipment.get('hp', 0)
            base_chakra = equipment.get('chakra', 0)
            level_multiplier = 1 + (user_eq.get('level', 1) - 1) * 0.1

            result['equipment'] = {
                'id': equipment.get('id'),
                'name': equipment.get('name'),
                'description': equipment.get('description'),
                'type': equipment.get('type'),
                'type_text': self.equipment_model.get_type_text(equipment.get('type')),
                'base_level': equipment.get('level'),
                'base_attack': base_attack,
                'base_defense': base_defense,
                'base_hp': base_hp,
                'base_chakra': base_chakra,
                'attack': int(base_attack * level_multiplier),
                'defense': int(base_defense * level_multiplier),
                'hp': int(base_hp * level_multiplier),
                'chakra': int(base_chakra * level_multiplier),
                'price': equipment.get('price'),
                'icon': equipment.get('icon')
            }

        return result

    def get_all_equipments(self, type: int = None, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.equipment_model.get_all(page=page, page_size=page_size, type=type)
        
        items = []
        for eq in result.get('items', []):
            items.append(self._to_equipment_dict(eq))

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

    def get_user_equipments(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        user_eqs = self.user_equipment_model.get_user_equipments(user_id)
        
        items = []
        for user_eq in user_eqs:
            items.append(self._to_user_equipment_dict(user_eq))

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def buy_equipment(self, user_id: int, equipment_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
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
        user_gold = user.get('gold', 0)
        if user_gold < price:
            return {
                'code': 1,
                'msg': '金币不足',
                'data': None
            }

        eq_type = equipment.get('type')
        slot_map = {
            EquipmentModel.TYPE_WEAPON: UserEquipmentModel.SLOT_WEAPON,
            EquipmentModel.TYPE_ARMOR: UserEquipmentModel.SLOT_ARMOR,
            EquipmentModel.TYPE_ACCESSORY: UserEquipmentModel.SLOT_ACCESSORY
        }
        slot = slot_map.get(eq_type, UserEquipmentModel.SLOT_WEAPON)

        affected = self.user_model.update_gold(user_id, -price)
        if affected <= 0:
            return {
                'code': 1,
                'msg': '购买失败，金币扣除失败',
                'data': None
            }

        user_eq_id = self.user_equipment_model.create(
            user_id=user_id,
            equipment_id=equipment_id,
            slot=slot,
            level=1,
            is_equipped=0
        )

        if user_eq_id > 0:
            user_eq = self.user_equipment_model.get_by_id(user_eq_id)
            return {
                'code': 0,
                'msg': '购买成功',
                'data': self._to_user_equipment_dict(user_eq, equipment)
            }

        self.user_model.update_gold(user_id, price)
        return {
            'code': 1,
            'msg': '购买失败',
            'data': None
        }

    def equip_item(self, user_id: int, user_equipment_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        user_eq = self.user_equipment_model.get_by_id(user_equipment_id)
        if not user_eq:
            return {
                'code': 1,
                'msg': '用户装备不存在',
                'data': None
            }

        if user_eq.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '该装备不属于当前用户',
                'data': None
            }

        if user_eq.get('is_equipped') == 1:
            return {
                'code': 1,
                'msg': '该装备已装备',
                'data': None
            }

        success = self.user_equipment_model.equip(user_id, user_equipment_id)
        if success:
            updated_eq = self.user_equipment_model.get_by_id(user_equipment_id)
            return {
                'code': 0,
                'msg': '装备成功',
                'data': self._to_user_equipment_dict(updated_eq)
            }

        return {
            'code': 1,
            'msg': '装备失败',
            'data': None
        }

    def unequip_item(self, user_id: int, user_equipment_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        user_eq = self.user_equipment_model.get_by_id(user_equipment_id)
        if not user_eq:
            return {
                'code': 1,
                'msg': '用户装备不存在',
                'data': None
            }

        if user_eq.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '该装备不属于当前用户',
                'data': None
            }

        if user_eq.get('is_equipped') != 1:
            return {
                'code': 1,
                'msg': '该装备未装备',
                'data': None
            }

        success = self.user_equipment_model.unequip(user_id, user_equipment_id)
        if success:
            updated_eq = self.user_equipment_model.get_by_id(user_equipment_id)
            return {
                'code': 0,
                'msg': '卸下成功',
                'data': self._to_user_equipment_dict(updated_eq)
            }

        return {
            'code': 1,
            'msg': '卸下失败',
            'data': None
        }

    def upgrade_equipment(self, user_id: int, user_equipment_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        user_eq = self.user_equipment_model.get_by_id(user_equipment_id)
        if not user_eq:
            return {
                'code': 1,
                'msg': '用户装备不存在',
                'data': None
            }

        if user_eq.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '该装备不属于当前用户',
                'data': None
            }

        equipment = self.equipment_model.get_by_id(user_eq.get('equipment_id'))
        if not equipment:
            return {
                'code': 1,
                'msg': '装备不存在',
                'data': None
            }

        current_level = user_eq.get('level', 1)
        upgrade_cost = equipment.get('price', 0) * current_level

        user_gold = user.get('gold', 0)
        if user_gold < upgrade_cost:
            return {
                'code': 1,
                'msg': f'金币不足，升级需要{upgrade_cost}金币',
                'data': None
            }

        affected = self.user_model.update_gold(user_id, -upgrade_cost)
        if affected <= 0:
            return {
                'code': 1,
                'msg': '升级失败，金币扣除失败',
                'data': None
            }

        updated_eq = self.user_equipment_model.upgrade_equipment(user_id, user_equipment_id)
        if updated_eq:
            return {
                'code': 0,
                'msg': '升级成功',
                'data': self._to_user_equipment_dict(updated_eq, equipment)
            }

        self.user_model.update_gold(user_id, upgrade_cost)
        return {
            'code': 1,
            'msg': '升级失败',
            'data': None
        }

    def get_equipment_detail(self, equipment_id: int) -> Dict[str, Any]:
        equipment = self.equipment_model.get_by_id(equipment_id)
        if not equipment:
            return {
                'code': 1,
                'msg': '装备不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self._to_equipment_dict(equipment)
        }

    def create_equipment(self, data: Dict[str, Any]) -> Dict[str, Any]:
        name = data.get('name', '').strip()
        if not name:
            return {
                'code': 1,
                'msg': '装备名称不能为空',
                'data': None
            }

        eq_type = data.get('type')
        if eq_type not in [EquipmentModel.TYPE_WEAPON, EquipmentModel.TYPE_ARMOR, EquipmentModel.TYPE_ACCESSORY]:
            return {
                'code': 1,
                'msg': '装备类型不正确',
                'data': None
            }

        equipment_id = self.equipment_model.create(
            name=name,
            description=data.get('description', ''),
            type=eq_type,
            level=data.get('level', 1),
            attack=data.get('attack', 0),
            defense=data.get('defense', 0),
            hp=data.get('hp', 0),
            chakra=data.get('chakra', 0),
            price=data.get('price', 0),
            icon=data.get('icon', '')
        )

        if equipment_id > 0:
            equipment = self.equipment_model.get_by_id(equipment_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self._to_equipment_dict(equipment)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_equipment(self, equipment_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        equipment = self.equipment_model.get_by_id(equipment_id)
        if not equipment:
            return {
                'code': 1,
                'msg': '装备不存在',
                'data': None
            }

        if 'type' in data and data['type'] not in [EquipmentModel.TYPE_WEAPON, EquipmentModel.TYPE_ARMOR, EquipmentModel.TYPE_ACCESSORY]:
            return {
                'code': 1,
                'msg': '装备类型不正确',
                'data': None
            }

        affected = self.equipment_model.update(
            equipment_id,
            name=data.get('name'),
            description=data.get('description'),
            type=data.get('type'),
            level=data.get('level'),
            attack=data.get('attack'),
            defense=data.get('defense'),
            hp=data.get('hp'),
            chakra=data.get('chakra'),
            price=data.get('price'),
            icon=data.get('icon')
        )

        if affected >= 0:
            updated_equipment = self.equipment_model.get_by_id(equipment_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self._to_equipment_dict(updated_equipment)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_equipment(self, equipment_id: int) -> Dict[str, Any]:
        equipment = self.equipment_model.get_by_id(equipment_id)
        if not equipment:
            return {
                'code': 1,
                'msg': '装备不存在',
                'data': None
            }

        affected = self.equipment_model.delete(equipment_id)
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
