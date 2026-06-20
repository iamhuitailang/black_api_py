import random
import math
from typing import Dict, Any, List, Tuple, Optional
from app.model.glacier import GameModel, TeamMemberModel, IceLayerModel
from app.model.glacier.game import GameStatus


INITIAL_STAMINA = 300
TOTAL_LAYERS = 10
TEAM_SIZE = 5

COLD_RESISTANCE_MIN = 50
COLD_RESISTANCE_MAX = 120
DIG_EFFICIENCY_MIN = 2
DIG_EFFICIENCY_MAX = 8

ICE_THICKNESS_MIN = 20
ICE_THICKNESS_MAX = 100
ICE_TEMP_MIN = -40
ICE_TEMP_MAX = -5

COLD_DECAY_FACTOR = 0.15
STAMINA_PER_UNIT_FACTOR = 0.1
FROSTBITE_DAMAGE = 5

CRACK_BASE_CHANCE = 0.10
CRACK_CHANCE_INCREMENT = 0.08
CRACK_TEMP_PENALTY = 10

SUPPLY_INTERVAL = 3
SUPPLY_STAMINA_PERCENT = 0.20
SUPPLY_COLD_RESIST = 15
TRAP_CHANCE = 0.35
TRAP_STAMINA_PERCENT = 0.25

TEAM_NAMES = ['队长·冷锋', '工程兵·冰钻', '医疗兵·雪莲', '侦察兵·雪狼', '爆破手·雷鸣']


class GlacierBusiness:
    def __init__(self):
        self.game_model = GameModel()
        self.team_model = TeamMemberModel()
        self.layer_model = IceLayerModel()

    def new_game(self) -> Dict[str, Any]:
        game_id = self.game_model.create(
            total_layers=TOTAL_LAYERS,
            max_stamina=INITIAL_STAMINA
        )

        self._generate_team(game_id)
        self._generate_layers(game_id)

        return self.get_game_state(game_id)

    def _generate_team(self, game_id: int):
        for name in TEAM_NAMES:
            cold_resist = random.uniform(COLD_RESISTANCE_MIN, COLD_RESISTANCE_MAX)
            dig_eff = random.uniform(DIG_EFFICIENCY_MIN, DIG_EFFICIENCY_MAX)
            self.team_model.create(
                game_id=game_id,
                name=name,
                cold_resistance=round(cold_resist, 1),
                dig_efficiency=round(dig_eff, 1)
            )

    def _generate_layers(self, game_id: int):
        for i in range(1, TOTAL_LAYERS + 1):
            thickness = random.uniform(ICE_THICKNESS_MIN, ICE_THICKNESS_MAX)
            temperature = random.uniform(ICE_TEMP_MIN, ICE_TEMP_MAX)

            crack_chance = CRACK_BASE_CHANCE + (i - 1) * CRACK_CHANCE_INCREMENT
            has_crack = random.random() < crack_chance

            has_supply = (i % SUPPLY_INTERVAL == 0)

            self.layer_model.create(
                game_id=game_id,
                layer_index=i,
                thickness=round(thickness, 1),
                temperature=round(temperature, 1),
                has_crack=has_crack,
                has_supply=has_supply
            )

    def get_game_state(self, game_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {
                'code': 1,
                'message': '游戏不存在',
                'data': None
            }

        members = self.team_model.get_members_by_game(game_id)
        layers = self.layer_model.get_layers_by_game(game_id)

        current_layer_index = game['current_layer']
        current_layer = None
        for layer in layers:
            if layer['layer_index'] == current_layer_index:
                current_layer = layer
                break

        visible_layers = []
        for layer in layers:
            layer_info = {
                'layer_index': layer['layer_index'],
                'thickness': layer['thickness'],
                'temperature': layer['temperature'],
                'dug_progress': layer['dug_progress'],
                'has_crack': bool(layer['has_crack']) and bool(layer['crack_found']),
                'crack_found': bool(layer['crack_found']),
                'has_supply': bool(layer['has_supply']),
                'supply_used': bool(layer['supply_used']),
                'supply_trapped': bool(layer['supply_trapped']),
                'is_current': layer['layer_index'] == current_layer_index,
                'is_passed': layer['layer_index'] < current_layer_index
            }
            visible_layers.append(layer_info)

        team_members = []
        for m in members:
            team_members.append({
                'id': m['id'],
                'name': m['name'],
                'cold_resistance': m['cold_resistance'],
                'max_cold_resistance': m['max_cold_resistance'],
                'dig_efficiency': m['dig_efficiency'],
                'base_dig_efficiency': m['base_dig_efficiency'],
                'is_frostbitten': bool(m['is_frostbitten']),
                'health': m['health'],
                'max_health': m['max_health']
            })

        all_dead = all(m['health'] <= 0 for m in members)
        if all_dead and game['status'] == GameStatus.PLAYING:
            self.game_model.set_status(game_id, GameStatus.DEFEAT)
            game['status'] = GameStatus.DEFEAT

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'game_id': game['id'],
                'status': game['status'],
                'current_layer': game['current_layer'],
                'total_layers': game['total_layers'],
                'stamina': game['stamina'],
                'max_stamina': game['max_stamina'],
                'turn_count': game['turn_count'],
                'is_stamina_depleted': bool(game['is_stamina_depleted']),
                'team_members': team_members,
                'layers': visible_layers,
                'current_layer_info': {
                    'layer_index': current_layer['layer_index'],
                    'thickness': current_layer['thickness'],
                    'temperature': current_layer['temperature'],
                    'dug_progress': current_layer['dug_progress'],
                    'has_crack': bool(current_layer['has_crack']),
                    'crack_found': bool(current_layer['crack_found']),
                    'has_supply': bool(current_layer['has_supply']),
                    'supply_used': bool(current_layer['supply_used']),
                    'supply_trapped': bool(current_layer['supply_trapped'])
                } if current_layer else None
            }
        }

    def dig(self, game_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game or game['status'] != GameStatus.PLAYING:
            return {
                'code': 1,
                'message': '游戏未进行中',
                'data': None
            }

        layer = self.layer_model.get_by_game_and_layer(game_id, game['current_layer'])
        if not layer:
            return {
                'code': 1,
                'message': '冰层数据错误',
                'data': None
            }

        members = self.team_model.get_members_by_game(game_id)
        alive_members = [m for m in members if m['health'] > 0]

        if not alive_members:
            self.game_model.set_status(game_id, GameStatus.DEFEAT)
            return {
                'code': 1,
                'message': '全员阵亡，任务失败',
                'data': None
            }

        layer_temp = layer['temperature']
        if layer['has_crack'] and layer['crack_found']:
            layer_temp -= CRACK_TEMP_PENALTY

        total_efficiency = 0
        stamina_depleted = game['stamina'] <= 0

        for m in alive_members:
            eff = m['dig_efficiency']
            if stamina_depleted:
                eff *= 0.5
            total_efficiency += eff

        remaining = layer['thickness'] - layer['dug_progress']
        actual_dig = min(total_efficiency, remaining)

        stamina_cost = actual_dig * abs(layer_temp) * STAMINA_PER_UNIT_FACTOR
        new_stamina = max(0, game['stamina'] - stamina_cost)
        now_stamina_depleted = new_stamina <= 0

        new_progress = layer['dug_progress'] + actual_dig
        self.layer_model.update_progress(layer['id'], new_progress)

        self.game_model.update_game(
            game_id,
            stamina=new_stamina,
            is_stamina_depleted=1 if now_stamina_depleted else 0
        )

        messages = []
        messages.append(f'本回合挖掘 {round(actual_dig, 1)} 单位厚度')
        messages.append(f'消耗体能 {round(stamina_cost, 1)}')

        self._apply_cold_decay(members, layer_temp, messages)

        crack_found = False
        if layer['has_crack'] and not layer['crack_found'] and new_progress > 0:
            discover_chance = new_progress / layer['thickness']
            if random.random() < discover_chance:
                self.layer_model.mark_crack_found(layer['id'])
                crack_found = True
                messages.append('发现裂缝通道！可直接穿越到下一层')

        layer_passed = new_progress >= layer['thickness']
        if layer_passed:
            next_layer = game['current_layer'] + 1
            if next_layer > game['total_layers']:
                self.game_model.set_status(game_id, GameStatus.VICTORY)
                messages.append('恭喜！成功渗透所有冰层，任务完成！')
            else:
                self.game_model.next_layer(game_id, next_layer)
                messages.append(f'突破第 {game["current_layer"]} 层，进入第 {next_layer} 层')

        self.game_model.increment_turn(game_id)

        self._check_game_over(game_id, members)

        state_result = self.get_game_state(game_id)
        if state_result['code'] == 0:
            state_result['data']['turn_events'] = messages
            state_result['data']['crack_found'] = crack_found
            state_result['data']['layer_passed'] = layer_passed

        return state_result

    def _apply_cold_decay(self, members: List[Dict[str, Any]], layer_temp: float, messages: List[str]):
        decay_per_person = abs(layer_temp) * COLD_DECAY_FACTOR
        frostbite_new = []

        for m in members:
            if m['health'] <= 0:
                continue

            new_cold = m['cold_resistance'] - decay_per_person

            if m['is_frostbitten']:
                new_health = m['health'] - FROSTBITE_DAMAGE
                if new_health <= 0:
                    new_health = 0
                    messages.append(f'{m["name"]} 因冻伤过重牺牲')
                self.team_model.update_member(
                    m['id'],
                    cold_resistance=max(0, new_cold),
                    health=new_health
                )
            else:
                if new_cold <= 0:
                    self.team_model.set_frostbitten(m['id'], True)
                    self.team_model.update_member(m['id'], cold_resistance=0)
                    frostbite_new.append(m['name'])
                else:
                    self.team_model.update_member(m['id'], cold_resistance=round(new_cold, 1))

        if frostbite_new:
            messages.append(f'{", ".join(frostbite_new)} 进入冻伤状态！')

    def _check_game_over(self, game_id: int, members: List[Dict[str, Any]]):
        all_dead = all(m['health'] <= 0 for m in members)
        if all_dead:
            self.game_model.set_status(game_id, GameStatus.DEFEAT)

    def use_crack(self, game_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game or game['status'] != GameStatus.PLAYING:
            return {
                'code': 1,
                'message': '游戏未进行中',
                'data': None
            }

        if game['stamina'] <= 0:
            return {
                'code': 1,
                'message': '体能耗尽，无法执行特殊操作',
                'data': None
            }

        layer = self.layer_model.get_by_game_and_layer(game_id, game['current_layer'])
        if not layer or not layer['has_crack'] or not layer['crack_found']:
            return {
                'code': 1,
                'message': '当前层没有可用裂缝',
                'data': None
            }

        next_layer_idx = game['current_layer'] + 1
        messages = [f'通过裂缝穿越第 {game["current_layer"]} 层']

        if next_layer_idx > game['total_layers']:
            self.game_model.set_status(game_id, GameStatus.VICTORY)
            messages.append('恭喜！成功渗透所有冰层，任务完成！')
        else:
            self.game_model.next_layer(game_id, next_layer_idx)
            messages.append(f'直接进入第 {next_layer_idx} 层')

            next_layer = self.layer_model.get_by_game_and_layer(game_id, next_layer_idx)
            if next_layer and next_layer['has_crack']:
                self.layer_model.mark_crack_found(next_layer['id'])
                messages.append('在下层也发现了相连的裂缝！')

        self.game_model.increment_turn(game_id)

        state_result = self.get_game_state(game_id)
        if state_result['code'] == 0:
            state_result['data']['turn_events'] = messages

        return state_result

    def use_supply(self, game_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game or game['status'] != GameStatus.PLAYING:
            return {
                'code': 1,
                'message': '游戏未进行中',
                'data': None
            }

        layer = self.layer_model.get_by_game_and_layer(game_id, game['current_layer'])
        if not layer or not layer['has_supply'] or layer['supply_used']:
            return {
                'code': 1,
                'message': '当前层没有可用补给站',
                'data': None
            }

        messages = []
        trapped = random.random() < TRAP_CHANCE

        if trapped:
            stamina_loss = game['max_stamina'] * TRAP_STAMINA_PERCENT
            new_stamina = max(0, game['stamina'] - stamina_loss)
            self.game_model.update_game(game_id, stamina=new_stamina)

            members = self.team_model.get_members_by_game(game_id)
            alive_members = [m for m in members if m['health'] > 0 and not m['is_frostbitten']]
            if alive_members:
                victim = random.choice(alive_members)
                self.team_model.set_frostbitten(victim['id'], True)
                self.team_model.update_member(victim['id'], cold_resistance=0)
                messages.append(f'补给站触发陷阱！损失 {round(stamina_loss, 1)} 体能，{victim["name"]} 冻伤')
            else:
                messages.append(f'补给站触发陷阱！损失 {round(stamina_loss, 1)} 体能')

            self.layer_model.mark_supply_used(layer['id'], trapped=True)
        else:
            stamina_gain = game['max_stamina'] * SUPPLY_STAMINA_PERCENT
            new_stamina = min(game['max_stamina'], game['stamina'] + stamina_gain)
            self.game_model.update_game(game_id, stamina=new_stamina)

            members = self.team_model.get_members_by_game(game_id)
            for m in members:
                if m['health'] > 0:
                    new_cold = min(m['max_cold_resistance'], m['cold_resistance'] + SUPPLY_COLD_RESIST)
                    if m['is_frostbitten'] and new_cold > 0:
                        self.team_model.set_frostbitten(m['id'], False)
                        self.team_model.update_member(
                            m['id'],
                            cold_resistance=round(new_cold, 1),
                            dig_efficiency=m['base_dig_efficiency']
                        )
                    else:
                        self.team_model.update_member(m['id'], cold_resistance=round(new_cold, 1))

            messages.append(f'补给成功！恢复 {round(stamina_gain, 1)} 体能，全员耐寒值 +{SUPPLY_COLD_RESIST}')
            self.layer_model.mark_supply_used(layer['id'], trapped=False)

        self.game_model.increment_turn(game_id)
        self._check_game_over_after_supply(game_id)

        state_result = self.get_game_state(game_id)
        if state_result['code'] == 0:
            state_result['data']['turn_events'] = messages
            state_result['data']['supply_trapped'] = trapped

        return state_result

    def _check_game_over_after_supply(self, game_id: int):
        members = self.team_model.get_members_by_game(game_id)
        all_dead = all(m['health'] <= 0 for m in members)
        if all_dead:
            self.game_model.set_status(game_id, GameStatus.DEFEAT)

    def get_latest_game(self) -> Dict[str, Any]:
        game = self.game_model.get_latest()
        if not game:
            return {
                'code': 1,
                'message': '没有进行中的游戏',
                'data': None
            }
        return self.get_game_state(game['id'])
