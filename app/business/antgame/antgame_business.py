import random
import math
from typing import Dict, Any, List, Optional, Tuple
from app.model.antgame import GameSaveModel, AntModel, NestCellModel


GRID_WIDTH = 20
GRID_HEIGHT = 15
CELL_SIZE = 40

SEASON_DURATION = 10
SEASONS = ['spring', 'summer', 'autumn', 'winter']

ANT_TYPES = {
    'queen': {'speed': 0.3, 'health': 200, 'food_consume': 2},
    'worker': {'speed': 1.0, 'health': 50, 'food_consume': 1},
    'soldier': {'speed': 0.8, 'health': 100, 'food_consume': 2},
    'scout': {'speed': 1.5, 'health': 40, 'food_consume': 1},
}

CELL_TYPES = ['dirt', 'tunnel', 'chamber', 'farm', 'storage', 'queen_chamber']


class AntGameBusiness:
    def __init__(self):
        self.save_model = GameSaveModel()
        self.ant_model = AntModel()
        self.cell_model = NestCellModel()

    def create_new_game(self, save_name: str = "新存档") -> Dict[str, Any]:
        save_id = self.save_model.create(save_name)
        
        self._init_nest(save_id)
        self._init_ants(save_id)
        
        return self.get_game_state(save_id)

    def _init_nest(self, save_id: int):
        cells = []
        surface_y = 2
        
        for x in range(GRID_WIDTH):
            for y in range(GRID_HEIGHT):
                cell_type = 'dirt'
                has_queen = 0
                
                if y < surface_y:
                    cell_type = 'surface'
                elif y == surface_y and 8 <= x <= 12:
                    cell_type = 'tunnel'
                elif y == surface_y + 1 and 9 <= x <= 11:
                    cell_type = 'tunnel'
                elif y == surface_y + 2 and x == 10:
                    cell_type = 'tunnel'
                elif y == surface_y + 3 and 9 <= x <= 11:
                    cell_type = 'chamber'
                    if x == 10:
                        has_queen = 1
                elif y == surface_y + 4 and 9 <= x <= 11:
                    cell_type = 'chamber'
                
                cells.append({
                    'save_id': save_id,
                    'grid_x': x,
                    'grid_y': y,
                    'cell_type': cell_type,
                    'food': 0,
                    'dirt': 0,
                    'has_queen': has_queen,
                })
        
        self.cell_model.create_many(cells)

    def _init_ants(self, save_id: int):
        surface_y = 2
        start_x = 10 * CELL_SIZE + CELL_SIZE // 2
        start_y = (surface_y + 3) * CELL_SIZE + CELL_SIZE // 2
        
        ants = [
            {
                'save_id': save_id,
                'ant_type': 'queen',
                'x': start_x,
                'y': start_y,
                'state': 'idle',
                'health': 200,
                'speed': 0.3,
            }
        ]
        
        for i in range(3):
            offset_x = (i - 1) * 15
            ants.append({
                'save_id': save_id,
                'ant_type': 'worker',
                'x': start_x + offset_x,
                'y': start_y + 10,
                'state': 'idle',
                'health': 50,
                'speed': 1.0,
            })
        
        self.ant_model.create_many(ants)

    def get_game_state(self, save_id: int) -> Dict[str, Any]:
        save = self.save_model.get_by_id(save_id)
        if not save:
            return {'code': 1, 'message': '存档不存在', 'data': None}
        
        ants = self.ant_model.get_by_save_id(save_id)
        cells = self.cell_model.get_by_save_id(save_id)
        
        ant_counts = {}
        for ant in ants:
            ant_type = ant['ant_type']
            ant_counts[ant_type] = ant_counts.get(ant_type, 0) + 1
        
        cell_counts = {}
        for cell in cells:
            ct = cell['cell_type']
            cell_counts[ct] = cell_counts.get(ct, 0) + 1
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'save': save,
                'ants': ants,
                'cells': cells,
                'ant_counts': ant_counts,
                'cell_counts': cell_counts,
                'grid_width': GRID_WIDTH,
                'grid_height': GRID_HEIGHT,
                'cell_size': CELL_SIZE,
            }
        }

    def get_save_list(self) -> Dict[str, Any]:
        saves = self.save_model.get_all()
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'saves': saves
            }
        }

    def tick(self, save_id: int) -> Dict[str, Any]:
        save = self.save_model.get_by_id(save_id)
        if not save:
            return {'code': 1, 'message': '存档不存在', 'data': None}
        
        if save['is_paused']:
            return self.get_game_state(save_id)
        
        self._process_ants(save_id)
        self._process_daily(save_id)
        
        return self.get_game_state(save_id)

    def _process_ants(self, save_id: int):
        ants = self.ant_model.get_by_save_id(save_id)
        cells = self.cell_model.get_by_save_id(save_id)
        
        cell_map = {}
        for cell in cells:
            key = (cell['grid_x'], cell['grid_y'])
            cell_map[key] = cell
        
        for ant in ants:
            self._update_ant_ai(ant, cell_map)

    def _update_ant_ai(self, ant: Dict[str, Any], cell_map: Dict[Tuple[int, int], Dict[str, Any]]):
        ant_type = ant['ant_type']
        state = ant['state']
        speed = ant['speed'] * 2
        
        if state == 'idle':
            self._ant_idle_behavior(ant, cell_map)
        elif state in ['moving', 'digging', 'carrying', 'returning', 'exploring']:
            self._ant_move(ant, speed)
        
        self.ant_model.update(ant['id'], {
            'x': ant['x'],
            'y': ant['y'],
            'state': ant['state'],
            'target_x': ant.get('target_x'),
            'target_y': ant.get('target_y'),
            'carrying': ant.get('carrying'),
            'carrying_amount': ant.get('carrying_amount', 0),
        })

    def _ant_idle_behavior(self, ant: Dict[str, Any], cell_map: Dict[Tuple[int, int], Dict[str, Any]]):
        ant_type = ant['ant_type']
        
        if ant_type == 'queen':
            return
        
        current_grid_x = int(ant['x'] // CELL_SIZE)
        current_grid_y = int(ant['y'] // CELL_SIZE)
        
        if ant_type == 'worker':
            self._worker_behavior(ant, cell_map, current_grid_x, current_grid_y)
        elif ant_type == 'soldier':
            self._soldier_behavior(ant, cell_map, current_grid_x, current_grid_y)
        elif ant_type == 'scout':
            self._scout_behavior(ant, cell_map, current_grid_x, current_grid_y)

    def _worker_behavior(self, ant: Dict[str, Any], cell_map: Dict[Tuple[int, int], Dict[str, Any]], 
                         gx: int, gy: int):
        if ant.get('carrying') == 'dirt' and ant.get('carrying_amount', 0) > 0:
            surface_y = 2
            target_x = gx * CELL_SIZE + CELL_SIZE // 2
            target_y = (surface_y - 1) * CELL_SIZE + CELL_SIZE // 2
            ant['target_x'] = target_x
            ant['target_y'] = target_y
            ant['state'] = 'returning'
            return
        
        if ant.get('carrying') == 'food' and ant.get('carrying_amount', 0) > 0:
            storage_cell = self._find_nearest_cell(cell_map, gx, gy, ['storage', 'chamber'])
            if storage_cell:
                ant['target_x'] = storage_cell['grid_x'] * CELL_SIZE + CELL_SIZE // 2
                ant['target_y'] = storage_cell['grid_y'] * CELL_SIZE + CELL_SIZE // 2
                ant['state'] = 'returning'
            return
        
        dig_target = self._find_dig_target(cell_map, gx, gy)
        if dig_target:
            ant['target_x'] = dig_target[0] * CELL_SIZE + CELL_SIZE // 2
            ant['target_y'] = dig_target[1] * CELL_SIZE + CELL_SIZE // 2
            ant['state'] = 'moving'
            return
        
        wander_target = self._find_wander_target(cell_map, gx, gy)
        if wander_target:
            ant['target_x'] = wander_target[0] * CELL_SIZE + CELL_SIZE // 2
            ant['target_y'] = wander_target[1] * CELL_SIZE + CELL_SIZE // 2
            ant['state'] = 'moving'

    def _soldier_behavior(self, ant: Dict[str, Any], cell_map: Dict[Tuple[int, int], Dict[str, Any]],
                          gx: int, gy: int):
        surface_y = 2
        if gy > surface_y + 1:
            ant['target_x'] = 10 * CELL_SIZE + CELL_SIZE // 2
            ant['target_y'] = surface_y * CELL_SIZE + CELL_SIZE // 2
            ant['state'] = 'moving'
        else:
            wander_target = self._find_wander_target(cell_map, gx, gy, max_dist=2)
            if wander_target:
                ant['target_x'] = wander_target[0] * CELL_SIZE + CELL_SIZE // 2
                ant['target_y'] = wander_target[1] * CELL_SIZE + CELL_SIZE // 2
                ant['state'] = 'moving'

    def _scout_behavior(self, ant: Dict[str, Any], cell_map: Dict[Tuple[int, int], Dict[str, Any]],
                        gx: int, gy: int):
        surface_y = 2
        if gy > surface_y:
            ant['target_x'] = random.randint(2, GRID_WIDTH - 3) * CELL_SIZE + CELL_SIZE // 2
            ant['target_y'] = (surface_y - 1) * CELL_SIZE + CELL_SIZE // 2
            ant['state'] = 'exploring'
        else:
            if random.random() < 0.3:
                ant['target_x'] = random.randint(0, GRID_WIDTH - 1) * CELL_SIZE + CELL_SIZE // 2
                ant['target_y'] = random.randint(0, surface_y) * CELL_SIZE + CELL_SIZE // 2
                ant['state'] = 'exploring'
            else:
                wander_target = self._find_wander_target(cell_map, gx, gy, max_dist=3)
                if wander_target:
                    ant['target_x'] = wander_target[0] * CELL_SIZE + CELL_SIZE // 2
                    ant['target_y'] = wander_target[1] * CELL_SIZE + CELL_SIZE // 2
                    ant['state'] = 'moving'

    def _ant_move(self, ant: Dict[str, Any], speed: float):
        target_x = ant.get('target_x')
        target_y = ant.get('target_y')
        
        if target_x is None or target_y is None:
            ant['state'] = 'idle'
            return
        
        dx = target_x - ant['x']
        dy = target_y - ant['y']
        dist = math.sqrt(dx * dx + dy * dy)
        
        if dist < speed:
            ant['x'] = target_x
            ant['y'] = target_y
            self._on_ant_reach_target(ant)
        else:
            ant['x'] += (dx / dist) * speed
            ant['y'] += (dy / dist) * speed

    def _on_ant_reach_target(self, ant: Dict[str, Any]):
        state = ant['state']
        ant_type = ant['ant_type']
        
        if state == 'moving':
            gx = int(ant['x'] // CELL_SIZE)
            gy = int(ant['y'] // CELL_SIZE)
            
            cell = self.cell_model.get_by_position(ant['save_id'], gx, gy)
            
            if cell and cell['cell_type'] == 'dirt' and ant_type == 'worker':
                self._dig_cell(ant, cell)
            else:
                ant['state'] = 'idle'
        
        elif state == 'returning':
            if ant.get('carrying') == 'dirt':
                ant['carrying'] = None
                ant['carrying_amount'] = 0
            elif ant.get('carrying') == 'food':
                ant['carrying'] = None
                ant['carrying_amount'] = 0
            ant['state'] = 'idle'
        
        elif state == 'exploring':
            if random.random() < 0.4 and ant['y'] < 2 * CELL_SIZE:
                ant['carrying'] = 'food'
                ant['carrying_amount'] = random.randint(3, 8)
            ant['state'] = 'idle'
        
        else:
            ant['state'] = 'idle'

    def _dig_cell(self, ant: Dict[str, Any], cell: Dict[str, Any]):
        ant['state'] = 'digging'
        
        new_type = 'tunnel'
        gy = cell['grid_y']
        if gy > 5:
            new_type = 'chamber'
        
        self.cell_model.update(cell['id'], {
            'cell_type': new_type,
            'dirt': cell.get('dirt', 0) + 5,
        })
        
        ant['carrying'] = 'dirt'
        ant['carrying_amount'] = 5
        
        save = self.save_model.get_by_id(ant['save_id'])
        if save:
            self.save_model.update(ant['save_id'], {
                'dirt': save['dirt'] + 5
            })

    def _find_dig_target(self, cell_map: Dict[Tuple[int, int], Dict[str, Any]], 
                         gx: int, gy: int) -> Optional[Tuple[int, int]]:
        candidates = []
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nx, ny = gx + dx, gy + dy
            if 0 <= nx < GRID_WIDTH and 0 <= ny < GRID_HEIGHT:
                cell = cell_map.get((nx, ny))
                if cell and cell['cell_type'] == 'dirt':
                    has_empty_neighbor = False
                    for ddx, ddy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                        nnx, nny = nx + ddx, ny + ddy
                        neighbor = cell_map.get((nnx, nny))
                        if neighbor and neighbor['cell_type'] in ['tunnel', 'chamber', 'surface']:
                            has_empty_neighbor = True
                            break
                    if has_empty_neighbor:
                        candidates.append((nx, ny))
        
        if candidates:
            return random.choice(candidates)
        return None

    def _find_wander_target(self, cell_map: Dict[Tuple[int, int], Dict[str, Any]],
                            gx: int, gy: int, max_dist: int = 3) -> Optional[Tuple[int, int]]:
        candidates = []
        for dx in range(-max_dist, max_dist + 1):
            for dy in range(-max_dist, max_dist + 1):
                if dx == 0 and dy == 0:
                    continue
                nx, ny = gx + dx, gy + dy
                if 0 <= nx < GRID_WIDTH and 0 <= ny < GRID_HEIGHT:
                    cell = cell_map.get((nx, ny))
                    if cell and cell['cell_type'] in ['tunnel', 'chamber', 'surface', 'farm', 'storage']:
                        candidates.append((nx, ny))
        
        if candidates:
            return random.choice(candidates)
        return None

    def _find_nearest_cell(self, cell_map: Dict[Tuple[int, int], Dict[str, Any]],
                           gx: int, gy: int, cell_types: List[str]) -> Optional[Dict[str, Any]]:
        nearest = None
        nearest_dist = float('inf')
        
        for (cx, cy), cell in cell_map.items():
            if cell['cell_type'] in cell_types:
                dist = abs(cx - gx) + abs(cy - gy)
                if dist < nearest_dist:
                    nearest_dist = dist
                    nearest = cell
        
        return nearest

    def _process_daily(self, save_id: int):
        save = self.save_model.get_by_id(save_id)
        if not save:
            return
        
        day = save['day'] + 1
        season_day = save['season_day'] + 1
        season = save['season']
        food = save['food']
        enemy_threat = save['enemy_threat']
        
        if season_day > SEASON_DURATION:
            season_day = 1
            current_idx = SEASONS.index(season)
            season = SEASONS[(current_idx + 1) % len(SEASONS)]
        
        ant_count = self.ant_model.count_by_save(save_id)
        ants = self.ant_model.get_by_save_id(save_id)
        
        total_food_consume = 0
        for ant in ants:
            ant_type = ant['ant_type']
            consume = ANT_TYPES.get(ant_type, {}).get('food_consume', 1)
            total_food_consume += consume
        
        food_production = 0
        if season == 'spring':
            food_production = 5
        elif season == 'summer':
            food_production = 8
        elif season == 'autumn':
            food_production = 6
        elif season == 'winter':
            food_production = 1
        
        farm_count = self.cell_model.count_by_type(save_id, 'farm')
        food_production += farm_count * 3
        
        food = food - total_food_consume + food_production
        if food < 0:
            food = 0
        
        if food == 0:
            enemy_threat += 2
        
        if season == 'winter':
            enemy_threat += 1
        elif season == 'spring':
            enemy_threat += 0.5
        
        enemy_threat = max(0, min(100, enemy_threat))
        
        if enemy_threat >= 80 and random.random() < 0.3:
            self._enemy_attack(save_id)
            enemy_threat = max(0, enemy_threat - 20)
        
        queen_count = self.ant_model.count_by_type(save_id, 'queen')
        if queen_count > 0 and food > 30 and random.random() < 0.2:
            self._hatch_ant(save_id)
        
        self.save_model.update(save_id, {
            'day': day,
            'season': season,
            'season_day': season_day,
            'food': food,
            'enemy_threat': int(enemy_threat),
        })

    def _enemy_attack(self, save_id: int):
        soldiers = self.ant_model.get_by_type(save_id, 'soldier')
        workers = self.ant_model.get_by_type(save_id, 'worker')
        
        soldier_count = len(soldiers)
        worker_count = len(workers)
        
        enemy_strength = random.randint(5, 15)
        
        if soldier_count > 0:
            damage_per_soldier = enemy_strength / soldier_count
            for soldier in soldiers:
                new_health = soldier['health'] - damage_per_soldier
                if new_health <= 0:
                    self.ant_model.delete(soldier['id'])
                else:
                    self.ant_model.update(soldier['id'], {'health': int(new_health)})
        else:
            if worker_count > 0:
                workers_to_kill = min(worker_count, random.randint(1, 3))
                for i in range(workers_to_kill):
                    if i < len(workers):
                        self.ant_model.delete(workers[i]['id'])
    
    def _hatch_ant(self, save_id: int):
        save = self.save_model.get_by_id(save_id)
        if not save or save['food'] < 10:
            return
        
        queen_cells = self.cell_model.get_by_type(save_id, 'queen_chamber')
        if not queen_cells:
            queen_cells = self.cell_model.get_by_type(save_id, 'chamber')
        
        if not queen_cells:
            return
        
        hatch_cell = random.choice(queen_cells)
        x = hatch_cell['grid_x'] * CELL_SIZE + CELL_SIZE // 2 + random.uniform(-10, 10)
        y = hatch_cell['grid_y'] * CELL_SIZE + CELL_SIZE // 2 + random.uniform(-10, 10)
        
        ant_types = ['worker', 'worker', 'worker', 'scout']
        if self.ant_model.count_by_type(save_id, 'soldier') < 2:
            ant_types.append('soldier')
        
        ant_type = random.choice(ant_types)
        self.ant_model.create(save_id, ant_type, x, y)
        
        self.save_model.update(save_id, {'food': save['food'] - 10})

    def dig_tunnel(self, save_id: int, grid_x: int, grid_y: int) -> Dict[str, Any]:
        save = self.save_model.get_by_id(save_id)
        if not save:
            return {'code': 1, 'message': '存档不存在', 'data': None}
        
        cell = self.cell_model.get_by_position(save_id, grid_x, grid_y)
        if not cell:
            return {'code': 1, 'message': '位置无效', 'data': None}
        
        if cell['cell_type'] != 'dirt':
            return {'code': 1, 'message': '该位置已经是通道', 'data': None}
        
        has_adjacent_tunnel = False
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            neighbor = self.cell_model.get_by_position(save_id, grid_x + dx, grid_y + dy)
            if neighbor and neighbor['cell_type'] in ['tunnel', 'chamber', 'surface', 'farm', 'storage']:
                has_adjacent_tunnel = True
                break
        
        if not has_adjacent_tunnel:
            return {'code': 1, 'message': '必须从现有通道旁边开始挖掘', 'data': None}
        
        if save['dirt'] < 3:
            return {'code': 1, 'message': '泥土不足', 'data': None}
        
        new_type = 'tunnel' if grid_y <= 5 else 'chamber'
        
        self.cell_model.update(cell['id'], {'cell_type': new_type})
        self.save_model.update(save_id, {'dirt': save['dirt'] - 3})
        
        return self.get_game_state(save_id)

    def build_room(self, save_id: int, grid_x: int, grid_y: int, room_type: str) -> Dict[str, Any]:
        save = self.save_model.get_by_id(save_id)
        if not save:
            return {'code': 1, 'message': '存档不存在', 'data': None}
        
        valid_types = ['chamber', 'farm', 'storage', 'queen_chamber']
        if room_type not in valid_types:
            return {'code': 1, 'message': '无效的房间类型', 'data': None}
        
        cell = self.cell_model.get_by_position(save_id, grid_x, grid_y)
        if not cell:
            return {'code': 1, 'message': '位置无效', 'data': None}
        
        if cell['cell_type'] not in ['tunnel', 'chamber']:
            return {'code': 1, 'message': '只能在隧道或小室基础上建造', 'data': None}
        
        cost = {'chamber': 5, 'farm': 10, 'storage': 8, 'queen_chamber': 15}
        if save['dirt'] < cost[room_type]:
            return {'code': 1, 'message': f'需要{cost[room_type]}泥土', 'data': None}
        
        self.cell_model.update(cell['id'], {'cell_type': room_type})
        self.save_model.update(save_id, {'dirt': save['dirt'] - cost[room_type]})
        
        return self.get_game_state(save_id)

    def spawn_ant(self, save_id: int, ant_type: str) -> Dict[str, Any]:
        save = self.save_model.get_by_id(save_id)
        if not save:
            return {'code': 1, 'message': '存档不存在', 'data': None}
        
        if ant_type not in ANT_TYPES:
            return {'code': 1, 'message': '无效的蚂蚁类型', 'data': None}
        
        food_cost = {'worker': 15, 'soldier': 25, 'scout': 20, 'queen': 100}
        if save['food'] < food_cost[ant_type]:
            return {'code': 1, 'message': f'需要{food_cost[ant_type]}食物', 'data': None}
        
        queen_cells = self.cell_model.get_by_type(save_id, 'queen_chamber')
        if not queen_cells:
            chamber_cells = self.cell_model.get_by_type(save_id, 'chamber')
            if chamber_cells:
                spawn_cell = random.choice(chamber_cells)
            else:
                return {'code': 1, 'message': '需要蚁后室或小室来孵化蚂蚁', 'data': None}
        else:
            spawn_cell = random.choice(queen_cells)
        
        x = spawn_cell['grid_x'] * CELL_SIZE + CELL_SIZE // 2 + random.uniform(-10, 10)
        y = spawn_cell['grid_y'] * CELL_SIZE + CELL_SIZE // 2 + random.uniform(-10, 10)
        
        ant_info = ANT_TYPES[ant_type]
        self.ant_model.create(save_id, ant_type, x, y, speed=ant_info['speed'], health=ant_info['health'])
        
        self.save_model.update(save_id, {'food': save['food'] - food_cost[ant_type]})
        
        return self.get_game_state(save_id)

    def toggle_pause(self, save_id: int) -> Dict[str, Any]:
        save = self.save_model.get_by_id(save_id)
        if not save:
            return {'code': 1, 'message': '存档不存在', 'data': None}
        
        new_paused = 1 if save['is_paused'] == 0 else 0
        self.save_model.update(save_id, {'is_paused': new_paused})
        
        return self.get_game_state(save_id)

    def delete_save(self, save_id: int) -> Dict[str, Any]:
        self.ant_model.delete_by_save_id(save_id)
        self.cell_model.delete_by_save_id(save_id)
        self.save_model.delete(save_id)
        
        return {'code': 0, 'message': '删除成功', 'data': None}
