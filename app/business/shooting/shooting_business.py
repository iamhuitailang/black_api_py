from typing import Dict, Any, List, Optional
from app.model.shooting import LevelConfigModel, ScoreRankingModel
import json


class ShootingBusiness:
    def __init__(self):
        self.level_model = LevelConfigModel()
        self.score_model = ScoreRankingModel()

    def get_level_list(self) -> Dict[str, Any]:
        levels = self.level_model.get_all()
        result = []
        for level in levels:
            result.append({
                'id': level.get('id'),
                'level_num': level.get('level_num'),
                'level_name': level.get('level_name'),
                'wave_count': level.get('wave_count'),
                'supply_interval': level.get('supply_interval'),
                'created_at': level.get('created_at'),
                'updated_at': level.get('updated_at')
            })

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': result,
                'total': len(result)
            }
        }

    def get_level_config(self, level_num: int) -> Dict[str, Any]:
        level = self.level_model.get_by_level_num(level_num)

        if not level:
            return {
                'code': 1,
                'message': f'关卡 {level_num} 不存在',
                'data': None
            }

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'id': level.get('id'),
                'level_num': level.get('level_num'),
                'level_name': level.get('level_name'),
                'wave_count': level.get('wave_count'),
                'supply_interval': level.get('supply_interval'),
                'wave_config': level.get('wave_config'),
                'enemy_types': {
                    'rush': {
                        'name': '冲锋型',
                        'hp': 20,
                        'speed': 3.0,
                        'damage': 10,
                        'color': '#ff4444'
                    },
                    'defense': {
                        'name': '防御型',
                        'hp': 80,
                        'speed': 1.0,
                        'damage': 15,
                        'shield_reduction': 0.5,
                        'color': '#4488ff'
                    },
                    'suicide': {
                        'name': '自爆型',
                        'hp': 30,
                        'speed': 2.0,
                        'explode_radius': 3,
                        'explode_damage': 40,
                        'color': '#ffaa00'
                    }
                },
                'bullet_types': {
                    'normal': {
                        'name': '普通弹',
                        'heat_cost': 10,
                        'damage': 20,
                        'color': '#ffffff'
                    },
                    'explosive': {
                        'name': '爆裂弹',
                        'heat_cost': 35,
                        'damage': 30,
                        'radius': 2,
                        'color': '#ff8800'
                    },
                    'piercing': {
                        'name': '穿甲弹',
                        'heat_cost': 50,
                        'damage': 15,
                        'pierce_count': 3,
                        'damage_reduction': 0.5,
                        'color': '#00ffff'
                    }
                },
                'heat_system': {
                    'max_heat': 100,
                    'recover_per_step': 2,
                    'recover_per_kill': 15,
                    'initial_heat': 30
                },
                'player': {
                    'max_health': 100,
                    'move_speed': 1.0,
                    'initial_health': 100
                }
            }
        }

    def set_level_config(self, level_num: int, level_name: str = None,
                         wave_count: int = None, supply_interval: int = None,
                         wave_config: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        existing = self.level_model.get_by_level_num(level_num)

        try:
            wave_config_str = json.dumps(wave_config) if wave_config is not None else None

            if existing:
                self.level_model.update(
                    record_id=existing['id'],
                    level_name=level_name,
                    wave_count=wave_count,
                    supply_interval=supply_interval,
                    wave_config=wave_config_str
                )
            else:
                if not level_name:
                    level_name = f'第{level_num}关'
                if wave_count is None:
                    wave_count = 6
                if supply_interval is None:
                    supply_interval = 15
                self.level_model.create(
                    level_num=level_num,
                    level_name=level_name,
                    wave_count=wave_count,
                    supply_interval=supply_interval,
                    wave_config=wave_config_str or '[]'
                )

            return self.get_level_config(level_num)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_score_ranking(self, level_num: int = None, limit: int = 10) -> Dict[str, Any]:
        if level_num:
            scores = self.score_model.get_top_by_level(level_num, limit)
        else:
            scores = self.score_model.get_all_top(limit)

        result = []
        for score in scores:
            result.append({
                'id': score.get('id'),
                'level_num': score.get('level_num'),
                'player_name': score.get('player_name'),
                'score': score.get('score'),
                'kills': score.get('kills'),
                'remaining_health': score.get('remaining_health'),
                'duration': score.get('duration'),
                'created_at': score.get('created_at')
            })

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': result,
                'total': len(result)
            }
        }

    def submit_score(self, level_num: int, player_name: str, score: int,
                     kills: int = 0, remaining_health: int = 0,
                     duration: int = 0) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {
                'code': 1,
                'message': '玩家名称不能为空',
                'data': None
            }

        if score < 0:
            return {
                'code': 1,
                'message': '分数不能为负数',
                'data': None
            }

        try:
            record_id = self.score_model.create(
                level_num=level_num,
                player_name=player_name.strip(),
                score=score,
                kills=kills,
                remaining_health=remaining_health,
                duration=duration
            )

            ranking = self.score_model.get_top_by_level(level_num, 100)
            rank = None
            for idx, r in enumerate(ranking):
                if r['id'] == record_id:
                    rank = idx + 1
                    break

            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'id': record_id,
                    'rank': rank,
                    'level_num': level_num,
                    'player_name': player_name.strip(),
                    'score': score,
                    'kills': kills,
                    'remaining_health': remaining_health,
                    'duration': duration
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def delete_level(self, level_num: int) -> Dict[str, Any]:
        existing = self.level_model.get_by_level_num(level_num)
        if not existing:
            return {
                'code': 1,
                'message': f'关卡 {level_num} 不存在',
                'data': None
            }

        affected = self.level_model.delete(existing['id'])
        if affected > 0:
            return {
                'code': 0,
                'message': 'delete success',
                'data': None
            }

        return {
            'code': 1,
            'message': 'delete failed',
            'data': None
        }

    def init_default_data(self) -> Dict[str, Any]:
        try:
            self.level_model.init_default_levels()
            levels = self.level_model.get_all()
            return {
                'code': 0,
                'message': '初始化成功',
                'data': {
                    'levels_count': len(levels)
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }
