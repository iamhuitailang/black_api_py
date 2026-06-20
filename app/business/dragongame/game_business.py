from typing import Dict, Any, List, Optional
from app.model.dragongame import GameRecordModel, DragonStatusModel


class DragonGameBusiness:
    def __init__(self):
        self.record_model = GameRecordModel()
        self.status_model = DragonStatusModel()

    def start_new_game(self, player_name: str = 'Player') -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            player_name = 'Player'

        record_id = self.record_model.create(
            player_name=player_name.strip(),
            wave_reached=1,
            enemies_killed=0,
            score=0,
            status='playing'
        )

        status_id = self.status_model.create(
            player_name=player_name.strip(),
            record_id=record_id,
            flame_level=1,
            flame_damage_multiplier=1.0,
            essence_collected=0,
            total_essence=0,
            max_hp=150,
            charge_damage=30
        )

        record = self.record_model.get_by_id(record_id)
        status = self.status_model.get_by_id(status_id)

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'record': record,
                'dragon_status': status
            }
        }

    def save_progress(self, record_id: int, wave_reached: int,
                      enemies_killed: int, score: int) -> Dict[str, Any]:
        if not record_id or record_id <= 0:
            return {
                'code': 1,
                'message': 'Invalid record id',
                'data': None
            }

        existing = self.record_model.get_by_id(record_id)
        if not existing:
            return {
                'code': 1,
                'message': f'Record with id {record_id} not found',
                'data': None
            }

        self.record_model.update_progress(
            record_id,
            max(wave_reached, 0),
            max(enemies_killed, 0),
            max(score, 0),
            'playing'
        )

        record = self.record_model.get_by_id(record_id)
        return {
            'code': 0,
            'message': 'progress saved',
            'data': record
        }

    def finish_game(self, record_id: int, wave_reached: int,
                    enemies_killed: int, score: int) -> Dict[str, Any]:
        if not record_id or record_id <= 0:
            return {
                'code': 1,
                'message': 'Invalid record id',
                'data': None
            }

        existing = self.record_model.get_by_id(record_id)
        if not existing:
            return {
                'code': 1,
                'message': f'Record with id {record_id} not found',
                'data': None
            }

        self.record_model.finish_game(
            record_id,
            max(wave_reached, 0),
            max(enemies_killed, 0),
            max(score, 0)
        )

        record = self.record_model.get_by_id(record_id)
        return {
            'code': 0,
            'message': 'game finished',
            'data': record
        }

    def get_record(self, record_id: int) -> Dict[str, Any]:
        if not record_id or record_id <= 0:
            return {
                'code': 1,
                'message': 'Invalid record id',
                'data': None
            }

        record = self.record_model.get_by_id(record_id)
        if not record:
            return {
                'code': 1,
                'message': f'Record with id {record_id} not found',
                'data': None
            }

        status = self.status_model.get_by_record(record_id)

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'record': record,
                'dragon_status': status
            }
        }

    def get_player_records(self, player_name: str) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {
                'code': 1,
                'message': 'Player name is required',
                'data': None
            }

        records = self.record_model.get_by_player(player_name.strip())

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'records': records,
                'count': len(records)
            }
        }

    def get_leaderboard(self, limit: int = 10) -> Dict[str, Any]:
        limit = max(1, min(limit, 100))
        records = self.record_model.get_top_scores(limit)

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'records': records,
                'count': len(records)
            }
        }

    def collect_essence(self, status_id: int, amount: int = 1) -> Dict[str, Any]:
        if not status_id or status_id <= 0:
            return {
                'code': 1,
                'message': 'Invalid status id',
                'data': None
            }

        status = self.status_model.collect_essence(status_id, max(1, amount))
        if not status:
            return {
                'code': 1,
                'message': f'Dragon status with id {status_id} not found',
                'data': None
            }

        return {
            'code': 0,
            'message': 'essence collected',
            'data': status
        }

    def upgrade_flame(self, status_id: int, essence_cost: int = 1) -> Dict[str, Any]:
        if not status_id or status_id <= 0:
            return {
                'code': 1,
                'message': 'Invalid status id',
                'data': None
            }

        current = self.status_model.get_by_id(status_id)
        if not current:
            return {
                'code': 1,
                'message': f'Dragon status with id {status_id} not found',
                'data': None
            }

        if current['essence_collected'] < essence_cost:
            return {
                'code': 1,
                'message': 'Insufficient flame essence',
                'data': {
                    'current': current['essence_collected'],
                    'required': essence_cost
                }
            }

        status = self.status_model.upgrade_flame(status_id, essence_cost)
        if not status:
            return {
                'code': 1,
                'message': 'Upgrade failed',
                'data': None
            }

        return {
            'code': 0,
            'message': 'flame upgraded',
            'data': status
        }

    def get_dragon_status(self, status_id: int) -> Dict[str, Any]:
        if not status_id or status_id <= 0:
            return {
                'code': 1,
                'message': 'Invalid status id',
                'data': None
            }

        status = self.status_model.get_by_id(status_id)
        if not status:
            return {
                'code': 1,
                'message': f'Dragon status with id {status_id} not found',
                'data': None
            }

        return {
            'code': 0,
            'message': 'success',
            'data': status
        }

    def get_all_records(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.record_model.paginate(page, page_size)
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

    def delete_record(self, record_id: int) -> Dict[str, Any]:
        if not record_id or record_id <= 0:
            return {
                'code': 1,
                'message': 'Invalid record id',
                'data': None
            }

        existing = self.record_model.get_by_id(record_id)
        if not existing:
            return {
                'code': 1,
                'message': f'Record with id {record_id} not found',
                'data': None
            }

        self.record_model.delete(record_id)

        return {
            'code': 0,
            'message': 'record deleted',
            'data': None
        }
