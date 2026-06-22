from typing import Dict, Any, List, Tuple
import random
from app.model.fighter import BattleRecordModel, FistIntentStatsModel, ActiveBattleModel


INTENT_GANG = 'gang'
INTENT_ROU = 'rou'
INTENT_HUA = 'hua'

BASE_HP = 100
LIGHT_ATTACK_DAMAGE = 15
HEAVY_ATTACK_DAMAGE = 30
HEAVY_ATTACK_FRAMES = 2

DEFENSE_REDUCTION = {
    INTENT_GANG: 0.4,
    INTENT_HUA: 0.6,
    INTENT_ROU: 0.8,
}

ATTACK_BONUS = {
    INTENT_GANG: 0.3,
    INTENT_HUA: 0.0,
    INTENT_ROU: -0.2,
}

DEFENSE_BONUS = {
    INTENT_GANG: -0.2,
    INTENT_HUA: 0.0,
    INTENT_ROU: 0.3,
}

STEAL_PERCENT = 0.1


class Fighter:
    def __init__(self, name: str, is_player: bool = True):
        self.name = name
        self.is_player = is_player
        self.hp = BASE_HP
        self.max_hp = BASE_HP
        self.intent = INTENT_HUA
        self.combo_count = 0
        self.attack_bonus_steal = 0.0
        self.defense_bonus_steal = 0.0
        self.intent_switch_count = 0
        self.damage_dealt = 0
        self.is_defending = False
        self.heavy_attack_cooldown = 0

    def get_attack_multiplier(self) -> float:
        return 1.0 + ATTACK_BONUS[self.intent] + self.attack_bonus_steal

    def get_defense_multiplier(self) -> float:
        return 1.0 + DEFENSE_BONUS[self.intent] + self.defense_bonus_steal

    def get_defense_reduction(self) -> float:
        return DEFENSE_REDUCTION[self.intent]

    def switch_intent(self, new_intent: str) -> bool:
        if self.intent == new_intent:
            return False
        old_intent = self.intent
        self.intent = new_intent
        self.intent_switch_count += 1
        return True

    def take_damage(self, damage: int) -> int:
        actual_damage = damage
        if self.is_defending:
            reduction = self.get_defense_reduction() * self.get_defense_multiplier()
            reduction = max(0.0, min(0.95, reduction))
            actual_damage = int(damage * (1.0 - reduction))
        self.hp = max(0, self.hp - actual_damage)
        return actual_damage

    def is_alive(self) -> bool:
        return self.hp > 0

    def reset_defense(self):
        self.is_defending = False

    def steal_stats(self, target: 'Fighter') -> Dict[str, float]:
        steal_attack = target.attack_bonus_steal * STEAL_PERCENT
        steal_defense = target.defense_bonus_steal * STEAL_PERCENT
        
        target.attack_bonus_steal -= steal_attack
        target.defense_bonus_steal -= steal_defense
        
        self.attack_bonus_steal += steal_attack
        self.defense_bonus_steal += steal_defense
        
        return {
            'attack_stolen': round(steal_attack * 100, 1),
            'defense_stolen': round(steal_defense * 100, 1)
        }


