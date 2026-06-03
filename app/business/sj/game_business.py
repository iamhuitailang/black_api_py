from typing import Dict, Any, Optional
from app.model.sj_model import (
    SjCharacterModel, SjFloorModel, SjInventoryModel,
    SjEventLogModel, SjTimeAbilityModel
)
import random
import math


class SjGameBusiness:
    def __init__(self):
        self.character_model = SjCharacterModel()
        self.floor_model = SjFloorModel()
        self.inventory_model = SjInventoryModel()
        self.event_log_model = SjEventLogModel()
        self.time_ability_model = SjTimeAbilityModel()

    def enter_floor(self, character_id: int) -> Dict[str, Any]:
        character = self.character_model.get_by_id(character_id)
        if not character:
            return {'code': 1, 'msg': '角色不存在', 'data': None}

        if character.get('status') == SjCharacterModel.STATUS_DEAD:
            return {'code': 1, 'msg': '角色已阵亡', 'data': None}

        current = character.get('current_floor', 0)

        target_floor = current + 1
        if current > 0:
            existing_floor = self.floor_model.get_current_floor(character_id, current)
            if existing_floor and existing_floor.get('status') == SjFloorModel.STATUS_PENDING:
                floor_type = existing_floor.get('floor_type')
                if floor_type in (SjFloorModel.FLOOR_TYPE_NORMAL, SjFloorModel.FLOOR_TYPE_BOSS):
                    target_floor = current
                else:
                    self.floor_model.update_status(existing_floor.get('id'), SjFloorModel.STATUS_CLEARED)

        if target_floor > 25:
            return {'code': 1, 'msg': '已达塔顶', 'data': None}

        floor_data = self.floor_model.get_current_floor(character_id, target_floor)
        if floor_data:
            status = floor_data.get('status')
            if status == SjFloorModel.STATUS_CLEARED:
                if target_floor <= current:
                    target_floor = current + 1
                    if target_floor > 25:
                        return {'code': 1, 'msg': '已达塔顶', 'data': None}
                    floor_data = self.floor_model.get_current_floor(character_id, target_floor)
                    if not floor_data:
                        floor_data = self.floor_model.generate_floor(character_id, target_floor)
                    elif floor_data.get('status') in (SjFloorModel.STATUS_FAILED, SjFloorModel.STATUS_SKIPPED):
                        self.floor_model.delete(floor_data.get('id'))
                        floor_data = self.floor_model.generate_floor(character_id, target_floor)
                else:
                    return {'code': 1, 'msg': '该楼层已通过', 'data': None}
            elif status in (SjFloorModel.STATUS_FAILED, SjFloorModel.STATUS_SKIPPED):
                self.floor_model.delete(floor_data.get('id'))
                floor_data = self.floor_model.generate_floor(character_id, target_floor)
        else:
            floor_data = self.floor_model.generate_floor(character_id, target_floor)

        newly_unlocked = self.time_ability_model.check_and_unlock(character_id, target_floor)

        self.character_model.update(character_id, {'current_floor': target_floor})

        result = self.floor_model.to_dict(floor_data)
        result['character'] = self.character_model.to_dict(
            self.character_model.get_by_id(character_id)
        )
        result['newly_unlocked_abilities'] = newly_unlocked

        return {'code': 0, 'msg': 'success', 'data': result}

    def battle_action(self, character_id: int, action: str, skill_name: str = '',
                      use_time_ability: str = '') -> Dict[str, Any]:
        character = self.character_model.get_by_id(character_id)
        if not character:
            return {'code': 1, 'msg': '角色不存在', 'data': None}

        floor_data = self.floor_model.get_current_floor(character_id, character.get('current_floor', 1))
        if not floor_data:
            return {'code': 1, 'msg': '当前没有可挑战的楼层', 'data': None}

        if floor_data.get('status') != SjFloorModel.STATUS_PENDING:
            return {'code': 1, 'msg': '该楼层已通过', 'data': None}

        enemy = floor_data.get('enemy_data', {})
        if not enemy:
            return {'code': 1, 'msg': '该楼层无敌人', 'data': None}

        battle_state = self._init_battle_state(character, enemy)

        if use_time_ability:
            ability_result = self._use_time_ability(battle_state, use_time_ability)
            battle_state.update(ability_result)

        if action == 'attack':
            battle_state = self._player_attack(battle_state, skill_name)
        elif action == 'defend':
            battle_state = self._player_defend(battle_state)
        elif action == 'flee':
            flee_chance = 0.3 + character.get('speed', 8) * 0.02
            if random.random() < flee_chance:
                self.floor_model.update_status(floor_data.get('id'), SjFloorModel.STATUS_SKIPPED)
                new_floor = max(0, character.get('current_floor', 1) - 1)
                self.character_model.update(character_id, {'current_floor': new_floor})
                return {
                    'code': 0,
                    'msg': '逃跑成功',
                    'data': {
                        'result': 'fled',
                        'character': self.character_model.to_dict(
                            self.character_model.get_by_id(character_id)
                        )
                    }
                }
            battle_state['log'].append('逃跑失败！')

        if battle_state['enemy_hp'] > 0:
            battle_state = self._enemy_attack(battle_state)

        if battle_state['enemy_hp'] <= 0:
            return self._handle_victory(character_id, floor_data, enemy)
        elif battle_state['player_hp'] <= 0:
            return self._handle_defeat(character_id, floor_data)

        self.character_model.update(character_id, {
            'hp': max(0, battle_state['player_hp']),
            'mp': max(0, battle_state['player_mp']),
            'time_energy': battle_state.get('time_energy', character.get('time_energy', 100))
        })

        battle_state['character'] = self.character_model.to_dict(
            self.character_model.get_by_id(character_id)
        )
        battle_state['floor'] = self.floor_model.to_dict(floor_data)
        battle_state['result'] = 'ongoing'

        return {'code': 0, 'msg': '战斗继续', 'data': battle_state}

    def _init_battle_state(self, character: Dict, enemy: Dict) -> Dict:
        return {
            'player_hp': character.get('hp', 100),
            'player_max_hp': character.get('max_hp', 100),
            'player_mp': character.get('mp', 30),
            'player_max_mp': character.get('max_mp', 30),
            'player_attack': character.get('attack', 10),
            'player_defense': character.get('defense', 5),
            'player_speed': character.get('speed', 8),
            'time_energy': character.get('time_energy', 100),
            'enemy_name': enemy.get('name', '未知'),
            'enemy_hp': enemy.get('hp', 50),
            'enemy_max_hp': enemy.get('hp', 50),
            'enemy_attack': enemy.get('attack', 10),
            'enemy_defense': enemy.get('defense', 5),
            'is_defending': False,
            'is_paused': False,
            'log': []
        }

    def _player_attack(self, state: Dict, skill_name: str = '') -> Dict:
        attack = state['player_attack']
        if skill_name:
            skill_multipliers = {
                '猛击': 1.8, '坚守': 0.8, '战吼': 1.5,
                '火球术': 2.0, '冰冻术': 1.5, '魔力护盾': 0.5,
                '暗影突袭': 2.2, '闪避': 0.3, '毒刃': 1.6
            }
            mp_costs = {
                '猛击': 8, '坚守': 5, '战吼': 12,
                '火球术': 15, '冰冻术': 12, '魔力护盾': 10,
                '暗影突袭': 12, '闪避': 8, '毒刃': 10
            }
            cost = mp_costs.get(skill_name, 0)
            if state['player_mp'] < cost:
                state['log'].append(f'魔力不足，无法使用{skill_name}！')
                return state
            state['player_mp'] -= cost
            multiplier = skill_multipliers.get(skill_name, 1.0)
            attack = int(attack * multiplier)
            if skill_name == '冰冻术':
                state['is_paused'] = True
            state['log'].append(f'使用【{skill_name}】！')

        crit = random.random() < 0.15
        if crit:
            attack = int(attack * 1.5)
            state['log'].append('暴击！')

        damage = max(1, attack - state['enemy_defense'] // 2 + random.randint(-2, 2))
        state['enemy_hp'] -= damage
        state['log'].append(f'对{state["enemy_name"]}造成{damage}点伤害')
        state['is_defending'] = False
        return state

    def _player_defend(self, state: Dict) -> Dict:
        state['is_defending'] = True
        state['player_mp'] = min(state['player_max_mp'], state['player_mp'] + 5)
        state['log'].append('防御姿态，恢复5点魔力')
        return state

    def _enemy_attack(self, state: Dict) -> Dict:
        if state.get('is_paused'):
            state['is_paused'] = False
            state['log'].append(f'{state["enemy_name"]}被冻结，无法行动！')
            return state

        damage = max(1, state['enemy_attack'] - state['player_defense'] // 2 + random.randint(-2, 2))
        if state['is_defending']:
            damage = damage // 2
            state['log'].append(f'防御减半！{state["enemy_name"]}造成{damage}点伤害')
        else:
            state['log'].append(f'{state["enemy_name"]}造成{damage}点伤害')

        state['player_hp'] -= damage
        return state

    def _use_time_ability(self, state: Dict, ability_name: str) -> Dict:
        ability_info = SjTimeAbilityModel.ABILITIES.get(ability_name)
        if not ability_info:
            state['log'].append(f'未知的时间能力：{ability_name}')
            return state

        mp_cost = ability_info.get('mp_cost', 0)
        if state['player_mp'] < mp_cost:
            state['log'].append(f'魔力不足，无法使用{ability_info["name"]}！')
            return state

        if state['time_energy'] < 10:
            state['log'].append('时间能量不足！')
            return state

        state['player_mp'] -= mp_cost
        state['time_energy'] -= 10

        if ability_name == 'pause':
            state['is_paused'] = True
            state['log'].append(f'⏱ 使用【{ability_info["name"]}】！时间暂停！')
        elif ability_name == 'accelerate':
            state['player_attack'] = int(state['player_attack'] * 2)
            state['log'].append(f'⏩ 使用【{ability_info["name"]}】！攻击力翻倍！')
        elif ability_name == 'rewind':
            restore_hp = state['player_max_hp'] // 3
            state['player_hp'] = min(state['player_max_hp'], state['player_hp'] + restore_hp)
            state['log'].append(f'⏪ 使用【{ability_info["name"]}】！恢复{restore_hp}点生命！')
        elif ability_name == 'foresee':
            state['is_defending'] = True
            state['log'].append(f'👁 使用【{ability_info["name"]}】！预知攻击，自动防御！')
        elif ability_name == 'freeze':
            state['is_paused'] = True
            state['log'].append(f'❄ 使用【{ability_info["name"]}】！敌人被冻结！')
        elif ability_name == 'rewind_health':
            restore_hp = state['player_max_hp'] // 2
            state['player_hp'] = min(state['player_max_hp'], state['player_hp'] + restore_hp)
            state['log'].append(f'💚 使用【{ability_info["name"]}】！恢复50%最大生命！')

        return state

    def _handle_victory(self, character_id: int, floor_data: Dict, enemy: Dict) -> Dict[str, Any]:
        self.floor_model.update_status(floor_data.get('id'), SjFloorModel.STATUS_CLEARED)

        exp_gain = enemy.get('exp', 20)
        gold_gain = enemy.get('gold', 10)
        self.character_model.update(character_id, {
            'gold': self.character_model.get_by_id(character_id).get('gold', 0) + gold_gain,
            'hp': self.character_model.get_by_id(character_id).get('hp', 100),
            'mp': self.character_model.get_by_id(character_id).get('mp', 30)
        })

        from app.business.sj.character_business import SjCharacterBusiness
        char_biz = SjCharacterBusiness()
        level_result = char_biz.add_exp(character_id, exp_gain)

        drops = self._generate_drops(enemy, floor_data)

        character = self.character_model.get_by_id(character_id)
        max_floor = character.get('max_floor', 0)
        current = character.get('current_floor', 0)
        if current > max_floor:
            self.character_model.update(character_id, {'max_floor': current})

        self.event_log_model.create(
            character_id=character_id,
            floor_number=floor_data.get('floor_number', 0),
            event_type=SjEventLogModel.EVENT_TYPE_COMBAT,
            event_description=f'击败了{enemy.get("name", "未知")}',
            result=f'获得{exp_gain}经验，{gold_gain}金币'
        )

        return {
            'code': 0,
            'msg': '战斗胜利！',
            'data': {
                'result': 'victory',
                'exp_gain': exp_gain,
                'gold_gain': gold_gain,
                'drops': drops,
                'level_up': level_result.get('data', {}).get('level_up', False),
                'character': level_result.get('data', self.character_model.to_dict(character)),
                'floor': self.floor_model.to_dict(floor_data)
            }
        }

    def _handle_defeat(self, character_id: int, floor_data: Dict) -> Dict[str, Any]:
        self.floor_model.update_status(floor_data.get('id'), SjFloorModel.STATUS_FAILED)
        character = self.character_model.get_by_id(character_id)
        current = character.get('current_floor', 0)
        self.character_model.update(character_id, {
            'status': SjCharacterModel.STATUS_DEAD,
            'hp': 0,
            'current_floor': max(0, current - 1)
        })

        return {
            'code': 0,
            'msg': '战斗失败',
            'data': {
                'result': 'defeat',
                'character': self.character_model.to_dict(
                    self.character_model.get_by_id(character_id)
                )
            }
        }

    def _generate_drops(self, enemy: Dict, floor_data: Dict) -> list:
        drops = []
        is_boss = floor_data.get('is_boss', 0) == 1

        if is_boss:
            boss_drop = enemy.get('drop', '')
            if boss_drop:
                rarity = random.choice([2, 3, 4])
                drops.append({
                    'item_id': f'boss_{floor_data.get("floor_number", 1)}',
                    'item_name': boss_drop,
                    'item_type': 'armor',
                    'rarity': rarity,
                    'attack_bonus': random.randint(3, 8),
                    'defense_bonus': random.randint(5, 12),
                    'hp_bonus': random.randint(10, 30),
                    'mp_bonus': random.randint(5, 15),
                    'special_effect': 'BOSS掉落'
                })
        else:
            drop_chance = 0.3
            if random.random() < drop_chance:
                item_types = ['weapon', 'armor', 'accessory', 'consumable']
                item_type = random.choice(item_types)
                rarity = random.choices([0, 1, 2, 3], weights=[50, 30, 15, 5])[0]
                names = {
                    'weapon': ['铁剑', '钢刀', '魔力杖', '暗影匕首', '时间之刃'],
                    'armor': ['皮甲', '锁子甲', '法袍', '暗影斗篷', '时间护甲'],
                    'accessory': ['力量戒指', '敏捷项链', '智慧耳环', '时间沙漏'],
                    'consumable': ['生命药水', '魔力药水', '时间精华', '回复药剂']
                }
                name = random.choice(names.get(item_type, ['未知物品']))
                drops.append({
                    'item_id': f'item_{random.randint(1000, 9999)}',
                    'item_name': name,
                    'item_type': item_type,
                    'rarity': rarity,
                    'attack_bonus': random.randint(0, rarity * 3),
                    'defense_bonus': random.randint(0, rarity * 2),
                    'hp_bonus': random.randint(0, rarity * 5),
                    'mp_bonus': random.randint(0, rarity * 3),
                    'special_effect': ''
                })

        return drops

    def handle_event(self, character_id: int, event_id: str, choice_index: int) -> Dict[str, Any]:
        character = self.character_model.get_by_id(character_id)
        if not character:
            return {'code': 1, 'msg': '角色不存在', 'data': None}

        event = None
        for e in SjEventLogModel.RANDOM_EVENTS:
            if e['id'] == event_id:
                event = e
                break

        if not event:
            return {'code': 1, 'msg': '事件不存在', 'data': None}

        if choice_index < 0 or choice_index >= len(event['choices']):
            return {'code': 1, 'msg': '无效的选择', 'data': None}

        choice = event['choices'][choice_index]
        effects = choice.get('effect', {})

        update_data = {}
        for key, value in effects.items():
            current = character.get(key, 0)
            update_data[key] = current + value

        for key in update_data:
            if key == 'hp':
                update_data[key] = min(update_data[key], character.get('max_hp', 100))
                update_data[key] = max(1, update_data[key])
            elif key == 'mp':
                update_data[key] = min(update_data[key], character.get('max_mp', 30))
                update_data[key] = max(0, update_data[key])
            elif key == 'time_energy':
                update_data[key] = min(update_data[key], character.get('time_energy_max', 100))
                update_data[key] = max(0, update_data[key])
            elif key == 'gold':
                update_data[key] = max(0, update_data[key])
            elif key == 'exp':
                pass

        if 'exp' in update_data:
            from app.business.sj.character_business import SjCharacterBusiness
            char_biz = SjCharacterBusiness()
            exp_amount = update_data.pop('exp')
            char_biz.add_exp(character_id, exp_amount)

        if update_data:
            self.character_model.update(character_id, update_data)

        self.event_log_model.create(
            character_id=character_id,
            floor_number=character.get('current_floor', 0),
            event_type=SjEventLogModel.EVENT_TYPE_CHOICE,
            event_id=event_id,
            event_description=event['description'],
            choice_made=choice['text'],
            result=choice['result']
        )

        updated = self.character_model.get_by_id(character_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'event': event,
                'choice': choice,
                'result_text': choice['result'],
                'effects': effects,
                'character': self.character_model.to_dict(updated)
            }
        }

    def rest_floor(self, character_id: int) -> Dict[str, Any]:
        character = self.character_model.get_by_id(character_id)
        if not character:
            return {'code': 1, 'msg': '角色不存在', 'data': None}

        restore_hp = character.get('max_hp', 100) // 2
        restore_mp = character.get('max_mp', 30) // 2
        restore_te = character.get('time_energy_max', 100) // 4

        update_data = {
            'hp': min(character.get('max_hp', 100), character.get('hp', 0) + restore_hp),
            'mp': min(character.get('max_mp', 30), character.get('mp', 0) + restore_mp),
            'time_energy': min(character.get('time_energy_max', 100), character.get('time_energy', 0) + restore_te)
        }
        self.character_model.update(character_id, update_data)

        self.event_log_model.create(
            character_id=character_id,
            floor_number=character.get('current_floor', 0),
            event_type='rest',
            event_description='在休息层恢复',
            result=f'恢复{restore_hp}HP, {restore_mp}MP, {restore_te}时间能量'
        )

        updated = self.character_model.get_by_id(character_id)
        return {
            'code': 0,
            'msg': '休息恢复成功',
            'data': self.character_model.to_dict(updated)
        }

    def get_random_event(self) -> Dict[str, Any]:
        event = self.event_log_model.get_random_event()
        return {'code': 0, 'msg': 'success', 'data': event}

    def revive_character(self, character_id: int) -> Dict[str, Any]:
        character = self.character_model.get_by_id(character_id)
        if not character:
            return {'code': 1, 'msg': '角色不存在', 'data': None}

        if character.get('status') != SjCharacterModel.STATUS_DEAD:
            return {'code': 1, 'msg': '角色未阵亡', 'data': None}

        gold_cost = character.get('level', 1) * 20
        if character.get('gold', 0) < gold_cost:
            return {'code': 1, 'msg': f'复活需要{gold_cost}金币', 'data': None}

        self.character_model.update(character_id, {
            'status': SjCharacterModel.STATUS_ALIVE,
            'hp': character.get('max_hp', 100) // 2,
            'mp': character.get('max_mp', 30) // 2,
            'gold': character.get('gold', 0) - gold_cost
        })

        updated = self.character_model.get_by_id(character_id)
        return {'code': 0, 'msg': '复活成功', 'data': self.character_model.to_dict(updated)}

    def get_ending(self, character_id: int) -> Dict[str, Any]:
        character = self.character_model.get_by_id(character_id)
        if not character:
            return {'code': 1, 'msg': '角色不存在', 'data': None}

        if character.get('current_floor', 0) < 25:
            return {'code': 1, 'msg': '尚未到达塔顶', 'data': None}

        class_type = character.get('class_type', 'warrior')
        ending_map = {
            'warrior': SjCharacterModel.CLASS_WARRIOR,
            'mage': SjCharacterModel.CLASS_MAGE,
            'thief': SjCharacterModel.CLASS_THIEF
        }

        if character.get('time_energy', 0) >= 80:
            ending = 'time_master'
        elif character.get('time_energy', 0) <= 10:
            ending = 'fall'
        else:
            ending = class_type

        from app.model.sj_model.save import SjSaveModel
        ending_names = SjSaveModel.ENDINGS

        return {
            'code': 0,
            'msg': '结局达成',
            'data': {
                'ending_type': ending,
                'ending_name': ending_names.get(ending, '未知结局'),
                'character': self.character_model.to_dict(character)
            }
        }
