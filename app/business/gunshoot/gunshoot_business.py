from typing import Dict, Any, List, Optional
from app.model.gunshoot import LevelStatsModel


class GunShootBusiness:
    def __init__(self):
        self.model = LevelStatsModel()

    def _calculate_score(self, stats: Dict[str, Any]) -> int:
        score = 0
        if stats.get('cleared'):
            score += 1000
            score += stats.get('remaining_hp', 0) * 10
        score += stats.get('enemies_killed', 0) * 20
        score += stats.get('damage_dealt', 0)
        score += int(stats.get('dual_gun_hit_rate', 0) * 500)
        score += int(stats.get('single_gun_hit_rate', 0) * 300)
        time_bonus = max(0, 300 - int(stats.get('total_time', 0))) * 2
        score += time_bonus
        stationary_penalty = int(stats.get('stationary_ratio', 0) * 200)
        score = max(0, score - stationary_penalty)
        return score

    def _calculate_grade(self, score: int, cleared: bool) -> str:
        if not cleared:
            return 'F'
        if score >= 2500:
            return 'S'
        elif score >= 2000:
            return 'A'
        elif score >= 1500:
            return 'B'
        elif score >= 1000:
            return 'C'
        else:
            return 'D'

    def submit_level_stats(self, stats_data: Dict[str, Any]) -> Dict[str, Any]:
        required_fields = [
            'level_id', 'cleared', 'remaining_hp', 'total_time',
            'dual_gun_shots', 'dual_gun_hits',
            'single_gun_shots', 'single_gun_hits',
            'stationary_time', 'enemies_killed', 'total_enemies',
            'damage_dealt', 'damage_taken', 'reload_count'
        ]
        for field in required_fields:
            if field not in stats_data:
                return {
                    'code': 1,
                    'message': f'Missing required field: {field}',
                    'data': None
                }

        dual_shots = max(0, int(stats_data['dual_gun_shots']))
        dual_hits = max(0, min(int(stats_data['dual_gun_hits']), dual_shots))
        single_shots = max(0, int(stats_data['single_gun_shots']))
        single_hits = max(0, min(int(stats_data['single_gun_hits']), single_shots))
        total_time = max(0.01, float(stats_data['total_time']))
        stationary_time = max(0, min(float(stats_data['stationary_time']), total_time))

        dual_hit_rate = (dual_hits / dual_shots) if dual_shots > 0 else 0.0
        single_hit_rate = (single_hits / single_shots) if single_shots > 0 else 0.0
        stationary_ratio = stationary_time / total_time if total_time > 0 else 0.0

        data = {
            'level_id': max(1, int(stats_data['level_id'])),
            'cleared': 1 if stats_data['cleared'] else 0,
            'remaining_hp': max(0, int(stats_data['remaining_hp'])),
            'total_time': round(total_time, 2),
            'dual_gun_shots': dual_shots,
            'dual_gun_hits': dual_hits,
            'dual_gun_hit_rate': round(dual_hit_rate, 4),
            'single_gun_shots': single_shots,
            'single_gun_hits': single_hits,
            'single_gun_hit_rate': round(single_hit_rate, 4),
            'stationary_time': round(stationary_time, 2),
            'stationary_ratio': round(stationary_ratio, 4),
            'enemies_killed': max(0, int(stats_data['enemies_killed'])),
            'total_enemies': max(0, int(stats_data['total_enemies'])),
            'damage_dealt': max(0, int(stats_data['damage_dealt'])),
            'damage_taken': max(0, int(stats_data['damage_taken'])),
            'reload_count': max(0, int(stats_data['reload_count'])),
            'score': 0,
            'grade': 'D'
        }

        data['score'] = self._calculate_score(data)
        data['grade'] = self._calculate_grade(data['score'], data['cleared'] == 1)

        new_id = self.model.create(data)
        record = self.model.get_by_id(new_id)

        return {
            'code': 0,
            'message': 'success',
            'data': record
        }

    def get_level_stats(self, record_id: int = None) -> Dict[str, Any]:
        if record_id:
            record = self.model.get_by_id(record_id)
            if not record:
                return {
                    'code': 1,
                    'message': f'Record with id {record_id} not found',
                    'data': None
                }
            return {
                'code': 0,
                'message': 'success',
                'data': record
            }
        else:
            records = self.model.get_all(limit=50)
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'items': records,
                    'total': len(records)
                }
            }

    def get_level_records(self, level_id: int = 1, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.model.paginate(page, page_size, level_id=level_id)
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': result['items'],
                'total': result['total'],
                'page': result['page'],
                'page_size': result['page_size'],
                'total_pages': result['total_pages']
            }
        }

    def get_best_record(self, level_id: int = 1) -> Dict[str, Any]:
        record = self.model.get_best_score(level_id)
        if not record:
            return {
                'code': 0,
                'message': 'no cleared record yet',
                'data': None
            }
        return {
            'code': 0,
            'message': 'success',
            'data': record
        }