class FighterBattleBusiness:
    def __init__(self):
        self.battle_model = BattleRecordModel()
        self.intent_stats_model = FistIntentStatsModel()
        self.active_battle_model = ActiveBattleModel()

    def get_active_battle(self) -> Dict[str, Any]:
        state = self.active_battle_model.get()
        if state:
            return {
                'code': 0,
                'message': 'success',
                'data': state
            }
        return {
            'code': 1,
            'message': 'no_active_battle',
            'data': None
        }

    def create_new_battle(self) -> Dict[str, Any]:
        player = Fighter('玩家', is_player=True)
        enemy = Fighter('对手', is_player=False)
        
        battle_state = {
            'round': 0,
            'player': self._fighter_to_dict(player),
            'enemy': self._fighter_to_dict(enemy),
            'battle_log': [],
            'intent_switches': [],
            'is_over': False,
            'winner': None,
            'battle_id': None
        }
        
        self.active_battle_model.save(battle_state)
        
        return {
            'code': 0,
            'message': 'success',
            'data': battle_state
        }

    def _fighter_to_dict(self, fighter: Fighter) -> Dict[str, Any]:
        return {
            'name': fighter.name,
            'hp': fighter.hp,
            'max_hp': fighter.max_hp,
            'intent': fighter.intent,
            'combo_count': fighter.combo_count,
            'attack_bonus_steal': round(fighter.attack_bonus_steal * 100, 1),
            'defense_bonus_steal': round(fighter.defense_bonus_steal * 100, 1),
            'intent_switch_count': fighter.intent_switch_count,
            'damage_dealt': fighter.damage_dealt,
            'is_defending': fighter.is_defending,
            'attack_multiplier': round(fighter.get_attack_multiplier() * 100 - 100, 1),
            'defense_multiplier': round(fighter.get_defense_multiplier() * 100 - 100, 1)
        }

    def execute_round(self, state: Dict[str, Any], player_action: str) -> Dict[str, Any]:
        if state.get('is_over', False):
            return {
                'code': 1,
                'message': '战斗已结束',
                'data': state
            }

        player = self._dict_to_fighter(state['player'], is_player=True)
        enemy = self._dict_to_fighter(state['enemy'], is_player=False)
        round_num = state['round'] + 1
        battle_log = state.get('battle_log', []).copy()
        intent_switches = state.get('intent_switches', []).copy()

        player.reset_defense()
        enemy.reset_defense()

        enemy_action = self._get_enemy_action(enemy, player)

        round_log = {
            'round': round_num,
            'player_action': player_action,
            'enemy_action': enemy_action,
            'events': []
        }

        player_attacking = player_action in ['light', 'heavy']
        enemy_attacking = enemy_action in ['light', 'heavy']
        player_defending = player_action == 'defend'
        enemy_defending = enemy_action == 'defend'

        if player_defending:
            player.is_defending = True
            round_log['events'].append({
                'side': 'player',
                'type': 'defend_start',
                'message': '玩家进入防御姿态'
            })

        if enemy_defending:
            enemy.is_defending = True
            round_log['events'].append({
                'side': 'enemy',
                'type': 'defend_start',
                'message': '对手进入防御姿态'
            })

        if player_attacking and not enemy_attacking:
            hit, damage, intent_switch = self._process_attack(
                attacker=player,
                defender=enemy,
                attack_type=player_action,
                attacker_side='player',
                defender_side='enemy',
                is_attacker_player=True,
                round_num=round_num,
                intent_switches=intent_switches,
                events=round_log['events']
            )

        elif enemy_attacking and not player_attacking:
            hit, damage, intent_switch = self._process_attack(
                attacker=enemy,
                defender=player,
                attack_type=enemy_action,
                attacker_side='enemy',
                defender_side='player',
                is_attacker_player=False,
                round_num=round_num,
                intent_switches=intent_switches,
                events=round_log['events']
            )

        elif player_attacking and enemy_attacking:
            player_first = self._resolve_speed(player_action, enemy_action)
            if player_first:
                hit_p, dmg_p, sw_p = self._process_attack(
                    player, enemy, player_action, 'player', 'enemy', True,
                    round_num, intent_switches, round_log['events']
                )
                if enemy.is_alive():
                    hit_e, dmg_e, sw_e = self._process_attack(
                        enemy, player, enemy_action, 'enemy', 'player', False,
                        round_num, intent_switches, round_log['events']
                    )
            else:
                hit_e, dmg_e, sw_e = self._process_attack(
                    enemy, player, enemy_action, 'enemy', 'player', False,
                    round_num, intent_switches, round_log['events']
                )
                if player.is_alive():
                    hit_p, dmg_p, sw_p = self._process_attack(
                        player, enemy, player_action, 'player', 'enemy', True,
                        round_num, intent_switches, round_log['events']
                    )

        else:
            round_log['events'].append({
                'side': 'both',
                'type': 'standoff',
                'message': '双方僵持，无人出招'
            })

        battle_log.append(round_log)

        is_over = not player.is_alive() or not enemy.is_alive()
        winner = None
        if is_over:
            if player.is_alive() and not enemy.is_alive():
                winner = 'player'
            elif enemy.is_alive() and not player.is_alive():
                winner = 'enemy'
            else:
                winner = 'draw'

        battle_id = state.get('battle_id')
        if is_over and battle_id is None:
            battle_id = self.battle_model.create(
                player_final_hp=player.hp,
                enemy_final_hp=enemy.hp,
                winner=winner,
                total_rounds=round_num,
                player_damage_dealt=player.damage_dealt,
                enemy_damage_dealt=enemy.damage_dealt,
                player_intent_switches=player.intent_switch_count,
                enemy_intent_switches=enemy.intent_switch_count
            )
            for sw in intent_switches:
                self.intent_stats_model.create(
                    battle_id=battle_id,
                    side=sw['side'],
                    from_intent=sw['from'],
                    to_intent=sw['to'],
                    round_num=sw['round'],
                    trigger_reason=sw['reason']
                )

        new_state = {
            'round': round_num,
            'player': self._fighter_to_dict(player),
            'enemy': self._fighter_to_dict(enemy),
            'battle_log': battle_log,
            'intent_switches': intent_switches,
            'is_over': is_over,
            'winner': winner,
            'battle_id': battle_id
        }

        if is_over:
            self.active_battle_model.clear()
        else:
            self.active_battle_model.save(new_state)

        return {
            'code': 0,
            'message': 'success',
            'data': new_state
        }

    def _dict_to_fighter(self, data: Dict[str, Any], is_player: bool) -> Fighter:
        fighter = Fighter(data['name'], is_player=is_player)
        fighter.hp = data['hp']
        fighter.intent = data['intent']
        fighter.combo_count = data.get('combo_count', 0)
        fighter.attack_bonus_steal = data.get('attack_bonus_steal', 0) / 100.0
        fighter.defense_bonus_steal = data.get('defense_bonus_steal', 0) / 100.0
        fighter.intent_switch_count = data.get('intent_switch_count', 0)
        fighter.damage_dealt = data.get('damage_dealt', 0)
        fighter.is_defending = data.get('is_defending', False)
        return fighter

    def _resolve_speed(self, player_action: str, enemy_action: str) -> bool:
        player_heavy = player_action == 'heavy'
        enemy_heavy = enemy_action == 'heavy'
        
        if player_heavy and not enemy_heavy:
            return False
        elif enemy_heavy and not player_heavy:
            return True
        else:
            return random.choice([True, False])

    def _process_attack(self, attacker: Fighter, defender: Fighter, attack_type: str,
                        attacker_side: str, defender_side: str, is_attacker_player: bool,
                        round_num: int, intent_switches: List[Dict], events: List[Dict]) -> Tuple[bool, int, bool]:
        base_damage = LIGHT_ATTACK_DAMAGE if attack_type == 'light' else HEAVY_ATTACK_DAMAGE
        attack_mult = attacker.get_attack_multiplier()
        damage = int(base_damage * attack_mult)

        attack_name = '轻拳' if attack_type == 'light' else '重拳'
        
        events.append({
            'side': attacker_side,
            'type': 'attack',
            'message': f'{attacker.name}使出{attack_name}',
            'damage': damage,
            'attack_type': attack_type
        })

        actual_damage = defender.take_damage(damage)
        attacker.damage_dealt += actual_damage

        hit = True
        switched_intent = False
        switch_reason = ''

        if defender.is_defending:
            events.append({
                'side': defender_side,
                'type': 'defend_success',
                'message': f'{defender.name}防御成功，减伤后受到{actual_damage}点伤害',
                'actual_damage': actual_damage
            })
            
            if is_attacker_player:
                switch_result = self._try_switch_intent(
                    defender, 'defend_success', 'enemy', round_num, intent_switches, events
                )
            else:
                switch_result = self._try_switch_intent(
                    defender, 'defend_success', 'player', round_num, intent_switches, events
                )
            if switch_result:
                switched_intent = True
                switch_reason = 'defend_success'
        else:
            events.append({
                'side': defender_side,
                'type': 'hit',
                'message': f'{defender.name}被击中，受到{actual_damage}点伤害',
                'actual_damage': actual_damage
            })
            
            attacker.combo_count += 1
            
            if is_attacker_player:
                switch_result = self._try_switch_intent(
                    attacker, 'attack_hit', 'player', round_num, intent_switches, events
                )
            else:
                switch_result = self._try_switch_intent(
                    attacker, 'attack_hit', 'enemy', round_num, intent_switches, events
                )
            if switch_result:
                switched_intent = True
                switch_reason = 'attack_hit'
            
            if attacker.intent == INTENT_HUA:
                steal_result = attacker.steal_stats(defender)
                if steal_result['attack_stolen'] > 0 or steal_result['defense_stolen'] > 0:
                    events.append({
                        'side': attacker_side,
                        'type': 'steal',
                        'message': f'化拳意发动！偷取攻击+{steal_result["attack_stolen"]}% 防御+{steal_result["defense_stolen"]}%',
                        'steal': steal_result
                    })
            
            if attacker.combo_count >= 3:
                if is_attacker_player:
                    switch_result = self._try_switch_intent(
                        attacker, 'combo_3', 'player', round_num, intent_switches, events
                    )
                else:
                    switch_result = self._try_switch_intent(
                        attacker, 'combo_3', 'enemy', round_num, intent_switches, events
                    )
                if switch_result:
                    switched_intent = True
                    switch_reason = 'combo_3'
                attacker.combo_count = 0

        if not defender.is_alive():
            events.append({
                'side': defender_side,
                'type': 'ko',
                'message': f'{defender.name}被击倒！'
            })

        return hit, actual_damage, switched_intent

    def _try_switch_intent(self, fighter: Fighter, trigger: str, side: str,
                           round_num: int, intent_switches: List[Dict], events: List[Dict]) -> bool:
        if fighter.is_player:
            new_intent = self._get_player_switch_intent(fighter.intent, trigger)
        else:
            new_intent = self._get_enemy_switch_intent(fighter.intent, trigger)
        
        if new_intent and fighter.intent != new_intent:
            old_intent = fighter.intent
            fighter.switch_intent(new_intent)
            intent_switches.append({
                'side': side,
                'from': old_intent,
                'to': new_intent,
                'round': round_num,
                'reason': trigger
            })
            
            intent_names = {INTENT_GANG: '刚拳意', INTENT_ROU: '柔拳意', INTENT_HUA: '化拳意'}
            trigger_names = {
                'attack_hit': '攻击命中',
                'defend_success': '防御成功',
                'combo_3': '3连击'
            }
            
            events.append({
                'side': side,
                'type': 'intent_switch',
                'message': f'{fighter.name}因{trigger_names[trigger]}切换为{intent_names[new_intent]}',
                'from': old_intent,
                'to': new_intent,
                'trigger': trigger
            })
            return True
        return False

    def _get_player_switch_intent(self, current_intent: str, trigger: str) -> str:
        if trigger == 'defend_success':
            return INTENT_GANG
        elif trigger == 'attack_hit':
            return INTENT_ROU
        elif trigger == 'combo_3':
            return INTENT_HUA
        return current_intent

    def _get_enemy_switch_intent(self, current_intent: str, trigger: str) -> str:
        if trigger == 'attack_hit':
            return INTENT_GANG
        elif trigger == 'defend_success':
            return INTENT_ROU
        elif trigger == 'combo_3':
            return INTENT_HUA
        return current_intent

    def _get_enemy_action(self, enemy: Fighter, player: Fighter) -> str:
        actions = ['light', 'heavy', 'defend']
        weights = [0.5, 0.3, 0.2]
        
        if player.intent == INTENT_GANG:
            weights[2] = 0.4
            weights[0] = 0.4
            weights[1] = 0.2
        elif player.intent == INTENT_ROU:
            weights[1] = 0.4
            weights[0] = 0.4
            weights[2] = 0.2
        
        if enemy.combo_count >= 2:
            weights[0] += 0.1
            weights[1] += 0.1
        
        total = sum(weights)
        weights = [w / total for w in weights]
        
        return random.choices(actions, weights=weights, k=1)[0]

    def get_battle_records(self, limit: int = 10) -> Dict[str, Any]:
        records = self.battle_model.get_recent(limit)
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': records,
                'count': len(records)
            }
        }

    def get_battle_stats(self) -> Dict[str, Any]:
        win_rate = self.battle_model.get_win_rate()
        total_switches = self.intent_stats_model.count()
        trigger_stats = self.intent_stats_model.get_trigger_reason_stats()
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'win_rate': win_rate,
                'total_intent_switches': total_switches,
                'trigger_stats': trigger_stats.get('items', [])
            }
        }
