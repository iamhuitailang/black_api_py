from typing import Dict, Any, List, Optional
from app.model.game import WaveRecordModel


class GameBusiness:
    def __init__(self):
        self.model = WaveRecordModel()

    def save_wave_record(self, player_name: str, wave: int, score: int, kills: int,
                         elite_kills: int, boss_kills: int, damage_dealt: int,
                         arrows_shot: int, crystals_collected: int, survival_time: int,
                         is_victory: bool) -> Dict[str, Any]:
        if wave < 1:
            return {
                'code': 1,
                'message': 'Wave must be at least 1',
                'data': None
            }

        new_id = self.model.create(
            player_name=player_name,
            wave=wave,
            score=score,
            kills=kills,
            elite_kills=elite_kills,
            boss_kills=boss_kills,
            damage_dealt=damage_dealt,
            arrows_shot=arrows_shot,
            crystals_collected=crystals_collected,
            survival_time=survival_time,
            is_victory=is_victory
        )

        record = self.model.get_by_id(new_id)
        return {
            'code': 0,
            'message': 'Record saved successfully',
            'data': self._format_record(record)
        }

    def get_record(self, record_id: int) -> Dict[str, Any]:
        record = self.model.get_by_id(record_id)
        if not record:
            return {
                'code': 1,
                'message': 'Record not found',
                'data': None
            }
        return {
            'code': 0,
            'message': 'success',
            'data': self._format_record(record)
        }

    def get_latest_record(self) -> Dict[str, Any]:
        record = self.model.get_latest()
        return {
            'code': 0,
            'message': 'success',
            'data': self._format_record(record) if record else None
        }

    def get_top_scores(self, limit: int = 10) -> Dict[str, Any]:
        records = self.model.get_top_scores(limit)
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': [self._format_record(r) for r in records],
                'total': len(records)
            }
        }

    def get_highest_wave(self) -> Dict[str, Any]:
        record = self.model.get_highest_wave()
        return {
            'code': 0,
            'message': 'success',
            'data': self._format_record(record) if record else None
        }

    def get_records_paginated(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.model.paginate(page, page_size)
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': [self._format_record(r) for r in result['items']],
                'total': result['total'],
                'page': result['page'],
                'page_size': result['page_size'],
                'total_pages': result['total_pages']
            }
        }

    def delete_record(self, record_id: int) -> Dict[str, Any]:
        existing = self.model.get_by_id(record_id)
        if not existing:
            return {
                'code': 1,
                'message': 'Record not found',
                'data': None
            }

        affected = self.model.delete(record_id)
        if affected > 0:
            return {
                'code': 0,
                'message': 'Record deleted successfully',
                'data': None
            }
        return {
            'code': 1,
            'message': 'Delete failed',
            'data': None
        }

    def get_stats_summary(self) -> Dict[str, Any]:
        highest_wave = self.model.get_highest_wave()
        top_score = self.model.get_top_scores(1)
        total_games = self.model.count()

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'total_games': total_games,
                'highest_wave': highest_wave.get('wave') if highest_wave else 0,
                'highest_score': top_score[0].get('score') if top_score else 0,
                'best_player': top_score[0].get('player_name') if top_score else None
            }
        }

    def _format_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        if not record:
            return None
        return {
            'id': record.get('id'),
            'player_name': record.get('player_name'),
            'wave': record.get('wave'),
            'score': record.get('score'),
            'kills': record.get('kills'),
            'elite_kills': record.get('elite_kills'),
            'boss_kills': record.get('boss_kills'),
            'damage_dealt': record.get('damage_dealt'),
            'arrows_shot': record.get('arrows_shot'),
            'crystals_collected': record.get('crystals_collected'),
            'survival_time': record.get('survival_time'),
            'is_victory': record.get('is_victory') == 1,
            'created_at': record.get('created_at'),
            'updated_at': record.get('updated_at')
        }
