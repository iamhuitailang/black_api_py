from typing import Dict, Any, Optional, List
from app.model.sj_model import SjInventoryModel, SjCharacterModel


class SjInventoryBusiness:
    def __init__(self):
        self.inventory_model = SjInventoryModel()
        self.character_model = SjCharacterModel()

    def get_inventory(self, character_id: int) -> Dict[str, Any]:
        items = self.inventory_model.get_by_character(character_id)
        result = [self.inventory_model.to_dict(i) for i in items]
        return {'code': 0, 'msg': 'success', 'data': result}

    def get_equipped(self, character_id: int) -> Dict[str, Any]:
        items = self.inventory_model.get_equipped(character_id)
        result = [self.inventory_model.to_dict(i) for i in items]
        return {'code': 0, 'msg': 'success', 'data': result}

    def add_item(self, character_id: int, item_data: Dict[str, Any]) -> Dict[str, Any]:
        if not item_data.get('item_id') or not item_data.get('item_name'):
            return {'code': 1, 'msg': '物品信息不完整', 'data': None}

        inventory_id = self.inventory_model.create(
            character_id=character_id,
            item_id=item_data.get('item_id'),
            item_name=item_data.get('item_name'),
            item_type=item_data.get('item_type', 'material'),
            rarity=item_data.get('rarity', 0),
            attack_bonus=item_data.get('attack_bonus', 0),
            defense_bonus=item_data.get('defense_bonus', 0),
            hp_bonus=item_data.get('hp_bonus', 0),
            mp_bonus=item_data.get('mp_bonus', 0),
            speed_bonus=item_data.get('speed_bonus', 0),
            special_effect=item_data.get('special_effect', ''),
            quantity=item_data.get('quantity', 1)
        )

        if inventory_id > 0:
            item = self.inventory_model.get_by_id(inventory_id)
            return {'code': 0, 'msg': '物品添加成功', 'data': self.inventory_model.to_dict(item)}
        return {'code': 1, 'msg': '物品添加失败', 'data': None}

    def equip_item(self, inventory_id: int, character_id: int) -> Dict[str, Any]:
        item = self.inventory_model.get_by_id(inventory_id)
        if not item:
            return {'code': 1, 'msg': '物品不存在', 'data': None}
        if item.get('character_id') != character_id:
            return {'code': 1, 'msg': '无权操作', 'data': None}

        equipped_same_type = self.inventory_model.query.find_all({
            'character_id': character_id,
            'item_type': item.get('item_type'),
            'equipped': 1
        })

        for old_item in equipped_same_type:
            self.inventory_model.update_equipped(old_item.get('id'), 0)
            self._remove_stat_bonus(character_id, old_item)

        self.inventory_model.update_equipped(inventory_id, 1)
        self._apply_stat_bonus(character_id, item)

        character = self.character_model.get_by_id(character_id)
        return {
            'code': 0,
            'msg': '装备成功',
            'data': {
                'item': self.inventory_model.to_dict(item),
                'character': self.character_model.to_dict(character)
            }
        }

    def unequip_item(self, inventory_id: int, character_id: int) -> Dict[str, Any]:
        item = self.inventory_model.get_by_id(inventory_id)
        if not item:
            return {'code': 1, 'msg': '物品不存在', 'data': None}
        if item.get('character_id') != character_id:
            return {'code': 1, 'msg': '无权操作', 'data': None}
        if item.get('equipped') != 1:
            return {'code': 1, 'msg': '物品未装备', 'data': None}

        self.inventory_model.update_equipped(inventory_id, 0)
        self._remove_stat_bonus(character_id, item)

        character = self.character_model.get_by_id(character_id)
        return {
            'code': 0,
            'msg': '卸下装备成功',
            'data': {
                'item': self.inventory_model.to_dict(item),
                'character': self.character_model.to_dict(character)
            }
        }

    def remove_item(self, inventory_id: int, character_id: int) -> Dict[str, Any]:
        item = self.inventory_model.get_by_id(inventory_id)
        if not item:
            return {'code': 1, 'msg': '物品不存在', 'data': None}
        if item.get('character_id') != character_id:
            return {'code': 1, 'msg': '无权操作', 'data': None}

        if item.get('equipped') == 1:
            self._remove_stat_bonus(character_id, item)

        self.inventory_model.delete(inventory_id)
        return {'code': 0, 'msg': '物品已删除', 'data': None}

    def use_consumable(self, inventory_id: int, character_id: int) -> Dict[str, Any]:
        item = self.inventory_model.get_by_id(inventory_id)
        if not item:
            return {'code': 1, 'msg': '物品不存在', 'data': None}
        if item.get('character_id') != character_id:
            return {'code': 1, 'msg': '无权操作', 'data': None}
        if item.get('item_type') != SjInventoryModel.TYPE_CONSUMABLE:
            return {'code': 1, 'msg': '该物品不可使用', 'data': None}

        character = self.character_model.get_by_id(character_id)
        update_data = {}
        if item.get('hp_bonus', 0) > 0:
            update_data['hp'] = min(character.get('max_hp', 100), character.get('hp', 0) + item['hp_bonus'])
        if item.get('mp_bonus', 0) > 0:
            update_data['mp'] = min(character.get('max_mp', 30), character.get('mp', 0) + item['mp_bonus'])

        if update_data:
            self.character_model.update(character_id, update_data)

        new_quantity = item.get('quantity', 1) - 1
        if new_quantity <= 0:
            self.inventory_model.delete(inventory_id)
        else:
            self.inventory_model.update_quantity(inventory_id, new_quantity)

        updated = self.character_model.get_by_id(character_id)
        return {
            'code': 0,
            'msg': '使用成功',
            'data': {
                'character': self.character_model.to_dict(updated),
                'item_name': item.get('item_name'),
                'effects': update_data
            }
        }

    def _apply_stat_bonus(self, character_id: int, item: Dict):
        character = self.character_model.get_by_id(character_id)
        if not character:
            return
        update_data = {}
        if item.get('attack_bonus', 0) > 0:
            update_data['attack'] = character.get('attack', 0) + item['attack_bonus']
        if item.get('defense_bonus', 0) > 0:
            update_data['defense'] = character.get('defense', 0) + item['defense_bonus']
        if item.get('hp_bonus', 0) > 0:
            update_data['max_hp'] = character.get('max_hp', 0) + item['hp_bonus']
            update_data['hp'] = character.get('hp', 0) + item['hp_bonus']
        if item.get('mp_bonus', 0) > 0:
            update_data['max_mp'] = character.get('max_mp', 0) + item['mp_bonus']
            update_data['mp'] = character.get('mp', 0) + item['mp_bonus']
        if item.get('speed_bonus', 0) > 0:
            update_data['speed'] = character.get('speed', 0) + item['speed_bonus']
        if update_data:
            self.character_model.update(character_id, update_data)

    def _remove_stat_bonus(self, character_id: int, item: Dict):
        character = self.character_model.get_by_id(character_id)
        if not character:
            return
        update_data = {}
        if item.get('attack_bonus', 0) > 0:
            update_data['attack'] = max(1, character.get('attack', 0) - item['attack_bonus'])
        if item.get('defense_bonus', 0) > 0:
            update_data['defense'] = max(0, character.get('defense', 0) - item['defense_bonus'])
        if item.get('hp_bonus', 0) > 0:
            update_data['max_hp'] = max(1, character.get('max_hp', 0) - item['hp_bonus'])
            update_data['hp'] = min(character.get('hp', 0), update_data.get('max_hp', character.get('max_hp', 0)))
        if item.get('mp_bonus', 0) > 0:
            update_data['max_mp'] = max(1, character.get('max_mp', 0) - item['mp_bonus'])
            update_data['mp'] = min(character.get('mp', 0), update_data.get('max_mp', character.get('max_mp', 0)))
        if item.get('speed_bonus', 0) > 0:
            update_data['speed'] = max(1, character.get('speed', 0) - item['speed_bonus'])
        if update_data:
            self.character_model.update(character_id, update_data)
