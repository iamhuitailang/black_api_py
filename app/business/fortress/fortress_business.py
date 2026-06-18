from typing import Dict, Any, List, Optional
import random
from app.model.fortress import GameStateModel, BuildingModel, EnemyWaveModel, GameLogModel

BUILDING_CONFIG = {
    'sandbag_wall': {
        'name': '沙袋墙',
        'description': '延缓敌人推进速度',
        'cost_work_hours': 20,
        'cost_water': 5,
        'hp': 150,
        'build_time': 2,
        'color': '#c4a35a'
    },
    'arrow_tower': {
        'name': '箭塔',
        'description': '远程攻击敌人，消耗箭矢',
        'cost_work_hours': 40,
        'cost_water': 10,
        'hp': 100,
        'build_time': 3,
        'damage': 15,
        'range': 3,
        'color': '#8b4513'
    },
    'oil_trough': {
        'name': '滚油槽',
        'description': '范围伤害，消耗油料',
        'cost_work_hours': 50,
        'cost_water': 5,
        'cost_oil': 0,
        'hp': 80,
        'build_time': 4,
        'damage': 40,
        'range': 2,
        'color': '#2f1810'
    },
    'seismic_drum': {
        'name': '震地鼓',
        'description': '预警沙虫出现位置',
        'cost_work_hours': 30,
        'cost_water': 5,
        'hp': 60,
        'build_time': 2,
        'range': 5,
        'color': '#654321'
    },
    'oasis_well': {
        'name': '绿洲水井',
        'description': '白天收集水源',
        'cost_work_hours': 25,
        'hp': 80,
        'build_time': 3,
        'water_per_day': 15,
        'color': '#4a90a4'
    }
}

ENEMY_CONFIG = {
    'bandit': {
        'name': '流寇',
        'hp': 50,
        'damage': 10,
        'speed': 1,
        'reward_arrows': 2,
        'reward_oil': 1
    },
    'sandworm': {
        'name': '沙虫',
        'hp': 120,
        'damage': 25,
        'speed': 0.8,
        'underground': True,
        'reward_arrows': 5,
        'reward_oil': 3
    },
    'raider': {
        'name': '攻城锤',
        'hp': 200,
        'damage': 40,
        'speed': 0.5,
        'reward_arrows': 8,
        'reward_oil': 5
    }
}


