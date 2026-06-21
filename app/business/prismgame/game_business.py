import json
import math
from typing import Dict, Any, List, Optional, Tuple
from app.model.prismgame import SolutionModel, LevelModel, PrismModel


class GameBusiness:
    def __init__(self):
        self.solution_model = SolutionModel()
        self.level_model = LevelModel()
        self.prism_model = PrismModel()

    def calculate_score(self, is_success: bool, rotations_used: int, par_rotations: int,
                        light_intensity: float = 1.0) -> int:
        if not is_success:
            return 0

        base_score = 1000
        rotation_bonus = max(0, (par_rotations - rotations_used)) * 100
        intensity_bonus = int(light_intensity * 500)

        return base_score + rotation_bonus + intensity_bonus

    def save_solution(self, level_id: int, player_name: str, rotations_used: int,
                      is_success: bool, light_path: str = '',
                      prism_rotations: str = '', light_intensity: float = 1.0) -> Dict[str, Any]:
        level = self.level_model.get_by_id(level_id)
        if not level:
            return {
                'code': 1,
                'message': f'Level with id {level_id} not found',
                'data': None
            }

        score = self.calculate_score(is_success, rotations_used, level.get('par_rotations', 5), light_intensity)

        if is_success:
            existing = self.solution_model.get_best_by_level_and_player(level_id, player_name)
            if existing and existing['score'] >= score:
                return {
                    'code': 0,
                    'message': 'existing score is better',
                    'data': {
                        'id': existing['id'],
                        'score': existing['score'],
                        'is_new_best': False
                    }
                }

        data = {
            'level_id': level_id,
            'player_name': player_name,
            'rotations_used': rotations_used,
            'score': score,
            'light_path': light_path,
            'prism_rotations': prism_rotations,
            'is_success': 1 if is_success else 0
        }

        solution_id = self.solution_model.create(data)

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'id': solution_id,
                'score': score,
                'is_new_best': is_success
            }
        }

    def get_level_solutions(self, level_id: int, limit: int = 10) -> Dict[str, Any]:
        solutions = self.solution_model.get_by_level_id(level_id, limit)
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': solutions,
                'total': len(solutions)
            }
        }

    def get_solution_detail(self, solution_id: int) -> Dict[str, Any]:
        solution = self.solution_model.get_by_id(solution_id)
        if not solution:
            return {
                'code': 1,
                'message': f'Solution with id {solution_id} not found',
                'data': None
            }
        return {
            'code': 0,
            'message': 'success',
            'data': solution
        }

    def validate_light_path(self, level_id: int, prism_rotations: List[Dict[str, Any]]) -> Dict[str, Any]:
        level = self.level_model.get_by_id(level_id)
        if not level:
            return {
                'code': 1,
                'message': f'Level with id {level_id} not found',
                'data': None
            }

        prisms = self.prism_model.get_by_level_id(level_id)
        prism_map = {p['id']: p for p in prisms}

        for pr in prism_rotations:
            pid = pr.get('id')
            if pid in prism_map:
                prism_map[pid]['rotation'] = pr.get('rotation', prism_map[pid]['rotation'])

        result = self._simulate_light_path(level, list(prism_map.values()))

        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def _simulate_light_path(self, level: Dict[str, Any], prisms: List[Dict[str, Any]]) -> Dict[str, Any]:
        light_x = level['light_source_x']
        light_y = level['light_source_y']
        angle_rad = math.radians(level['light_source_angle'])
        dx = math.cos(angle_rad)
        dy = math.sin(angle_rad)

        path = [{'x': light_x, 'y': light_y}]
        intensity = 1.0
        colors = {'red': 1.0, 'green': 1.0, 'blue': 1.0}
        hit_target = False
        max_bounces = 20
        bounces = 0
        hit_prisms = set()

        canvas_width = 800
        canvas_height = 600

        current_x = light_x
        current_y = light_y
        current_dx = dx
        current_dy = dy

        while bounces < max_bounces and intensity > 0.05:
            nearest_hit = None
            nearest_dist = float('inf')

            for prism in prisms:
                if prism['id'] in hit_prisms:
                    continue

                hit = self._ray_prism_intersection(
                    current_x, current_y, current_dx, current_dy, prism
                )
                if hit and hit['distance'] < nearest_dist:
                    nearest_dist = hit['distance']
                    nearest_hit = {'prism': prism, **hit}

            target_hit = self._ray_circle_intersection(
                current_x, current_y, current_dx, current_dy,
                level['target_x'], level['target_y'], level['target_radius']
            )
            if target_hit and target_hit < nearest_dist:
                hit_target = True
                hit_x = current_x + current_dx * target_hit
                hit_y = current_y + current_dy * target_hit
                path.append({'x': hit_x, 'y': hit_y, 'type': 'target'})
                break

            if nearest_hit:
                hit_prisms.add(nearest_hit['prism']['id'])
                hit_x = current_x + current_dx * nearest_dist
                hit_y = current_y + current_dy * nearest_dist

                angle_diff = abs(math.degrees(nearest_hit['incident_angle']))
                if angle_diff > 15:
                    intensity *= 0.4

                color_filter = nearest_hit['prism'].get('color_filter', '')
                if color_filter:
                    for c in colors:
                        if c != color_filter:
                            colors[c] *= 0.2

                path.append({
                    'x': hit_x,
                    'y': hit_y,
                    'type': 'prism',
                    'prism_id': nearest_hit['prism']['id']
                })

                current_dx, current_dy = nearest_hit['reflected_dx'], nearest_hit['reflected_dy']
                current_x = hit_x
                current_y = hit_y
                bounces += 1
            else:
                end_x = current_x + current_dx * 1000
                end_y = current_y + current_dy * 1000
                if current_dx > 0:
                    t = (canvas_width - current_x) / current_dx if current_dx != 0 else float('inf')
                else:
                    t = (-current_x) / current_dx if current_dx != 0 else float('inf')
                end_x = min(max(end_x, 0), canvas_width)
                end_y = min(max(end_y, 0), canvas_height)
                path.append({'x': end_x, 'y': end_y, 'type': 'boundary'})
                break

        total_colors = sum(colors.values())
        color_balance = min(colors.values()) / max(colors.values()) if max(colors.values()) > 0 else 0

        return {
            'hit_target': hit_target,
            'intensity': round(intensity, 4),
            'colors': colors,
            'color_balance': round(color_balance, 4),
            'path': path,
            'bounces': bounces
        }

    def _ray_prism_intersection(self, rx: float, ry: float, dx: float, dy: float,
                                prism: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        cx = prism['x']
        cy = prism['y']
        size = prism['size']
        rotation_deg = prism['rotation']
        sides = prism['sides']

        rotation_rad = math.radians(rotation_deg)

        cos_rot = math.cos(-rotation_rad)
        sin_rot = math.sin(-rotation_rad)
        local_rx = (rx - cx) * cos_rot - (ry - cy) * sin_rot
        local_ry = (rx - cx) * sin_rot + (ry - cy) * cos_rot
        local_dx = dx * cos_rot - dy * sin_rot
        local_dy = dx * sin_rot + dy * cos_rot

        vertices = []
        for i in range(sides):
            angle = 2 * math.pi * i / sides - math.pi / 2
            vx = size * math.cos(angle)
            vy = size * math.sin(angle)
            vertices.append((vx, vy))

        nearest_t = float('inf')
        nearest_normal = None
        nearest_edge = None

        for i in range(sides):
            v1 = vertices[i]
            v2 = vertices[(i + 1) % sides]

            ex = v2[0] - v1[0]
            ey = v2[1] - v1[1]

            denom = local_dx * ey - local_dy * ex
            if abs(denom) < 0.0001:
                continue

            t = ((v1[0] - local_rx) * ey - (v1[1] - local_ry) * ex) / denom
            u = ((v1[0] - local_rx) * local_dy - (v1[1] - local_ry) * local_dx) / denom

            if t > 0.01 and 0 <= u <= 1:
                if t < nearest_t:
                    nearest_t = t
                    normal_len = math.sqrt(ex * ex + ey * ey)
                    nx = ey / normal_len
                    ny = -ex / normal_len

                    mid_x = (v1[0] + v2[0]) / 2
                    mid_y = (v1[1] + v2[1]) / 2
                    to_center_dot = nx * (-mid_x) + ny * (-mid_y)
                    if to_center_dot < 0:
                        nx = -nx
                        ny = -ny

                    nearest_normal = (nx, ny)
                    nearest_edge = i

        if nearest_t == float('inf'):
            return None

        cos_inc = -(local_dx * nearest_normal[0] + local_dy * nearest_normal[1])
        incident_angle = math.acos(max(-1, min(1, cos_inc)))

        reflect_dx = local_dx + 2 * cos_inc * nearest_normal[0]
        reflect_dy = local_dy + 2 * cos_inc * nearest_normal[1]

        cos_rot_back = math.cos(rotation_rad)
        sin_rot_back = math.sin(rotation_rad)
        world_reflect_dx = reflect_dx * cos_rot_back - reflect_dy * sin_rot_back
        world_reflect_dy = reflect_dx * sin_rot_back + reflect_dy * cos_rot_back

        return {
            'distance': nearest_t,
            'incident_angle': incident_angle,
            'reflected_dx': world_reflect_dx,
            'reflected_dy': world_reflect_dy,
            'edge_index': nearest_edge
        }

    def _ray_circle_intersection(self, rx: float, ry: float, dx: float, dy: float,
                                 cx: float, cy: float, radius: float) -> Optional[float]:
        fx = rx - cx
        fy = ry - cy

        a = dx * dx + dy * dy
        b = 2 * (fx * dx + fy * dy)
        c = fx * fx + fy * fy - radius * radius

        discriminant = b * b - 4 * a * c
        if discriminant < 0:
            return None

        sqrt_disc = math.sqrt(discriminant)
        t1 = (-b - sqrt_disc) / (2 * a)
        t2 = (-b + sqrt_disc) / (2 * a)

        if t1 > 0:
            return t1
        if t2 > 0:
            return t2
        return None
