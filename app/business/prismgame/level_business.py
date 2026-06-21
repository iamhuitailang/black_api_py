import json
import math
import random
from typing import Dict, Any, List, Optional
from app.model.prismgame import LevelModel, PrismModel


PRESET_LEVELS = [
    {
        'name': '第一关：初见棱镜',
        'level_number': 1,
        'difficulty': 'easy',
        'description': '学习旋转棱镜，将光束引导至目标',
        'light_source': (50, 300, 0),
        'target': (750, 300, 35),
        'par_rotations': 3,
        'prisms': [
            {'x': 250, 'y': 300, 'sides': 6, 'size': 45, 'is_rotatable': True, 'rotation': 70, 'color_filter': ''},
            {'x': 500, 'y': 180, 'sides': 4, 'size': 40, 'is_rotatable': True, 'rotation': 20, 'color_filter': ''},
            {'x': 600, 'y': 420, 'sides': 3, 'size': 45, 'is_rotatable': False, 'rotation': 45, 'color_filter': ''},
            {'x': 380, 'y': 450, 'sides': 5, 'size': 38, 'is_rotatable': False, 'rotation': 0, 'color_filter': ''},
        ]
    },
    {
        'name': '第二关：分光初探',
        'level_number': 2,
        'difficulty': 'easy',
        'description': '白光在棱镜中分解为彩色光谱',
        'light_source': (50, 200, 15),
        'target': (750, 450, 35),
        'par_rotations': 4,
        'prisms': [
            {'x': 200, 'y': 280, 'sides': 6, 'size': 45, 'is_rotatable': True, 'rotation': 100, 'color_filter': ''},
            {'x': 420, 'y': 150, 'sides': 6, 'size': 42, 'is_rotatable': True, 'rotation': 30, 'color_filter': ''},
            {'x': 550, 'y': 380, 'sides': 4, 'size': 40, 'is_rotatable': True, 'rotation': 80, 'color_filter': ''},
            {'x': 320, 'y': 480, 'sides': 3, 'size': 45, 'is_rotatable': False, 'rotation': 60, 'color_filter': ''},
            {'x': 680, 'y': 200, 'sides': 5, 'size': 38, 'is_rotatable': False, 'rotation': 15, 'color_filter': ''},
            {'x': 150, 'y': 480, 'sides': 4, 'size': 35, 'is_rotatable': False, 'rotation': 90, 'color_filter': ''},
        ]
    },
    {
        'name': '第三关：色带组合',
        'level_number': 3,
        'difficulty': 'normal',
        'description': '尝试让不同颜色的光同时到达目标',
        'light_source': (50, 500, -25),
        'target': (750, 150, 35),
        'par_rotations': 5,
        'prisms': [
            {'x': 180, 'y': 380, 'sides': 6, 'size': 45, 'is_rotatable': True, 'rotation': 20, 'color_filter': 'red'},
            {'x': 350, 'y': 250, 'sides': 6, 'size': 45, 'is_rotatable': True, 'rotation': 140, 'color_filter': ''},
            {'x': 520, 'y': 420, 'sides': 4, 'size': 40, 'is_rotatable': True, 'rotation': 60, 'color_filter': 'green'},
            {'x': 650, 'y': 280, 'sides': 5, 'size': 42, 'is_rotatable': True, 'rotation': 110, 'color_filter': ''},
            {'x': 250, 'y': 120, 'sides': 3, 'size': 40, 'is_rotatable': False, 'rotation': 30, 'color_filter': 'blue'},
            {'x': 450, 'y': 530, 'sides': 4, 'size': 38, 'is_rotatable': False, 'rotation': 0, 'color_filter': ''},
            {'x': 100, 'y': 150, 'sides': 5, 'size': 36, 'is_rotatable': False, 'rotation': 70, 'color_filter': ''},
            {'x': 720, 'y': 500, 'sides': 6, 'size': 35, 'is_rotatable': False, 'rotation': 45, 'color_filter': ''},
        ]
    },
    {
        'name': '第四关：反射迷宫',
        'level_number': 4,
        'difficulty': 'normal',
        'description': '更多的棱镜，更复杂的路径',
        'light_source': (50, 80, 45),
        'target': (750, 520, 35),
        'par_rotations': 6,
        'prisms': [
            {'x': 180, 'y': 200, 'sides': 6, 'size': 42, 'is_rotatable': True, 'rotation': 10, 'color_filter': ''},
            {'x': 300, 'y': 380, 'sides': 5, 'size': 40, 'is_rotatable': True, 'rotation': 130, 'color_filter': ''},
            {'x': 450, 'y': 150, 'sides': 4, 'size': 38, 'is_rotatable': True, 'rotation': 75, 'color_filter': 'red'},
            {'x': 580, 'y': 320, 'sides': 6, 'size': 45, 'is_rotatable': True, 'rotation': 20, 'color_filter': ''},
            {'x': 680, 'y': 480, 'sides': 3, 'size': 42, 'is_rotatable': True, 'rotation': 160, 'color_filter': ''},
            {'x': 150, 'y': 480, 'sides': 4, 'size': 36, 'is_rotatable': True, 'rotation': 50, 'color_filter': 'green'},
            {'x': 400, 'y': 520, 'sides': 5, 'size': 38, 'is_rotatable': False, 'rotation': 90, 'color_filter': ''},
            {'x': 620, 'y': 100, 'sides': 6, 'size': 35, 'is_rotatable': False, 'rotation': 25, 'color_filter': ''},
            {'x': 80, 'y': 320, 'sides': 3, 'size': 38, 'is_rotatable': False, 'rotation': 45, 'color_filter': ''},
            {'x': 350, 'y': 60, 'sides': 4, 'size': 34, 'is_rotatable': False, 'rotation': 120, 'color_filter': 'blue'},
        ]
    },
    {
        'name': '第五关：元素共鸣',
        'level_number': 5,
        'difficulty': 'normal',
        'description': '利用色带组合触发元素效果',
        'light_source': (50, 550, -50),
        'target': (750, 50, 35),
        'par_rotations': 6,
        'prisms': [
            {'x': 180, 'y': 420, 'sides': 6, 'size': 45, 'is_rotatable': True, 'rotation': 30, 'color_filter': ''},
            {'x': 320, 'y': 280, 'sides': 6, 'size': 45, 'is_rotatable': True, 'rotation': 80, 'color_filter': 'red'},
            {'x': 480, 'y': 450, 'sides': 5, 'size': 42, 'is_rotatable': True, 'rotation': 150, 'color_filter': ''},
            {'x': 620, 'y': 300, 'sides': 4, 'size': 40, 'is_rotatable': True, 'rotation': 20, 'color_filter': 'blue'},
            {'x': 550, 'y': 120, 'sides': 6, 'size': 42, 'is_rotatable': True, 'rotation': 100, 'color_filter': ''},
            {'x': 250, 'y': 100, 'sides': 3, 'size': 40, 'is_rotatable': True, 'rotation': 60, 'color_filter': 'green'},
            {'x': 100, 'y': 250, 'sides': 5, 'size': 38, 'is_rotatable': False, 'rotation': 45, 'color_filter': ''},
            {'x': 400, 'y': 550, 'sides': 4, 'size': 36, 'is_rotatable': False, 'rotation': 10, 'color_filter': ''},
            {'x': 720, 'y': 450, 'sides': 6, 'size': 35, 'is_rotatable': False, 'rotation': 120, 'color_filter': ''},
            {'x': 380, 'y': 60, 'sides': 3, 'size': 38, 'is_rotatable': False, 'rotation': 90, 'color_filter': ''},
            {'x': 80, 'y': 500, 'sides': 5, 'size': 34, 'is_rotatable': False, 'rotation': 30, 'color_filter': ''},
            {'x': 680, 'y': 180, 'sides': 4, 'size': 36, 'is_rotatable': False, 'rotation': 150, 'color_filter': ''},
        ]
    },
    {
        'name': '第六关：固定棱镜',
        'level_number': 6,
        'difficulty': 'hard',
        'description': '部分棱镜无法旋转，需要精心规划路径',
        'light_source': (400, 50, 90),
        'target': (400, 550, 35),
        'par_rotations': 5,
        'prisms': [
            {'x': 180, 'y': 180, 'sides': 6, 'size': 45, 'is_rotatable': True, 'rotation': 20, 'color_filter': ''},
            {'x': 620, 'y': 180, 'sides': 6, 'size': 45, 'is_rotatable': True, 'rotation': 160, 'color_filter': ''},
            {'x': 400, 'y': 300, 'sides': 4, 'size': 48, 'is_rotatable': False, 'rotation': 45, 'color_filter': ''},
            {'x': 180, 'y': 420, 'sides': 5, 'size': 42, 'is_rotatable': True, 'rotation': 70, 'color_filter': 'red'},
            {'x': 620, 'y': 420, 'sides': 5, 'size': 42, 'is_rotatable': True, 'rotation': 110, 'color_filter': 'blue'},
            {'x': 80, 'y': 300, 'sides': 3, 'size': 40, 'is_rotatable': False, 'rotation': 0, 'color_filter': ''},
            {'x': 720, 'y': 300, 'sides': 3, 'size': 40, 'is_rotatable': False, 'rotation': 60, 'color_filter': ''},
            {'x': 300, 'y': 80, 'sides': 4, 'size': 36, 'is_rotatable': False, 'rotation': 30, 'color_filter': 'green'},
            {'x': 500, 'y': 80, 'sides': 4, 'size': 36, 'is_rotatable': False, 'rotation': 150, 'color_filter': ''},
            {'x': 300, 'y': 520, 'sides': 6, 'size': 35, 'is_rotatable': False, 'rotation': 90, 'color_filter': ''},
            {'x': 500, 'y': 520, 'sides': 6, 'size': 35, 'is_rotatable': False, 'rotation': 120, 'color_filter': ''},
            {'x': 80, 'y': 100, 'sides': 5, 'size': 34, 'is_rotatable': False, 'rotation': 45, 'color_filter': ''},
        ]
    },
    {
        'name': '第七关：散射挑战',
        'level_number': 7,
        'difficulty': 'hard',
        'description': '控制入射角，避免光束过度衰减',
        'light_source': (50, 300, 0),
        'target': (750, 300, 35),
        'par_rotations': 7,
        'prisms': [
            {'x': 180, 'y': 150, 'sides': 3, 'size': 50, 'is_rotatable': True, 'rotation': 10, 'color_filter': ''},
            {'x': 350, 'y': 450, 'sides': 3, 'size': 50, 'is_rotatable': True, 'rotation': 50, 'color_filter': ''},
            {'x': 500, 'y': 150, 'sides': 3, 'size': 50, 'is_rotatable': True, 'rotation': 90, 'color_filter': 'red'},
            {'x': 650, 'y': 450, 'sides': 3, 'size': 50, 'is_rotatable': True, 'rotation': 130, 'color_filter': 'blue'},
            {'x': 280, 'y': 300, 'sides': 6, 'size': 40, 'is_rotatable': False, 'rotation': 30, 'color_filter': ''},
            {'x': 550, 'y': 300, 'sides': 6, 'size': 40, 'is_rotatable': False, 'rotation': 150, 'color_filter': 'green'},
            {'x': 420, 'y': 80, 'sides': 4, 'size': 38, 'is_rotatable': False, 'rotation': 0, 'color_filter': ''},
            {'x': 420, 'y': 520, 'sides': 4, 'size': 38, 'is_rotatable': False, 'rotation': 90, 'color_filter': ''},
            {'x': 100, 'y': 500, 'sides': 5, 'size': 36, 'is_rotatable': False, 'rotation': 60, 'color_filter': ''},
            {'x': 700, 'y': 100, 'sides': 5, 'size': 36, 'is_rotatable': False, 'rotation': 120, 'color_filter': ''},
            {'x': 120, 'y': 100, 'sides': 6, 'size': 34, 'is_rotatable': False, 'rotation': 45, 'color_filter': ''},
            {'x': 680, 'y': 500, 'sides': 6, 'size': 34, 'is_rotatable': False, 'rotation': 135, 'color_filter': ''},
        ]
    },
    {
        'name': '第八关：过载机制',
        'level_number': 8,
        'difficulty': 'hard',
        'description': '连续命中同一目标会触发过载熔毁',
        'light_source': (50, 50, 45),
        'target': (750, 550, 35),
        'par_rotations': 8,
        'prisms': [
            {'x': 200, 'y': 200, 'sides': 6, 'size': 45, 'is_rotatable': True, 'rotation': 15, 'color_filter': ''},
            {'x': 400, 'y': 120, 'sides': 5, 'size': 42, 'is_rotatable': True, 'rotation': 85, 'color_filter': 'red'},
            {'x': 600, 'y': 200, 'sides': 4, 'size': 40, 'is_rotatable': True, 'rotation': 155, 'color_filter': ''},
            {'x': 300, 'y': 400, 'sides': 6, 'size': 45, 'is_rotatable': True, 'rotation': 45, 'color_filter': ''},
            {'x': 500, 'y': 400, 'sides': 5, 'size': 42, 'is_rotatable': True, 'rotation': 125, 'color_filter': 'green'},
            {'x': 700, 'y': 350, 'sides': 4, 'size': 40, 'is_rotatable': True, 'rotation': 25, 'color_filter': 'blue'},
            {'x': 100, 'y': 350, 'sides': 3, 'size': 42, 'is_rotatable': True, 'rotation': 105, 'color_filter': ''},
            {'x': 400, 'y': 300, 'sides': 6, 'size': 48, 'is_rotatable': False, 'rotation': 60, 'color_filter': ''},
            {'x': 200, 'y': 550, 'sides': 5, 'size': 38, 'is_rotatable': False, 'rotation': 30, 'color_filter': ''},
            {'x': 600, 'y': 550, 'sides': 5, 'size': 38, 'is_rotatable': False, 'rotation': 150, 'color_filter': ''},
            {'x': 80, 'y': 180, 'sides': 4, 'size': 36, 'is_rotatable': False, 'rotation': 0, 'color_filter': ''},
            {'x': 720, 'y': 80, 'sides': 6, 'size': 35, 'is_rotatable': False, 'rotation': 90, 'color_filter': ''},
        ]
    },
]


