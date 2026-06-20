import json
import random
from typing import Dict, Any, List, Optional, Tuple
from app.model.train import GameStateModel, CarriageModel, EventLogModel, UpgradeModel


class TrainBusiness:
    FUEL_CONSUMPTION_PER_SECOND = 0.5
    EVENT_DISTANCE_INTERVAL = 50
    GAS_STATION_FUEL_AMOUNT = 20

    def __init__(self):
        self.game_state_model = GameStateModel()
        self.carriage_model = CarriageModel()
        self.event_log_model = EventLogModel()
        self.upgrade_model = UpgradeModel()

    def start_new_game(self) -> Dict[str, Any]:
        existing_state = self.game_state_model.get_current_state()
        if existing_state and existing_state.get('is_running', 0) == 1:
            return {
                'code': 1,
                'message': '游戏已在运行中',
                'data': None
            }

        game_state_id = self.game_state_model.create_initial_state()
        self.carriage_model.create_initial_carriages(game_state_id)
        self.event_log_model.log_event(
            game_state_id,
            'system',
            '末日列车启动！在废土上永不停歇地前进吧！',
            0,
            1
        )

        return {
            'code': 0,
            'message': '游戏启动成功',
            'data': self._assemble_game_data(game_state_id)
        }

    def get_game_state(self) -> Dict[str, Any]:
        state = self.game_state_model.get_current_state()
        if not state:
            return {
                'code': 1,
                'message': '游戏未启动',
                'data': None
            }
        return {
            'code': 0,
            'message': 'success',
            'data': self._assemble_game_data(state['id'])
        }

    def tick(self, delta_seconds: float = 1.0) -> Dict[str, Any]:
        state = self.game_state_model.get_current_state()
        if not state or state.get('is_running', 0) == 0:
            return {
                'code': 1,
                'message': '列车已停止运行',
                'data': None
            }

        if state['fuel'] <= 0:
            self._game_over(state['id'], '燃料耗尽，列车停止了...')
            return {
                'code': 1,
                'message': '燃料耗尽，游戏结束',
                'data': None
            }

        carriages = self.carriage_model.get_by_game_state(state['id'])
        cockpit = next((c for c in carriages if c['carriage_type'] == 'cockpit'), None)
        if cockpit and cockpit['hp'] <= 0:
            self._game_over(state['id'], '驾驶舱被摧毁，列车失控...')
            return {
                'code': 1,
                'message': '驾驶舱损毁，游戏结束',
                'data': None
            }

        speed_bonus = cockpit['speed_bonus'] if cockpit else 0
        current_speed = state['speed'] + speed_bonus
        distance_increase = current_speed * delta_seconds
        fuel_consumption = self.FUEL_CONSUMPTION_PER_SECOND * delta_seconds
        new_distance = state['distance'] + distance_increase
        new_fuel = max(0, state['fuel'] - fuel_consumption)

        updates = {
            'distance': new_distance,
            'fuel': new_fuel,
        }

        current_event = state.get('current_event')
        event_result = None

        if current_event:
            event_data = json.loads(state.get('event_data', '{}'))
            event_result = self._process_active_event(state['id'], current_event, event_data, delta_seconds)
            if event_result.get('clear_event'):
                updates['current_event'] = None
                updates['event_data'] = None
        else:
            old_event_zone = int(state['distance'] // self.EVENT_DISTANCE_INTERVAL)
            new_event_zone = int(new_distance // self.EVENT_DISTANCE_INTERVAL)
            if new_event_zone > old_event_zone and random.random() < 0.7:
                event_result = self._generate_random_event(state['id'], new_distance)
                if event_result:
                    updates['current_event'] = event_result['event_type']
                    updates['event_data'] = json.dumps(event_result['event_data'])

        self.game_state_model.update_state(state['id'], updates)

        return {
            'code': 0,
            'message': 'success',
            'data': {
                **self._assemble_game_data(state['id']),
                'event_result': event_result
            }
        }

    def _process_active_event(self, game_state_id: int, event_type: str, 
                              event_data: Dict[str, Any], delta_seconds: float) -> Dict[str, Any]:
        result = {'clear_event': False, 'message': ''}

        if event_type == 'bridge':
            event_data['countdown'] = event_data.get('countdown', 5) - delta_seconds
            if event_data['countdown'] <= 0:
                if event_data.get('track_switched', False):
                    result['clear_event'] = True
                    result['message'] = '成功切换轨道，安全通过桥梁！'
                    self.event_log_model.log_event(
                        game_state_id, 'bridge', result['message'], 
                        event_data.get('distance', 0), 1
                    )
                else:
                    damage = 50
                    self._damage_random_carriage(game_state_id, damage)
                    result['clear_event'] = True
                    result['message'] = f'未能及时切换轨道！列车受到{damage}点伤害！'
                    self.event_log_model.log_event(
                        game_state_id, 'damage', result['message'],
                        event_data.get('distance', 0), 1
                    )
                return result

            state = self.game_state_model.get_current_state()
            self.game_state_model.update_state(state['id'], {
                'event_data': json.dumps(event_data)
            })
            result['message'] = f'桥梁断裂！请在{event_data["countdown"]:.1f}秒内切换轨道！'

        elif event_type == 'bandit':
            event_data['attack_timer'] = event_data.get('attack_timer', 0) + delta_seconds
            if event_data['attack_timer'] >= 2:
                bandit_damage = random.randint(5, 15)
                self._damage_random_carriage(game_state_id, bandit_damage)
                event_data['attack_timer'] = 0
                result['message'] = f'劫匪开火！列车受到{bandit_damage}点伤害！'
                self.event_log_model.log_event(
                    game_state_id, 'damage', result['message'],
                    event_data.get('distance', 0), 1
                )
                state = self.game_state_model.get_current_state()
                self.game_state_model.update_state(state['id'], {
                    'event_data': json.dumps(event_data)
                })

        return result

    def _generate_random_event(self, game_state_id: int, distance: float) -> Optional[Dict[str, Any]]:
        events = ['bandit', 'roadblock', 'bridge', 'gas_station']
        weights = [0.35, 0.3, 0.15, 0.2]
        event_type = random.choices(events, weights=weights, k=1)[0]

        event_data = {'distance': distance}

        if event_type == 'bandit':
            bandit_count = random.randint(1, 3)
            event_data['bandits'] = []
            for i in range(bandit_count):
                event_data['bandits'].append({
                    'id': i,
                    'hp': random.randint(30, 60),
                    'max_hp': 60
                })
            event_data['attack_timer'] = 0
            desc = f'遭遇劫匪车队！{bandit_count}名劫匪出现，准备战斗！'
            self.event_log_model.log_event(game_state_id, 'bandit', desc, distance, 0)

        elif event_type == 'roadblock':
            event_data['clear_cost'] = random.randint(10, 30)
            desc = f'前方有路障！需要消耗{event_data["clear_cost"]}物资清除'
            self.event_log_model.log_event(game_state_id, 'roadblock', desc, distance, 0)

        elif event_type == 'bridge':
            event_data['countdown'] = 5
            event_data['track_switched'] = False
            desc = '桥梁即将断裂！请在5秒内切换轨道！'
            self.event_log_model.log_event(game_state_id, 'bridge', desc, distance, 0)

        elif event_type == 'gas_station':
            event_data['fuel_amount'] = self.GAS_STATION_FUEL_AMOUNT
            desc = f'发现加油站！可以补充{self.GAS_STATION_FUEL_AMOUNT}单位燃料'
            self.event_log_model.log_event(game_state_id, 'gas_station', desc, distance, 0)
            return None

        return {'event_type': event_type, 'event_data': event_data}

    def fire_weapon(self) -> Dict[str, Any]:
        state = self.game_state_model.get_current_state()
        if not state or state.get('is_running', 0) == 0:
            return {'code': 1, 'message': '游戏未运行', 'data': None}

        if state.get('current_event') != 'bandit':
            return {'code': 1, 'message': '当前没有战斗目标', 'data': None}

        event_data = json.loads(state.get('event_data', '{}'))
        bandits = event_data.get('bandits', [])
        if not bandits:
            return {'code': 1, 'message': '没有可攻击的目标', 'data': None}

        carriages = self.carriage_model.get_by_game_state(state['id'])
        weapon_carriage = next((c for c in carriages if c['carriage_type'] == 'weapon'), None)
        if not weapon_carriage or weapon_carriage['hp'] <= 0:
            return {'code': 1, 'message': '武器舱已损坏，无法开火', 'data': None}

        damage = weapon_carriage['attack_power']
        target = bandits[0]
        target['hp'] -= damage

        result_msg = f'武器舱开火！对劫匪造成{damage}点伤害！'

        if target['hp'] <= 0:
            bandits.pop(0)
            result_msg += f' 击败了一名劫匪！'
            self.event_log_model.log_event(
                state['id'], 'combat', '击败一名劫匪', state['distance'], 1
            )

        if len(bandits) == 0:
            reward = random.randint(50, 150)
            result_msg += f' 所有劫匪已被消灭！获得{reward}资源'
            self.event_log_model.log_event(
                state['id'], 'combat', f'战斗胜利！获得{reward}资源', state['distance'], 1
            )
            updates = {
                'current_event': None,
                'event_data': None,
            }
            self.game_state_model.update_state(state['id'], updates)
            return {
                'code': 0,
                'message': result_msg,
                'data': {
                    'bandits_defeated': True,
                    'reward': reward
                }
            }

        event_data['bandits'] = bandits
        self.game_state_model.update_state(state['id'], {
            'event_data': json.dumps(event_data)
        })

        return {
            'code': 0,
            'message': result_msg,
            'data': {
                'bandits_remaining': len(bandits),
                'damage_dealt': damage
            }
        }

    def clear_roadblock(self) -> Dict[str, Any]:
        state = self.game_state_model.get_current_state()
        if not state or state.get('is_running', 0) == 0:
            return {'code': 1, 'message': '游戏未运行', 'data': None}

        if state.get('current_event') != 'roadblock':
            return {'code': 1, 'message': '当前没有路障需要清除', 'data': None}

        event_data = json.loads(state.get('event_data', '{}'))
        cost = event_data.get('clear_cost', 20)

        carriages = self.carriage_model.get_by_game_state(state['id'])
        cargo = next((c for c in carriages if c['carriage_type'] == 'cargo'), None)
        if not cargo or cargo['hp'] <= 0:
            return {'code': 1, 'message': '货舱已损坏，无法使用物资', 'data': None}

        if cargo['cargo_capacity'] < cost:
            return {'code': 1, 'message': f'物资不足！需要{cost}，当前{cargo["cargo_capacity"]}', 'data': None}

        self.carriage_model.update_carriage(cargo['id'], {
            'cargo_capacity': cargo['cargo_capacity'] - cost
        })

        self.game_state_model.update_state(state['id'], {
            'current_event': None,
            'event_data': None
        })

        self.event_log_model.log_event(
            state['id'], 'roadblock', 
            f'消耗{cost}物资清除了路障', state['distance'], 1
        )

        return {
            'code': 0,
            'message': f'成功清除路障！消耗{cost}物资',
            'data': {'cost': cost}
        }

    def switch_track(self) -> Dict[str, Any]:
        state = self.game_state_model.get_current_state()
        if not state or state.get('is_running', 0) == 0:
            return {'code': 1, 'message': '游戏未运行', 'data': None}

        if state.get('current_event') != 'bridge':
            return {'code': 1, 'message': '当前不需要切换轨道', 'data': None}

        event_data = json.loads(state.get('event_data', '{}'))
        event_data['track_switched'] = True

        self.game_state_model.update_state(state['id'], {
            'event_data': json.dumps(event_data)
        })

        self.event_log_model.log_event(
            state['id'], 'bridge', '成功切换轨道！', state['distance'], 1
        )

        return {
            'code': 0,
            'message': '轨道已切换！',
            'data': {'track_switched': True}
        }

    def refuel(self) -> Dict[str, Any]:
        state = self.game_state_model.get_current_state()
        if not state or state.get('is_running', 0) == 0:
            return {'code': 1, 'message': '游戏未运行', 'data': None}

        if state.get('current_event') != 'gas_station':
            return {'code': 1, 'message': '当前不在加油站', 'data': None}

        event_data = json.loads(state.get('event_data', '{}'))
        fuel_amount = event_data.get('fuel_amount', self.GAS_STATION_FUEL_AMOUNT)
        new_fuel = min(state['max_fuel'], state['fuel'] + fuel_amount)
        actual_added = new_fuel - state['fuel']

        self.game_state_model.update_state(state['id'], {
            'fuel': new_fuel,
            'current_event': None,
            'event_data': None
        })

        self.event_log_model.log_event(
            state['id'], 'gas_station',
            f'补充了{actual_added:.1f}单位燃料', state['distance'], 1
        )

        return {
            'code': 0,
            'message': f'加油成功！燃料+{actual_added:.1f}',
            'data': {'fuel_added': actual_added}
        }

    def upgrade_carriage(self, carriage_type: str) -> Dict[str, Any]:
        state = self.game_state_model.get_current_state()
        if not state or state.get('is_running', 0) == 0:
            return {'code': 1, 'message': '游戏未运行', 'data': None}

        carriages = self.carriage_model.get_by_game_state(state['id'])
        carriage = next((c for c in carriages if c['carriage_type'] == carriage_type), None)
        if not carriage:
            return {'code': 1, 'message': f'找不到{carriage_type}车厢', 'data': None}

        cost = self.upgrade_model.get_upgrade_cost(carriage['level'])
        cargo = next((c for c in carriages if c['carriage_type'] == 'cargo'), None)
        if not cargo or cargo['cargo_capacity'] < cost:
            return {'code': 1, 'message': f'资源不足！需要{cost}，当前{cargo["cargo_capacity"] if cargo else 0}', 'data': None}

        self.carriage_model.update_carriage(cargo['id'], {
            'cargo_capacity': cargo['cargo_capacity'] - cost
        })

        self.carriage_model.upgrade_carriage(carriage['id'])

        self.upgrade_model.record_upgrade(
            state['id'], carriage['id'], carriage_type,
            carriage['level'], carriage['level'] + 1, cost
        )

        self.event_log_model.log_event(
            state['id'], 'upgrade',
            f'{carriage["name"]}升级到{carriage["level"] + 1}级！消耗{cost}资源',
            state['distance'], 1
        )

        updated_carriages = self.carriage_model.get_by_game_state(state['id'])

        return {
            'code': 0,
            'message': f'{carriage["name"]}升级成功！',
            'data': {
                'carriages': updated_carriages,
                'cost': cost,
                'new_level': carriage['level'] + 1
            }
        }

    def repair_carriage(self, carriage_type: str, amount: int = 20) -> Dict[str, Any]:
        state = self.game_state_model.get_current_state()
        if not state or state.get('is_running', 0) == 0:
            return {'code': 1, 'message': '游戏未运行', 'data': None}

        carriages = self.carriage_model.get_by_game_state(state['id'])
        carriage = next((c for c in carriages if c['carriage_type'] == carriage_type), None)
        if not carriage:
            return {'code': 1, 'message': f'找不到{carriage_type}车厢', 'data': None}

        if carriage['hp'] >= carriage['max_hp']:
            return {'code': 1, 'message': f'{carriage["name"]}血量已满', 'data': None}

        cost = amount * 2
        cargo = next((c for c in carriages if c['carriage_type'] == 'cargo'), None)
        if not cargo or cargo['cargo_capacity'] < cost:
            return {'code': 1, 'message': f'资源不足！需要{cost}，当前{cargo["cargo_capacity"] if cargo else 0}', 'data': None}

        self.carriage_model.update_carriage(cargo['id'], {
            'cargo_capacity': cargo['cargo_capacity'] - cost
        })

        self.carriage_model.repair_carriage(carriage['id'], amount)

        self.event_log_model.log_event(
            state['id'], 'system',
            f'修复{carriage["name"]} {amount}点血量，消耗{cost}资源',
            state['distance'], 1
        )

        return {
            'code': 0,
            'message': f'修复成功！{carriage["name"]}恢复{amount}点血量',
            'data': {'cost': cost}
        }

    def get_recent_events(self, limit: int = 20) -> Dict[str, Any]:
        state = self.game_state_model.get_current_state()
        if not state:
            return {'code': 1, 'message': '游戏未启动', 'data': None}

        events = self.event_log_model.get_recent_events(state['id'], limit)
        return {
            'code': 0,
            'message': 'success',
            'data': events
        }

    def _damage_random_carriage(self, game_state_id: int, damage: int):
        carriages = self.carriage_model.get_by_game_state(game_state_id)
        active_carriages = [c for c in carriages if c['hp'] > 0]
        if active_carriages:
            target = random.choice(active_carriages)
            self.carriage_model.damage_carriage(target['id'], damage)

    def _game_over(self, game_state_id: int, reason: str):
        self.game_state_model.update_state(game_state_id, {'is_running': 0})
        self.event_log_model.log_event(game_state_id, 'system', reason, 0, 1)

    def _assemble_game_data(self, game_state_id: int) -> Dict[str, Any]:
        state = self.game_state_model.get_by_id(game_state_id)
        if not state:
            return {}

        carriages = self.carriage_model.get_by_game_state(game_state_id)
        current_event_data = None
        if state.get('current_event') and state.get('event_data'):
            try:
                current_event_data = json.loads(state['event_data'])
            except:
                current_event_data = None

        return {
            'game_state': state,
            'carriages': carriages,
            'current_event': state.get('current_event'),
            'current_event_data': current_event_data,
        }