class FortressBusiness:
    def __init__(self):
        self.game_state_model = GameStateModel()
        self.building_model = BuildingModel()
        self.enemy_wave_model = EnemyWaveModel()
        self.game_log_model = GameLogModel()

    def _add_log(self, game_state_id: int, day: int, log_type: str, message: str):
        self.game_log_model.create(game_state_id, day, log_type, message)

    def new_game(self) -> Dict[str, Any]:
        state_id = self.game_state_model.create_initial()
        state = self.game_state_model.get_by_id(state_id)
        
        self._add_log(state_id, 1, 'info', '新的征程开始了。你是这座孤城最后的守将。')
        self._add_log(state_id, 1, 'info', '白天修建防御工事，收集绿洲水源。')
        self._add_log(state_id, 1, 'warning', '夜幕降临时，敌人将会来袭...')
        
        return {
            'code': 0,
            'message': 'success',
            'data': self._get_full_game_state(state_id)
        }

    def get_game_state(self, state_id: Optional[int] = None) -> Dict[str, Any]:
        if state_id:
            state = self.game_state_model.get_by_id(state_id)
        else:
            state = self.game_state_model.get_latest()
        
        if not state:
            return {
                'code': 1,
                'message': 'No game state found',
                'data': None
            }
        
        return {
            'code': 0,
            'message': 'success',
            'data': self._get_full_game_state(state['id'])
        }

    def _get_full_game_state(self, state_id: int) -> Dict[str, Any]:
        state = self.game_state_model.get_by_id(state_id)
        buildings = self.building_model.get_by_game_state(state_id)
        wave = self.enemy_wave_model.get_active_wave(state_id)
        logs = self.game_log_model.get_recent(state_id, 20)
        
        return {
            'state': state,
            'buildings': buildings,
            'active_wave': wave,
            'logs': logs,
            'building_config': BUILDING_CONFIG
        }

    def build_structure(self, state_id: int, building_type: str, 
                        position_x: int, position_y: int) -> Dict[str, Any]:
        state = self.game_state_model.get_by_id(state_id)
        if not state:
            return {'code': 1, 'message': 'Game state not found', 'data': None}
        
        if state['is_game_over']:
            return {'code': 1, 'message': '游戏已结束', 'data': None}
        
        if state['phase'] != 'day':
            return {'code': 1, 'message': '只能在白天建造', 'data': None}
        
        config = BUILDING_CONFIG.get(building_type)
        if not config:
            return {'code': 1, 'message': '未知建筑类型', 'data': None}
        
        if state['work_hours'] < config['cost_work_hours']:
            return {'code': 1, 'message': '工时不足', 'data': None}
        
        if state['water'] < config.get('cost_water', 0):
            return {'code': 1, 'message': '水源不足', 'data': None}
        
        buildings = self.building_model.get_by_game_state(state_id)
        for b in buildings:
            if b['position_x'] == position_x and b['position_y'] == position_y:
                return {'code': 1, 'message': '该位置已有建筑', 'data': None}
        
        new_work_hours = state['work_hours'] - config['cost_work_hours']
        new_water = state['water'] - config.get('cost_water', 0)
        
        self.game_state_model.update(state_id, {
            'work_hours': new_work_hours,
            'water': new_water
        })
        
        building_id = self.building_model.create(
            state_id, building_type, position_x, position_y,
            hp=config['hp'],
            build_time=config['build_time']
        )
        
        self._add_log(state_id, state['day'], 'build', 
                     f'开始建造{config["name"]}，位于({position_x}, {position_y})')
        
        return {
            'code': 0,
            'message': '建造开始',
            'data': {
                'building_id': building_id,
                'work_hours': new_work_hours,
                'water': new_water
            }
        }

    def advance_time(self, state_id: int, delta: float = 0.1) -> Dict[str, Any]:
        state = self.game_state_model.get_by_id(state_id)
        if not state:
            return {'code': 1, 'message': 'Game state not found', 'data': None}
        
        if state['is_game_over']:
            return {'code': 1, 'message': '游戏已结束', 'data': None}
        
        new_time = state['time_of_day'] + delta
        current_phase = state['phase']
        new_phase = current_phase
        
        if current_phase == 'day' and new_time >= 1.0:
            new_phase = 'night'
            new_time = 0.0
            self._start_night(state_id, state['day'])
        elif current_phase == 'night' and new_time >= 1.0:
            new_phase = 'day'
            new_time = 0.0
            new_day = state['day'] + 1
            self._start_day(state_id, new_day, state['next_siege_day'])
            state['day'] = new_day
        
        buildings = self.building_model.get_by_game_state(state_id)
        for building in buildings:
            if building['is_building']:
                new_progress = building['build_progress'] + delta
                if new_progress >= building['build_time']:
                    self.building_model.update(building['id'], {
                        'is_building': 0,
                        'build_progress': building['build_time']
                    })
                    config = BUILDING_CONFIG[building['building_type']]
                    self._add_log(state_id, state['day'], 'build', 
                                 f'{config["name"]}建造完成！')
                else:
                    self.building_model.update(building['id'], {
                        'build_progress': new_progress
                    })
        
        if new_phase == 'night':
            self._process_combat(state_id, delta)
        
        self.game_state_model.update(state_id, {
            'time_of_day': new_time,
            'phase': new_phase
        })
        
        return {
            'code': 0,
            'message': 'success',
            'data': self._get_full_game_state(state_id)
        }

    def _start_day(self, state_id: int, new_day: int, next_siege_day: int):
        state = self.game_state_model.get_by_id(state_id)
        
        buildings = self.building_model.get_by_game_state(state_id)
        water_gain = 10
        for building in buildings:
            if building['building_type'] == 'oasis_well' and not building['is_building']:
                water_gain += BUILDING_CONFIG['oasis_well']['water_per_day']
        
        new_water = min(state['water'] + water_gain, 200)
        new_work_hours = state['max_work_hours']
        
        is_siege_day = 0
        new_next_siege = next_siege_day
        if new_day >= next_siege_day:
            is_siege_day = 1
            new_next_siege = new_day + 7
            self._add_log(state_id, new_day, 'warning', '⚠️ 今日是攻城日！大规模敌军将在夜间来袭！')
        
        self.game_state_model.update(state_id, {
            'day': new_day,
            'water': new_water,
            'work_hours': new_work_hours,
            'is_siege_day': is_siege_day,
            'next_siege_day': new_next_siege
        })
        
        self._add_log(state_id, new_day, 'info', f'☀️ 第 {new_day} 天开始了')
        self._add_log(state_id, new_day, 'resource', f'收集了 {water_gain} 单位水源')

    def _start_night(self, state_id: int, day: int):
        state = self.game_state_model.get_by_id(state_id)
        
        is_siege = state['is_siege_day'] == 1
        
        if is_siege:
            total_enemies = 10 + day * 3
            wave_num = day // 7 + 1
        else:
            total_enemies = 3 + day // 2
            wave_num = day
        
        self.enemy_wave_model.create(
            state_id, wave_num, total_enemies, is_siege)
        
        self._add_log(state_id, day, 'warning', 
                     f'🌙 夜幕降临，敌人开始进攻！共 {total_enemies} 名敌人')
        if is_siege:
            self._add_log(state_id, day, 'danger', '⚔️ 大规模攻城开始！')

    def _process_combat(self, state_id: int, delta: float):
        state = self.game_state_model.get_by_id(state_id)
        wave = self.enemy_wave_model.get_active_wave(state_id)
        if not wave:
            return
        
        buildings = self.building_model.get_by_game_state(state_id)
        
        arrow_towers = [b for b in buildings if b['building_type'] == 'arrow_tower' and not b['is_building']]
        oil_troughs = [b for b in buildings if b['building_type'] == 'oil_trough' and not b['is_building']]
        walls = [b for b in buildings if b['building_type'] == 'sandbag_wall' and not b['is_building']]
        
        total_damage = 0
        
        if arrow_towers and state['arrows'] > 0:
            arrow_damage = len(arrow_towers) * BUILDING_CONFIG['arrow_tower']['damage'] * delta * 2
            arrows_used = min(int(len(arrow_towers) * delta * 0.5), state['arrows'])
            if arrows_used > 0:
                total_damage += arrow_damage
                self.game_state_model.update(state_id, {'arrows': state['arrows'] - arrows_used})
        
        if oil_troughs and state['oil'] > 0:
            oil_damage = len(oil_troughs) * BUILDING_CONFIG['oil_trough']['damage'] * delta
            oil_used = min(int(len(oil_troughs) * delta * 0.3), state['oil'])
            if oil_used > 0:
                total_damage += oil_damage
                self.game_state_model.update(state_id, {'oil': state['oil'] - oil_used})
        
        remaining = wave['enemies_remaining']
        damage_to_enemies = total_damage
        
        if walls:
            damage_to_enemies *= 0.7
            wall_damage = total_damage * 0.3 / len(walls)
            for wall in walls:
                new_wall_hp = wall['hp'] - wall_damage
                if new_wall_hp <= 0:
                    self.building_model.delete(wall['id'])
                    self._add_log(state_id, state['day'], 'damage', '沙袋墙被摧毁了！')
                else:
                    self.building_model.update(wall['id'], {'hp': new_wall_hp})
        
        enemies_killed = min(int(damage_to_enemies / 30), remaining)
        new_remaining = remaining - enemies_killed
        
        if new_remaining <= 0:
            self.enemy_wave_model.update(wave['id'], {
                'enemies_remaining': 0,
                'is_active': 0
            })
            
            reward_arrows = wave['total_enemies'] * 2
            reward_oil = wave['total_enemies'] // 2
            state = self.game_state_model.get_by_id(state_id)
            self.game_state_model.update(state_id, {
                'arrows': state['arrows'] + reward_arrows,
                'oil': state['oil'] + reward_oil
            })
            
            self._add_log(state_id, state['day'], 'victory', 
                         f'🎉 击退了敌军！获得 {reward_arrows} 箭矢，{reward_oil} 油料')
        else:
            enemy_damage = wave['enemies_remaining'] * ENEMY_CONFIG['bandit']['damage'] * delta * 0.5
            
            if walls:
                enemy_damage *= 0.5
            
            new_fortress_hp = state['fortress_hp'] - enemy_damage
            
            if new_fortress_hp <= 0:
                self.game_state_model.update(state_id, {
                    'fortress_hp': 0,
                    'is_game_over': 1
                })
                self._add_log(state_id, state['day'], 'danger', '💀 要塞陷落了...')
            else:
                self.game_state_model.update(state_id, {'fortress_hp': new_fortress_hp})
            
            self.enemy_wave_model.update(wave['id'], {
                'enemies_remaining': new_remaining
            })

    def collect_resources(self, state_id: int, resource_type: str, amount: int) -> Dict[str, Any]:
        state = self.game_state_model.get_by_id(state_id)
        if not state:
            return {'code': 1, 'message': 'Game state not found', 'data': None}
        
        if state['phase'] != 'day':
            return {'code': 1, 'message': '只能在白天收集资源', 'data': None}
        
        work_cost = amount * 2
        if state['work_hours'] < work_cost:
            return {'code': 1, 'message': '工时不足', 'data': None}
        
        if resource_type == 'arrows':
            new_arrows = state['arrows'] + amount
            self.game_state_model.update(state_id, {
                'arrows': new_arrows,
                'work_hours': state['work_hours'] - work_cost
            })
            self._add_log(state_id, state['day'], 'craft', f'制作了 {amount} 支箭矢')
        elif resource_type == 'oil':
            new_oil = state['oil'] + amount
            self.game_state_model.update(state_id, {
                'oil': new_oil,
                'work_hours': state['work_hours'] - work_cost
            })
            self._add_log(state_id, state['day'], 'craft', f'炼制了 {amount} 单位油料')
        else:
            return {'code': 1, 'message': '未知资源类型', 'data': None}
        
        return {
            'code': 0,
            'message': 'success',
            'data': self._get_full_game_state(state_id)
        }

    def get_save_list(self) -> Dict[str, Any]:
        all_states = []
        latest = self.game_state_model.get_latest()
        if latest:
            all_states.append(latest)
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'saves': all_states
            }
        }

    def delete_save(self, state_id: int) -> Dict[str, Any]:
        state = self.game_state_model.get_by_id(state_id)
        if not state:
            return {'code': 1, 'message': 'Save not found', 'data': None}
        
        self.building_model.delete_by_game_state(state_id)
        self.game_log_model.delete_by_game_state(state_id)
        
        return {
            'code': 0,
            'message': '删除成功',
            'data': None
        }

    def get_worm_positions(self, state_id: int) -> Dict[str, Any]:
        state = self.game_state_model.get_by_id(state_id)
        if not state:
            return {'code': 1, 'message': 'Game state not found', 'data': None}
        
        buildings = self.building_model.get_by_game_state(state_id)
        drums = [b for b in buildings if b['building_type'] == 'seismic_drum' and not b['is_building']]
        
        worm_positions = []
        
        if state['phase'] == 'night' and len(drums) > 0:
            wave = self.enemy_wave_model.get_active_wave(state_id)
            if wave and wave['enemies_remaining'] > 3:
                num_worms = min(3, len(drums))
                for i in range(num_worms):
                    worm_positions.append({
                        'x': random.randint(1, 8),
                        'y': random.randint(0, 2),
                        'type': 'sandworm',
                        'detected': True
                    })
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'worm_positions': worm_positions,
                'has_drum': len(drums) > 0
            }
        }