class LevelBusiness:
    def __init__(self):
        self.level_model = LevelModel()
        self.prism_model = PrismModel()

    def _generate_prisms_for_level(self, level_number: int, level_id: int) -> List[Dict[str, Any]]:
        preset = None
        for pl in PRESET_LEVELS:
            if pl['level_number'] == level_number:
                preset = pl
                break

        prisms = []
        if preset:
            for p in preset['prisms']:
                prisms.append({
                    'level_id': level_id,
                    'x': p['x'],
                    'y': p['y'],
                    'rotation': p['rotation'],
                    'sides': p['sides'],
                    'size': p['size'],
                    'is_rotatable': 1 if p['is_rotatable'] else 0,
                    'color_filter': p.get('color_filter', '')
                })
        else:
            num_prisms = min(4 + (level_number - 1) * 2, 12)
            rotatable_count = int(num_prisms * 0.6)
            canvas_width = 800
            canvas_height = 600
            margin = 100
            sides_options = [3, 4, 5, 6]

            for i in range(num_prisms):
                angle = (2 * math.pi * i) / num_prisms + random.uniform(-0.3, 0.3)
                radius = 180 + random.uniform(-30, 80)
                x = canvas_width / 2 + math.cos(angle) * radius
                y = canvas_height / 2 + math.sin(angle) * radius
                x = max(margin, min(canvas_width - margin, x))
                y = max(margin, min(canvas_height - margin, y))

                sides = random.choice(sides_options)
                is_rotatable = 1 if i < rotatable_count else 0
                rotation = random.uniform(0, 360)
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
        preset = None
        for pl in PRESET_LEVELS:
            if pl['level_number'] == level_number:
                preset = pl
                break

        if preset:
            light_source_x, light_source_y, light_source_angle = preset['light_source']
            target_x, target_y, target_radius = preset['target']
            par_rotations = preset['par_rotations']
        else:
            light_source_x = 50
            light_source_y = 300
            light_source_angle = 15
            target_x = 750
            target_y = 350
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

        for pl in PRESET_LEVELS:
            self.create_level(
                name=pl['name'],
                level_number=pl['level_number'],
                description=pl['description'],
                difficulty=pl['difficulty']
            )

        return {
            'code': 0,
            'message': 'success',
            'data': {'count': len(PRESET_LEVELS)}
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
