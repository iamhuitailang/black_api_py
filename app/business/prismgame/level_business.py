import json
import math
import random
from typing import Dict, Any, List, Optional
from app.model.prismgame import LevelModel, PrismModel


class LevelBusiness:
    def __init__(self):
        self.level_model = LevelModel()
        self.prism_model = PrismModel()

    def _generate_prisms_for_level(self, level_number: int, level_id: int) -> List[Dict[str, Any]]:
        num_prisms = min(4 + (level_number - 1) * 2, 12)
        rotatable_count = int(num_prisms * 0.6)
        prisms = []

        canvas_width = 800
        canvas_height = 600
        margin = 100

        positions = []
        for i in range(num_prisms):
            angle = (2 * math.pi * i) / num_prisms + random.uniform(-0.3, 0.3)
            radius = 150 + random.uniform(-50, 100)
            x = canvas_width / 2 + math.cos(angle) * radius
            y = canvas_height / 2 + math.sin(angle) * radius
            x = max(margin, min(canvas_width - margin, x))
            y = max(margin, min(canvas_height - margin, y))
            positions.append((x, y))

        sides_options = [3, 4, 5, 6]

        for i in range(num_prisms):
            x, y = positions[i]
            sides = random.choice(sides_options)
            is_rotatable = 1 if i < rotatable_count else 0
            rotation = random.uniform(0, 360) if is_rotatable else random.uniform(0, 360)
            size = 35 + random.uniform(-10, 15)

            color_filter = ''
            if level_number >= 3 and random.random() < 0.3:
                colors = ['red', 'green', 'blue']
                color_filter = random.choice(colors)

            prisms.append({
                'level_id': level_id,
                'x': x,
                'y': y,
                'rotation': rotation,
                'sides': sides,
                'size': size,
                'is_rotatable': is_rotatable,
                'color_filter': color_filter
            })

        return prisms

    def create_level(self, name: str, level_number: int, description: str = '',
                     difficulty: str = 'normal') -> Dict[str, Any]:
        light_source_x = 50
        light_source_y = 300
        light_source_angle = 0
        target_x = 750
        target_y = 300
        target_radius = 35
        par_rotations = max(2, 8 - level_number)

        data = {
            'name': name,
            'description': description,
            'level_number': level_number,
            'difficulty': difficulty,
            'light_source_x': light_source_x,
            'light_source_y': light_source_y,
            'light_source_angle': light_source_angle,
            'target_x': target_x,
            'target_y': target_y,
            'target_radius': target_radius,
            'par_rotations': par_rotations
        }

        level_id = self.level_model.create(data)
        prisms = self._generate_prisms_for_level(level_number, level_id)
        self.prism_model.create_batch(prisms)

        return self.get_level_detail(level_id)

    def generate_default_levels(self) -> Dict[str, Any]:
        existing_count = self.level_model.count()
        if existing_count > 0:
            return {
                'code': 0,
                'message': 'Levels already exist',
                'data': {'count': existing_count}
            }

        levels_data = [
            {'name': '第一关：初见棱镜', 'level_number': 1, 'difficulty': 'easy',
             'description': '学习旋转棱镜，将光束引导至目标'},
            {'name': '第二关：分光初探', 'level_number': 2, 'difficulty': 'easy',
             'description': '白光在棱镜中分解为彩色光谱'},
            {'name': '第三关：色带组合', 'level_number': 3, 'difficulty': 'normal',
             'description': '尝试让不同颜色的光同时到达目标'},
            {'name': '第四关：反射迷宫', 'level_number': 4, 'difficulty': 'normal',
             'description': '更多的棱镜，更复杂的路径'},
            {'name': '第五关：元素共鸣', 'level_number': 5, 'difficulty': 'normal',
             'description': '利用色带组合触发元素效果'},
            {'name': '第六关：固定棱镜', 'level_number': 6, 'difficulty': 'hard',
             'description': '部分棱镜无法旋转，需要精心规划路径'},
            {'name': '第七关：散射挑战', 'level_number': 7, 'difficulty': 'hard',
             'description': '控制入射角，避免光束过度衰减'},
            {'name': '第八关：过载机制', 'level_number': 8, 'difficulty': 'hard',
             'description': '连续命中同一目标会触发过载熔毁'},
        ]

        for ld in levels_data:
            self.create_level(
                name=ld['name'],
                level_number=ld['level_number'],
                description=ld['description'],
                difficulty=ld['difficulty']
            )

        return {
            'code': 0,
            'message': 'success',
            'data': {'count': len(levels_data)}
        }

    def get_level_detail(self, level_id: int) -> Dict[str, Any]:
        level = self.level_model.get_by_id(level_id)
        if not level:
            return {
                'code': 1,
                'message': f'Level with id {level_id} not found',
                'data': None
            }

        prisms = self.prism_model.get_by_level_id(level_id)
        return {
            'code': 0,
            'message': 'success',
            'data': {
                **level,
                'prisms': prisms
            }
        }

    def get_level_by_number(self, level_number: int) -> Dict[str, Any]:
        level = self.level_model.get_by_level_number(level_number)
        if not level:
            return {
                'code': 1,
                'message': f'Level {level_number} not found',
                'data': None
            }
        return self.get_level_detail(level['id'])

    def get_all_levels(self) -> Dict[str, Any]:
        levels = self.level_model.get_all()
        result = []
        for level in levels:
            prism_count = self.prism_model.count_by_level_id(level['id'])
            result.append({
                **level,
                'prism_count': prism_count
            })

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': result,
                'total': len(result)
            }
        }

    def update_level(self, level_id: int, name: str = None, description: str = None,
                     difficulty: str = None) -> Dict[str, Any]:
        existing = self.level_model.get_by_id(level_id)
        if not existing:
            return {
                'code': 1,
                'message': f'Level with id {level_id} not found',
                'data': None
            }

        data = {}
        if name is not None:
            data['name'] = name
        if description is not None:
            data['description'] = description
        if difficulty is not None:
            data['difficulty'] = difficulty

        if data:
            self.level_model.update(level_id, data)

        return self.get_level_detail(level_id)

    def delete_level(self, level_id: int) -> Dict[str, Any]:
        existing = self.level_model.get_by_id(level_id)
        if not existing:
            return {
                'code': 1,
                'message': f'Level with id {level_id} not found',
                'data': None
            }

        self.prism_model.delete_by_level_id(level_id)
        self.level_model.delete(level_id)

        return {
            'code': 0,
            'message': 'delete success',
            'data': None
        }
