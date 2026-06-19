import random
from typing import Dict, Any, List, Optional
from app.model.game import (
    SaveModel, PlanetModel, EquipmentModel, ItemModel, InventoryModel
)


class ShopBusiness:
    def __init__(self):
        self.save_model = SaveModel()
        self.planet_model = PlanetModel()
        self.equipment_model = EquipmentModel()
        self.item_model = ItemModel()
        self.inventory_model = InventoryModel()

    def get_shop_inventory(self, save_id: int) -> Dict[str, Any]:
        try:
            save = self.save_model.get_by_id(save_id)
            if not save:
                return {'code': 1, 'message': '存档不存在', 'data': None}

            planet = self.planet_model.get_by_id(save['current_planet_id'])
            if not planet or not planet.get('has_shop'):
                return {'code': 1, 'message': '该空间站没有商店', 'data': None}

            all_equipment = self.equipment_model.get_all()
            all_items = self.item_model.get_all()

            faction = planet['faction']
            danger = planet.get('danger_level', 1)

            filtered_equipment = []
            for eq in all_equipment:
                price_modifier = 1.0
                if faction == 'military':
                    if eq['slot_type'] in ('weapon', 'hull'):
                        price_modifier = 0.9
                    elif eq['slot_type'] == 'shield':
                        price_modifier = 0.95
                elif faction == 'pirate':
                    if eq['slot_type'] == 'weapon':
                        price_modifier = 0.85
                    elif eq['rarity'] == 'rare':
                        price_modifier = 0.9
                elif faction == 'corporate':
                    if eq['slot_type'] == 'engine':
                        price_modifier = 0.9
                    elif eq['rarity'] == 'rare':
                        price_modifier = 1.1

                if eq['tier'] > danger + 2:
                    continue

                filtered_equipment.append({
                    **eq,
                    'shop_price': int(eq['price'] * price_modifier)
                })

            filtered_items = []
            for it in all_items:
                price_modifier = 1.0
                if faction == 'pirate' and 'EMP' in it['name']:
                    price_modifier = 0.85
                elif faction == 'corporate' and it['rarity'] in ('uncommon', 'rare'):
                    price_modifier = 0.95

                if it['rarity'] == 'rare' and danger < 3:
                    continue

                filtered_items.append({
                    **it,
                    'shop_price': int(it['price'] * price_modifier)
                })

            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'planet': planet,
                    'equipment': filtered_equipment,
                    'items': filtered_items,
                    'player_credits': save['credits'],
                }
            }
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def buy_equipment(self, save_id: int, equipment_id: int) -> Dict[str, Any]:
        try:
            save = self.save_model.get_by_id(save_id)
            if not save:
                return {'code': 1, 'message': '存档不存在', 'data': None}

            planet = self.planet_model.get_by_id(save['current_planet_id'])
            if not planet or not planet.get('has_shop'):
                return {'code': 1, 'message': '该空间站没有商店', 'data': None}

            equip = self.equipment_model.get_by_id(equipment_id)
            if not equip:
                return {'code': 1, 'message': '装备不存在', 'data': None}

            price_modifier = 1.0
            faction = planet['faction']
            if faction == 'military':
                if equip['slot_type'] in ('weapon', 'hull'):
                    price_modifier = 0.9
                elif equip['slot_type'] == 'shield':
                    price_modifier = 0.95
            elif faction == 'pirate':
                if equip['slot_type'] == 'weapon':
                    price_modifier = 0.85
                elif equip['rarity'] == 'rare':
                    price_modifier = 0.9
            elif faction == 'corporate':
                if equip['slot_type'] == 'engine':
                    price_modifier = 0.9

            final_price = int(equip['price'] * price_modifier)
            if save['credits'] < final_price:
                return {'code': 1, 'message': f'星币不足，需要 {final_price} 星币', 'data': None}

            self.save_model.update(save_id, credits=save['credits'] - final_price)
            self.inventory_model.create(save_id, 'equipment', equipment_id, 1, 0)

            return self.get_shop_inventory(save_id)
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def buy_item(self, save_id: int, item_id: int, quantity: int = 1) -> Dict[str, Any]:
        try:
            save = self.save_model.get_by_id(save_id)
            if not save:
                return {'code': 1, 'message': '存档不存在', 'data': None}

            planet = self.planet_model.get_by_id(save['current_planet_id'])
            if not planet or not planet.get('has_shop'):
                return {'code': 1, 'message': '该空间站没有商店', 'data': None}

            item = self.item_model.get_by_id(item_id)
            if not item:
                return {'code': 1, 'message': '道具不存在', 'data': None}

            price_modifier = 1.0
            faction = planet['faction']
            if faction == 'pirate' and 'EMP' in item['name']:
                price_modifier = 0.85
            elif faction == 'corporate' and item['rarity'] in ('uncommon', 'rare'):
                price_modifier = 0.95

            unit_price = int(item['price'] * price_modifier)
            total_price = unit_price * quantity

            if save['credits'] < total_price:
                return {'code': 1, 'message': f'星币不足，需要 {total_price} 星币', 'data': None}

            self.save_model.update(save_id, credits=save['credits'] - total_price)
            self.inventory_model.create(save_id, 'item', item_id, quantity, 0)

            return self.get_shop_inventory(save_id)
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def sell_item(self, save_id: int, inventory_id: int, quantity: int = 1) -> Dict[str, Any]:
        try:
            save = self.save_model.get_by_id(save_id)
            if not save:
                return {'code': 1, 'message': '存档不存在', 'data': None}

            planet = self.planet_model.get_by_id(save['current_planet_id'])
            if not planet or not planet.get('has_shop'):
                return {'code': 1, 'message': '该空间站没有商店', 'data': None}

            inv = self.inventory_model.get_by_id(inventory_id)
            if not inv or inv['save_id'] != save_id:
                return {'code': 1, 'message': '物品不存在', 'data': None}

            if quantity > inv['quantity']:
                return {'code': 1, 'message': '数量不足', 'data': None}

            item = None
            if inv['item_type'] == 'equipment':
                item = self.equipment_model.get_by_id(inv['item_id'])
            elif inv['item_type'] == 'item':
                item = self.item_model.get_by_id(inv['item_id'])

            if not item:
                return {'code': 1, 'message': '物品数据丢失', 'data': None}

            base_price = item.get('price', 0)
            sell_price = int(base_price * 0.5) * quantity

            if inv.get('is_equipped'):
                return {'code': 1, 'message': '请先卸下装备再出售', 'data': None}

            new_quantity = inv['quantity'] - quantity
            self.inventory_model.update_quantity(inventory_id, new_quantity)
            self.save_model.update(save_id, credits=save['credits'] + sell_price)

            return self.get_shop_inventory(save_id)
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}
