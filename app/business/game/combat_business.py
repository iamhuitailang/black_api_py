import json
import random
import copy
from typing import Dict, Any, List, Optional
from app.model.game import (
    SaveModel, ShipModel, EquipmentModel, InventoryModel,
    EnemyModel, ItemModel, SkillModel, MissionModel
)


class CombatBusiness:
    def __init__(self):
        self.save_model = SaveModel()
        self.ship_model = ShipModel()
        self.equipment_model = EquipmentModel()
        self.inventory_model = InventoryModel()
        self.enemy_model = EnemyModel()
        self.item_model = ItemModel()
        self.skill_model = SkillModel()
        self.mission_model = MissionModel()

    def _calculate_ship_stats(self, save_id: int, ship: Dict[str, Any]) -> Dict[str, Any]:
        equipment_list = self.inventory_model.get_equipment(save_id)
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
        return {
            'total_attack': ship['base_attack'] + attack_bonus,
            'total_defense': ship['base_defense'] + defense_bonus,
            'total_max_shield': ship['max_shield'] + shield_bonus,
            'total_max_hull': ship['max_hull'] + hull_bonus,
            'total_shield_regen': ship['shield_regen'] + shield_regen_bonus,
            'total_evasion': ship['evasion'] + evasion_bonus,
        }

    def init_combat(self, save_id: int, enemy_ids: List[int] = None,
                    difficulty: int = None, mission_id: int = None) -> Dict[str, Any]:
        try:
            save = self.save_model.get_by_id(save_id)
            if not save:
                return {'code': 1, 'message': '存档不存在', 'data': None}

            ship = self.ship_model.get_by_id(save['ship_id'])
            if not ship:
                return {'code': 1, 'message': '飞船数据丢失', 'data': None}

            stats = self._calculate_ship_stats(save_id, ship)

            player = {
                'name': save['player_name'],
                'ship_name': ship['name'],
                'max_shield': stats['total_max_shield'],
                'current_shield': min(ship['current_shield'], stats['total_max_shield']),
                'max_hull': stats['total_max_hull'],
                'current_hull': min(ship['current_hull'], stats['total_max_hull']),
                'attack': stats['total_attack'],
                'defense': stats['total_defense'],
                'evasion': stats['total_evasion'],
                'shield_regen': stats['total_shield_regen'],
                'defending': False,
                'buffs': {'attack': 0, 'defense': 0, 'evasion': 0, 'turns_remaining': 0},
                'debuffs': {'defense': 0, 'turns_remaining': 0, 'stunned': 0},
                'skill_cooldowns': {},
            }

            enemies = []
            if enemy_ids and len(enemy_ids) > 0:
                for eid in enemy_ids:
                    enemy_data = self.enemy_model.get_by_id(eid)
                    if enemy_data:
                        enemies.append(self._make_enemy_instance(enemy_data))
            elif difficulty is not None:
                count = max(1, min(3, difficulty))
                for _ in range(count):
                    ed = self.enemy_model.get_random_by_difficulty(difficulty)
                    if ed:
                        enemies.append(self._make_enemy_instance(ed))
            else:
                ed = self.enemy_model.get_random_by_difficulty(1)
                if ed:
                    enemies.append(self._make_enemy_instance(ed))

            if not enemies:
                return {'code': 1, 'message': '没有敌人可以战斗', 'data': None}

            all_skills = self.skill_model.get_all()
            items = self.inventory_model.get_items(save_id)
            combat_items = []
            for item in items:
                if item.get('quantity', 0) > 0:
                    combat_items.append({
                        'inventory_id': item['id'],
                        'item_id': item['item_id'],
                        'name': item['name'],
                        'description': item['description'],
                        'heal_hull': item.get('heal_hull', 0),
                        'heal_shield': item.get('heal_shield', 0),
                        'damage_bonus': item.get('damage_bonus', 0),
                        'defense_bonus': item.get('defense_bonus', 0),
                        'special_effect': item.get('special_effect', ''),
                        'quantity': item['quantity'],
                        'used_in_combat': False,
                    })

            combat_state = {
                'turn': 1,
                'phase': 'player',
                'player': player,
                'enemies': enemies,
                'current_enemy_index': 0,
                'log': [f'遭遇 {len(enemies)} 艘敌舰！战斗开始！'],
                'skills': all_skills,
                'items': combat_items,
                'mission_id': mission_id,
                'save_id': save_id,
                'is_over': False,
                'victory': False,
                'rewards': None,
            }

            return {'code': 0, 'message': 'success', 'data': combat_state}
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def _make_enemy_instance(self, enemy_data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': enemy_data['id'],
            'name': enemy_data['name'],
            'ship_type': enemy_data['ship_type'],
            'max_shield': enemy_data['max_shield'],
            'current_shield': enemy_data['max_shield'],
            'max_hull': enemy_data['max_hull'],
            'current_hull': enemy_data['max_hull'],
            'attack': enemy_data['attack'],
            'defense': enemy_data['defense'],
            'evasion': enemy_data['evasion'],
            'shield_regen': enemy_data['shield_regen'],
            'reward_credits': enemy_data['reward_credits'],
            'reward_exp': enemy_data['reward_exp'],
            'difficulty': enemy_data['difficulty'],
            'buffs': {'defense': 0, 'turns_remaining': 0},
            'debuffs': {'defense': 0, 'turns_remaining': 0, 'stunned': 0},
            'is_dead': False,
        }

    def player_action(self, state: Dict[str, Any], action: str,
                      target_index: int = 0, skill_id: int = None,
                      item_inventory_id: int = None) -> Dict[str, Any]:
        try:
            if state.get('is_over'):
                return {'code': 1, 'message': '战斗已结束', 'data': state}

            if state['phase'] != 'player':
                return {'code': 1, 'message': '不是玩家回合', 'data': state}

            player = state['player']
            log = state['log']
            enemies = state['enemies']

            if player['debuffs'].get('stunned', 0) > 0:
                log.append(f"{player['ship_name']} 被瘫痪，无法行动！")
                player['debuffs']['stunned'] -= 1
                return self._enemy_turn(state)

            target = enemies[target_index] if 0 <= target_index < len(enemies) else None

            if action == 'attack':
                if not target or target['is_dead']:
                    target = self._find_alive_enemy(enemies)
                    if target is None:
                        return self._end_combat_check(state)
                self._do_damage(player, target, log, attacker_name=player['ship_name'], is_player=True)

            elif action == 'defend':
                player['defending'] = True
                log.append(f"{player['ship_name']} 进入防御姿态，防御力临时翻倍！")

            elif action == 'skill':
                if skill_id is None:
                    return {'code': 1, 'message': '请选择技能', 'data': state}
                skill = None
                for s in state['skills']:
                    if s['id'] == skill_id:
                        skill = s
                        break
                if not skill:
                    return {'code': 1, 'message': '技能不存在', 'data': state}

                cd = player['skill_cooldowns'].get(skill_id, 0)
                if cd > 0:
                    return {'code': 1, 'message': f'技能冷却中，还需 {cd} 回合', 'data': state}

                if not target or target['is_dead']:
                    target = self._find_alive_enemy(enemies)

                self._use_skill(player, target, skill, log, enemies)
                player['skill_cooldowns'][skill_id] = skill['cooldown']

            elif action == 'item':
                if item_inventory_id is None:
                    return {'code': 1, 'message': '请选择道具', 'data': state}
                item = None
                for it in state['items']:
                    if it['inventory_id'] == item_inventory_id and it['quantity'] > 0:
                        item = it
                        break
                if not item:
                    return {'code': 1, 'message': '道具不存在或已用完', 'data': state}
                self._use_item(player, target, item, log)
                item['quantity'] -= 1

            else:
                return {'code': 1, 'message': '未知操作', 'data': state}

            player['defending'] = False
            self._decrement_buff_timers(player)
            for en in enemies:
                self._decrement_enemy_timers(en)
            for sid in player['skill_cooldowns']:
                if player['skill_cooldowns'][sid] > 0:
                    player['skill_cooldowns'][sid] -= 1

            if self._all_enemies_dead(enemies):
                return self._end_combat(state, victory=True)

            state['current_enemy_index'] = self._find_alive_enemy_index(enemies, state['current_enemy_index'])

            return self._enemy_turn(state)
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': state}

    def _do_damage(self, attacker: Dict[str, Any], defender: Dict[str, Any],
                   log: List[str], attacker_name: str, is_player: bool = False):
        attack_val = attacker['attack'] + attacker.get('buffs', {}).get('attack', 0)
        defense_val = defender['defense'] - defender.get('debuffs', {}).get('defense', 0)
        defense_val = max(0, defense_val)

        if is_player and attacker.get('defending'):
            pass

        if not is_player and defender.get('defending'):
            defense_val *= 2

        evasion = defender.get('evasion', 0) + defender.get('buffs', {}).get('evasion', 0)
        if random.randint(1, 100) <= evasion:
            log.append(f"{defender.get('name', defender.get('ship_name', '目标'))} 成功闪避！")
            return 0

        variance = random.uniform(0.85, 1.15)
        raw_damage = max(1, int(attack_val * variance) - defense_val)

        shield_before = defender['current_shield']
        if shield_before > 0:
            shield_damage = min(shield_before, raw_damage)
            defender['current_shield'] -= shield_damage
            hull_damage = raw_damage - shield_damage
        else:
            hull_damage = raw_damage
            shield_damage = 0

        if hull_damage > 0:
            defender['current_hull'] = max(0, defender['current_hull'] - hull_damage)

        target_name = defender.get('name', defender.get('ship_name', '目标'))
        msg_parts = [f"{attacker_name} 对 {target_name} 造成 {raw_damage} 点伤害"]
        if shield_damage > 0:
            msg_parts.append(f"(护盾吸收 {shield_damage})")
        if hull_damage > 0:
            msg_parts.append(f"(船体受损 {hull_damage})")
        log.append(' '.join(msg_parts))

        if defender['current_hull'] <= 0:
            defender['is_dead'] = True
            log.append(f"{target_name} 被摧毁！")

        return raw_damage

    def _use_skill(self, player: Dict[str, Any], target: Optional[Dict[str, Any]],
                   skill: Dict[str, Any], log: List[str], enemies: List[Dict[str, Any]]):
        log.append(f"{player['ship_name']} 使用技能【{skill['name']}】！")

        if skill['damage_multiplier'] > 0 and target and not target.get('is_dead'):
            old_attack = player['attack']
            extra_flat = skill.get('flat_damage', 0)
            player['attack'] = int(player['attack'] * skill['damage_multiplier']) + extra_flat
            self._do_damage(player, target, log, attacker_name=player['ship_name'], is_player=True)
            player['attack'] = old_attack

            debuff_def = skill.get('debuff_enemy_defense', 0)
            if debuff_def > 0 and not target.get('is_dead'):
                target['debuffs'] = target.get('debuffs', {'defense': 0, 'turns_remaining': 0})
                target['debuffs']['defense'] = max(target['debuffs'].get('defense', 0), debuff_def)
                target['debuffs']['turns_remaining'] = max(target['debuffs'].get('turns_remaining', 0), 3)
                log.append(f"{target['name']} 的防御力被削弱！")

            stun = skill.get('stun_chance', 0)
            if stun > 0 and not target.get('is_dead'):
                if random.randint(1, 100) <= stun:
                    target['debuffs']['stunned'] = 1
                    log.append(f"{target['name']} 被瘫痪一回合！")

        heal_shield = skill.get('heal_shield', 0)
        if heal_shield > 0:
            max_s = player['max_shield']
            actual = min(heal_shield, max_s - player['current_shield'])
            player['current_shield'] += actual
            log.append(f"护盾恢复 {actual} 点！")

        heal_hull = skill.get('heal_hull', 0)
        if heal_hull > 0:
            max_h = player['max_hull']
            actual = min(heal_hull, max_h - player['current_hull'])
            player['current_hull'] += actual
            log.append(f"船体修复 {actual} 点！")

        def_buff = skill.get('defense_buff', 0)
        if def_buff > 0:
            player['buffs']['defense'] = max(player['buffs'].get('defense', 0), def_buff)
            player['buffs']['turns_remaining'] = max(player['buffs'].get('turns_remaining', 0), 3)
            log.append(f"防御力临时提升 {def_buff} 点！")

        eva_buff = skill.get('evasion_buff', 0)
        if eva_buff > 0:
            player['buffs']['evasion'] = max(player['buffs'].get('evasion', 0), eva_buff)
            player['buffs']['turns_remaining'] = max(player['buffs'].get('turns_remaining', 0), 3)
            log.append(f"闪避率临时提升 {eva_buff}%！")

    def _use_item(self, player: Dict[str, Any], target: Optional[Dict[str, Any]],
                  item: Dict[str, Any], log: List[str]):
        log.append(f"使用【{item['name']}】！")

        heal_shield = item.get('heal_shield', 0)
        if heal_shield > 0:
            max_s = player['max_shield']
            actual = min(heal_shield, max_s - player['current_shield'])
            player['current_shield'] += actual
            log.append(f"护盾充能 {actual} 点！")

        heal_hull = item.get('heal_hull', 0)
        if heal_hull > 0:
            max_h = player['max_hull']
            actual = min(heal_hull, max_h - player['current_hull'])
            player['current_hull'] += actual
            log.append(f"船体修复 {actual} 点！")

        dmg_buff = item.get('damage_bonus', 0)
        if dmg_buff > 0:
            player['buffs']['attack'] = max(player['buffs'].get('attack', 0), dmg_buff)
            player['buffs']['turns_remaining'] = max(player['buffs'].get('turns_remaining', 0), 3)
            log.append(f"攻击力临时提升 {dmg_buff} 点！")

        def_buff = item.get('defense_bonus', 0)
        if def_buff > 0:
            player['buffs']['defense'] = max(player['buffs'].get('defense', 0), def_buff)
            player['buffs']['turns_remaining'] = max(player['buffs'].get('turns_remaining', 0), 3)
            log.append(f"防御力临时提升 {def_buff} 点！")

        spec = item.get('special_effect', '')
        if '眩晕' in spec or '瘫痪' in spec:
            if target and not target.get('is_dead'):
                target['debuffs']['stunned'] = 1
                log.append(f"{target['name']} 被瘫痪一回合！")

    def _enemy_turn(self, state: Dict[str, Any]) -> Dict[str, Any]:
        log = state['log']
        enemies = state['enemies']
        player = state['player']

        state['phase'] = 'enemy'
        log.append(f"--- 敌方回合 {state['turn']} ---")

        for enemy in enemies:
            if enemy.get('is_dead'):
                continue

            if enemy.get('debuffs', {}).get('stunned', 0) > 0:
                log.append(f"{enemy['name']} 被瘫痪，跳过回合！")
                enemy['debuffs']['stunned'] -= 1
                continue

            log.append(f"{enemy['name']} 开始行动...")

            action_roll = random.randint(1, 100)
            if action_roll <= 75 or enemy['current_hull'] > enemy['max_hull'] * 0.3:
                self._do_damage(enemy, player, log, attacker_name=enemy['name'], is_player=False)
            elif action_roll <= 90:
                if enemy['current_shield'] < enemy['max_shield']:
                    regen = enemy['shield_regen'] * 3
                    actual = min(regen, enemy['max_shield'] - enemy['current_shield'])
                    enemy['current_shield'] += actual
                    log.append(f"{enemy['name']} 紧急修复护盾，恢复 {actual} 点护盾！")
                else:
                    self._do_damage(enemy, player, log, attacker_name=enemy['name'], is_player=False)
            else:
                enemy['buffs']['defense'] = max(enemy['buffs'].get('defense', 0), enemy['defense'])
                enemy['buffs']['turns_remaining'] = max(enemy['buffs'].get('turns_remaining', 0), 2)
                log.append(f"{enemy['name']} 进入防御姿态！")

            if player['current_hull'] <= 0:
                return self._end_combat(state, victory=False)

            for en in enemies:
                en_shield = min(en['max_shield'], en['current_shield'] + en['shield_regen'])
                en['current_shield'] = en_shield

        log.append(f"--- 玩家回合 {state['turn'] + 1} ---")
        state['turn'] += 1

        regen = player['shield_regen']
        player['current_shield'] = min(player['max_shield'], player['current_shield'] + regen)

        state['phase'] = 'player'
        return {'code': 0, 'message': 'success', 'data': state}

    def _end_combat_check(self, state: Dict[str, Any]) -> Dict[str, Any]:
        if self._all_enemies_dead(state['enemies']):
            return self._end_combat(state, victory=True)
        return {'code': 0, 'message': 'success', 'data': state}

    def _end_combat(self, state: Dict[str, Any], victory: bool) -> Dict[str, Any]:
        save_id = state['save_id']
        save = self.save_model.get_by_id(save_id)
        ship = self.ship_model.get_by_id(save['ship_id'])

        player = state['player']
        state['is_over'] = True
        state['victory'] = victory
        log = state['log']

        if victory:
            total_credits = 0
            total_exp = 0
            for en in state['enemies']:
                total_credits += en.get('reward_credits', 0)
                total_exp += en.get('reward_exp', 0)

            new_credits = save['credits'] + total_credits
            self.save_model.update(save_id, credits=new_credits)

            state['rewards'] = {
                'credits': total_credits,
                'exp': total_exp,
            }
            log.append(f"==== 战斗胜利！获得 {total_credits} 星币 ====")
        else:
            player['current_hull'] = 1
            player['current_shield'] = 0
            log.append("==== 战斗失败，飞船侥幸逃生 ====")

        equipment_list = self.inventory_model.get_equipment(save_id)
        shield_bonus = 0
        hull_bonus = 0
        for eq in equipment_list:
            if eq.get('is_equipped'):
                shield_bonus += eq.get('shield_bonus', 0)
                hull_bonus += eq.get('hull_bonus', 0)

        real_max_shield = ship['max_shield'] + shield_bonus
        real_max_hull = ship['max_hull'] + hull_bonus

        save_cur_shield = int(player['current_shield'] / player['max_shield'] * real_max_shield) if player['max_shield'] > 0 else 0
        save_cur_hull = int(player['current_hull'] / player['max_hull'] * real_max_hull) if player['max_hull'] > 0 else 1
        save_cur_shield = min(save_cur_shield, real_max_shield)
        save_cur_hull = min(save_cur_hull, real_max_hull)

        self.ship_model.update(save['ship_id'],
                               current_shield=max(0, save_cur_shield),
                               current_hull=max(1, save_cur_hull))

        for item in state.get('items', []):
            inv = self.inventory_model.get_by_id(item['inventory_id'])
            if inv:
                self.inventory_model.update_quantity(item['inventory_id'], item['quantity'])

        return {'code': 0, 'message': 'success', 'data': state}

    def _find_alive_enemy(self, enemies: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        for en in enemies:
            if not en.get('is_dead'):
                return en
        return None

    def _find_alive_enemy_index(self, enemies: List[Dict[str, Any]], preferred: int = 0) -> int:
        if 0 <= preferred < len(enemies) and not enemies[preferred].get('is_dead'):
            return preferred
        for i, en in enumerate(enemies):
            if not en.get('is_dead'):
                return i
        return 0

    def _all_enemies_dead(self, enemies: List[Dict[str, Any]]) -> bool:
        return all(en.get('is_dead', True) for en in enemies)

    def _decrement_buff_timers(self, player: Dict[str, Any]):
        if player['buffs'].get('turns_remaining', 0) > 0:
            player['buffs']['turns_remaining'] -= 1
            if player['buffs']['turns_remaining'] == 0:
                player['buffs']['attack'] = 0
                player['buffs']['defense'] = 0
                player['buffs']['evasion'] = 0
        if player['debuffs'].get('turns_remaining', 0) > 0:
            player['debuffs']['turns_remaining'] -= 1
            if player['debuffs']['turns_remaining'] == 0:
                player['debuffs']['defense'] = 0

    def _decrement_enemy_timers(self, enemy: Dict[str, Any]):
        if enemy.get('buffs', {}).get('turns_remaining', 0) > 0:
            enemy['buffs']['turns_remaining'] -= 1
            if enemy['buffs']['turns_remaining'] == 0:
                enemy['buffs']['defense'] = 0
        if enemy.get('debuffs', {}).get('turns_remaining', 0) > 0:
            enemy['debuffs']['turns_remaining'] -= 1
            if enemy['debuffs']['turns_remaining'] == 0:
                enemy['debuffs']['defense'] = 0
