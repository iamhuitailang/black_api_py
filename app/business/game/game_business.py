import json
import random
from typing import Dict, Any, List, Optional
from app.model.game import (
    SaveModel, ShipModel, PlanetModel, EquipmentModel,
    ItemModel, InventoryModel, ReputationModel, SkillModel,
    MissionTemplateModel, MissionModel, EnemyModel
)


class GameBusiness:
    def __init__(self):
        self.save_model = SaveModel()
        self.ship_model = ShipModel()
        self.planet_model = PlanetModel()
        self.equipment_model = EquipmentModel()
        self.item_model = ItemModel()
        self.inventory_model = InventoryModel()
        self.reputation_model = ReputationModel()
        self.skill_model = SkillModel()
        self.mission_template_model = MissionTemplateModel()
        self.mission_model = MissionModel()
        self.enemy_model = EnemyModel()

    def init_new_game(self, player_name: str = '漂泊者') -> Dict[str, Any]:
        try:
            save_id = self.save_model.create(player_name=player_name)

            ship_id = self.ship_model.create(
                save_id=save_id,
                name='破船号',
                model='scavenger',
                max_hull=100, current_hull=100,
                max_shield=50, current_shield=50,
                shield_regen=5, base_attack=15,
                base_defense=5, evasion=10
            )
            self.save_model.update(save_id, ship_id=ship_id)

            self.inventory_model.create(save_id, 'equipment', 1, 1, 1)
            self.inventory_model.create(save_id, 'equipment', 4, 1, 1)
            self.inventory_model.create(save_id, 'equipment', 7, 1, 1)
            self.inventory_model.create(save_id, 'equipment', 10, 1, 1)
            self.inventory_model.create(save_id, 'item', 1, 3)
            self.inventory_model.create(save_id, 'item', 4, 2)

            return self.get_full_game_state(save_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_full_game_state(self, save_id: int) -> Dict[str, Any]:
        try:
            save = self.save_model.get_by_id(save_id)
            if not save:
                return {'code': 1, 'message': '存档不存在', 'data': None}

            ship = self.ship_model.get_by_id(save['ship_id'])
            planet = self.planet_model.get_by_id(save['current_planet_id'])
            equipment_list = self.inventory_model.get_equipment(save_id)
            item_list = self.inventory_model.get_items(save_id)
            active_mission = self.mission_model.get_active_by_save_id(save_id)

            attack_bonus = 0
            defense_bonus = 0
            shield_bonus = 0
            hull_bonus = 0
            shield_regen_bonus = 0
            evasion_bonus = 0
            for eq in equipment_list:
                if eq.get('is_equipped'):
                    attack_bonus += eq.get('attack_bonus', 0)
                    defense_bonus += eq.get('defense_bonus', 0)
                    shield_bonus += eq.get('shield_bonus', 0)
                    hull_bonus += eq.get('hull_bonus', 0)
                    shield_regen_bonus += eq.get('shield_regen_bonus', 0)
                    evasion_bonus += eq.get('evasion_bonus', 0)

            total_attack = ship['base_attack'] + attack_bonus
            total_defense = ship['base_defense'] + defense_bonus
            total_shield = ship['max_shield'] + shield_bonus
            total_hull = ship['max_hull'] + hull_bonus
            total_regen = ship['shield_regen'] + shield_regen_bonus
            total_evasion = ship['evasion'] + evasion_bonus

            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'save': save,
                    'ship': {
                        **ship,
                        'total_attack': total_attack,
                        'total_defense': total_defense,
                        'total_max_shield': total_shield,
                        'total_max_hull': total_hull,
                        'total_shield_regen': total_regen,
                        'total_evasion': total_evasion,
                    },
                    'current_planet': planet,
                    'equipment': equipment_list,
                    'items': item_list,
                    'active_mission': active_mission,
                    'stats_breakdown': {
                        'attack_bonus': attack_bonus,
                        'defense_bonus': defense_bonus,
                        'shield_bonus': shield_bonus,
                        'hull_bonus': hull_bonus,
                        'shield_regen_bonus': shield_regen_bonus,
                        'evasion_bonus': evasion_bonus,
                    }
                }
            }
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def get_all_saves(self) -> Dict[str, Any]:
        try:
            saves = self.save_model.get_all()
            return {'code': 0, 'message': 'success', 'data': saves}
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def get_planet_list(self) -> Dict[str, Any]:
        try:
            planets = self.planet_model.get_all()
            return {'code': 0, 'message': 'success', 'data': planets}
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def travel_to_planet(self, save_id: int, planet_id: int) -> Dict[str, Any]:
        try:
            save = self.save_model.get_by_id(save_id)
            if not save:
                return {'code': 1, 'message': '存档不存在', 'data': None}

            target_planet = self.planet_model.get_by_id(planet_id)
            if not target_planet:
                return {'code': 1, 'message': '目标星球不存在', 'data': None}

            ship = self.ship_model.get_by_id(save['ship_id'])
            if ship['current_hull'] <= 0:
                return {'code': 1, 'message': '船体损毁，无法跃迁', 'data': None}

            travel_cost = 0
            travel_damage = 0
            source_planet = self.planet_model.get_by_id(save['current_planet_id'])
            if source_planet:
                dx = target_planet['pos_x'] - source_planet['pos_x']
                dy = target_planet['pos_y'] - source_planet['pos_y']
                distance = (dx * dx + dy * dy) ** 0.5
                travel_cost = int(distance * 2)
                travel_damage = int(target_planet['danger_level'] * random.uniform(0, 3))

                if save['credits'] < travel_cost:
                    return {'code': 1, 'message': f'星币不足，跃迁需要 {travel_cost} 星币', 'data': None}

            self.save_model.update(save_id, credits=save['credits'] - travel_cost, current_planet_id=planet_id)

            if travel_damage > 0:
                new_shield = max(0, ship['current_shield'] - travel_damage)
                remain_dmg = max(0, travel_damage - ship['current_shield'])
                new_hull = max(1, ship['current_hull'] - remain_dmg)
                self.ship_model.update(save['ship_id'], current_shield=new_shield, current_hull=new_hull)

            return self.get_full_game_state(save_id)
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def repair_ship(self, save_id: int) -> Dict[str, Any]:
        try:
            save = self.save_model.get_by_id(save_id)
            if not save:
                return {'code': 1, 'message': '存档不存在', 'data': None}

            ship = self.ship_model.get_by_id(save['ship_id'])
            planet = self.planet_model.get_by_id(save['current_planet_id'])

            if not planet or not planet.get('has_repair'):
                return {'code': 1, 'message': '该空间站没有维修设施', 'data': None}

            hull_damage = ship['max_hull'] - ship['current_hull']
            shield_missing = ship['max_shield'] - ship['current_shield']

            repair_cost = int((hull_damage * 3) + (shield_missing * 1))
            if repair_cost <= 0:
                return {'code': 1, 'message': '飞船状态良好，无需维修', 'data': None}

            if save['credits'] < repair_cost:
                return {'code': 1, 'message': f'星币不足，维修需要 {repair_cost} 星币', 'data': None}

            self.save_model.update(save_id, credits=save['credits'] - repair_cost)

            equipment_list = self.inventory_model.get_equipment(save_id)
            shield_bonus = 0
            hull_bonus = 0
            for eq in equipment_list:
                if eq.get('is_equipped'):
                    shield_bonus += eq.get('shield_bonus', 0)
                    hull_bonus += eq.get('hull_bonus', 0)

            self.ship_model.update(save['ship_id'],
                                   current_shield=ship['max_shield'] + shield_bonus,
                                   current_hull=ship['max_hull'] + hull_bonus)

            return self.get_full_game_state(save_id)
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def equip_item(self, save_id: int, inventory_id: int) -> Dict[str, Any]:
        try:
            inv_item = self.inventory_model.get_by_id(inventory_id)
            if not inv_item or inv_item['save_id'] != save_id:
                return {'code': 1, 'message': '物品不存在', 'data': None}

            if inv_item['item_type'] != 'equipment':
                return {'code': 1, 'message': '只能装备装备类物品', 'data': None}

            equip = self.equipment_model.get_by_id(inv_item['item_id'])
            if not equip:
                return {'code': 1, 'message': '装备数据错误', 'data': None}

            self.inventory_model.unequip_slot(save_id, equip['slot_type'])
            self.inventory_model.set_equipped(inventory_id, 1)

            return self.get_full_game_state(save_id)
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def unequip_item(self, save_id: int, inventory_id: int) -> Dict[str, Any]:
        try:
            inv_item = self.inventory_model.get_by_id(inventory_id)
            if not inv_item or inv_item['save_id'] != save_id:
                return {'code': 1, 'message': '物品不存在', 'data': None}

            self.inventory_model.set_equipped(inventory_id, 0)
            return self.get_full_game_state(save_id)
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def get_skill_list(self) -> Dict[str, Any]:
        try:
            skills = self.skill_model.get_all()
            return {'code': 0, 'message': 'success', 'data': skills}
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def get_reputation_log(self, save_id: int, limit: int = 50) -> Dict[str, Any]:
        try:
            logs = self.reputation_model.get_by_save_id(save_id, limit)
            summary = self.reputation_model.get_faction_summary(save_id)
            return {'code': 0, 'message': 'success', 'data': {'logs': logs, 'summary': summary}}
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def delete_save(self, save_id: int) -> Dict[str, Any]:
        try:
            save = self.save_model.get_by_id(save_id)
            if not save:
                return {'code': 1, 'message': '存档不存在', 'data': None}
            self.save_model.delete(save_id)
            return {'code': 0, 'message': '删除成功', 'data': None}
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}
