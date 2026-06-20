from typing import Dict, Any, List, Optional
from app.model.climber import ClimberRecordModel, ClimberFloorStatModel


class ClimberBusiness:
    def __init__(self):
        self.record_model = ClimberRecordModel()
        self.floor_stat_model = ClimberFloorStatModel()

    def submit_record(self, player_name: str, total_time: float, fall_count: int,
                      floor_times: Dict[str, float] = None) -> Dict[str, Any]:
        if total_time <= 0:
            return {
                'code': 1,
                'message': '无效的通关时间',
                'data': None
            }

        normalized_floor_times = {}
        if floor_times:
            for k, v in floor_times.items():
                try:
                    key_int = int(k)
                    if 1 <= key_int <= 12:
                        normalized_floor_times[key_int] = float(v) if v else 0
                except (ValueError, TypeError):
                    pass

        for i in range(1, 13):
            if i not in normalized_floor_times:
                normalized_floor_times[i] = 0

        try:
            new_id = self.record_model.create(
                player_name=player_name,
                total_time=total_time,
                fall_count=fall_count,
                floor_times=normalized_floor_times
            )

            self.floor_stat_model.update_with_floor_times(normalized_floor_times)

            record = self.record_model.get_by_id(new_id)
            return {
                'code': 0,
                'message': '保存成功',
                'data': {
                    'id': record.get('id'),
                    'player_name': record.get('player_name'),
                    'total_time': record.get('total_time'),
                    'fall_count': record.get('fall_count'),
                    'created_at': record.get('created_at'),
                    'rank': self._get_rank(record.get('total_time'))
                }
            }
        except Exception as e:
            return {
                'code': 2,
                'message': f'保存失败: {str(e)}',
                'data': None
            }

    def _get_rank(self, total_time: float) -> int:
        records = self.record_model.get_top_records(limit=1000)
        for idx, r in enumerate(records):
            if r.get('total_time', 0) >= total_time:
                return idx + 1
        return len(records) + 1

    def get_records(self, limit: int = 50) -> Dict[str, Any]:
        try:
            records = self.record_model.get_top_records(limit=limit)
            total = self.record_model.count()
            data = []
            for r in records:
                data.append({
                    'id': r.get('id'),
                    'player_name': r.get('player_name'),
                    'total_time': r.get('total_time'),
                    'fall_count': r.get('fall_count'),
                    'floor_times': r.get('floor_times', {}),
                    'created_at': r.get('created_at')
                })
            return {
                'code': 0,
                'message': 'success',
                'data': data,
                'total': total
            }
        except Exception as e:
            return {
                'code': 1,
                'message': f'查询失败: {str(e)}',
                'data': [],
                'total': 0
            }

    def get_floor_stats(self) -> Dict[str, Any]:
        try:
            stats = self.floor_stat_model.get_all_stats()
            return {
                'code': 0,
                'message': 'success',
                'data': stats
            }
        except Exception as e:
            return {
                'code': 1,
                'message': f'查询失败: {str(e)}',
                'data': []
            }

    def get_summary(self) -> Dict[str, Any]:
        try:
            total_plays = self.record_model.count()
            records = self.record_model.get_top_records(limit=3)
            floor_stats = self.floor_stat_model.get_all_stats()

            best_each_floor = {}
            for s in floor_stats:
                floor = s.get('floor_num')
                best_each_floor[floor] = s.get('best_time')

            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'total_plays': total_plays,
                    'top3': records[:3],
                    'best_each_floor': best_each_floor
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': f'查询失败: {str(e)}',
                'data': None
            }
