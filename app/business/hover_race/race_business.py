from typing import Dict, Any, List, Optional
from app.model.hover_race import LapRecordModel, RaceRecordModel


class RaceBusiness:
    def __init__(self):
        self.lap_model = LapRecordModel()
        self.race_model = RaceRecordModel()

    def save_lap_record(self, player_name: str, lap_time: float, track_name: str = 'Neon Circuit',
                        lap_number: int = 1) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {
                'code': 1,
                'message': 'player_name is required',
                'data': None
            }

        if lap_time <= 0:
            return {
                'code': 1,
                'message': 'lap_time must be positive',
                'data': None
            }

        try:
            record_id = self.lap_model.create(
                player_name=player_name.strip(),
                lap_time=round(lap_time, 3),
                track_name=track_name,
                lap_number=lap_number
            )

            record = self.lap_model.get_by_id(record_id)
            return {
                'code': 0,
                'message': 'success',
                'data': record
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def save_race_record(self, player_name: str, total_time: float, best_lap: float,
                         position: int = 1, total_laps: int = 3, track_name: str = 'Neon Circuit',
                         opponents: int = 3) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {
                'code': 1,
                'message': 'player_name is required',
                'data': None
            }

        if total_time <= 0 or best_lap <= 0:
            return {
                'code': 1,
                'message': 'times must be positive',
                'data': None
            }

        try:
            record_id = self.race_model.create(
                player_name=player_name.strip(),
                total_time=round(total_time, 3),
                best_lap=round(best_lap, 3),
                position=position,
                total_laps=total_laps,
                track_name=track_name,
                opponents=opponents
            )

            record = self.race_model.get_by_id(record_id)
            return {
                'code': 0,
                'message': 'success',
                'data': record
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_top_lap_records(self, limit: int = 10, track_name: str = None) -> Dict[str, Any]:
        try:
            records = self.lap_model.get_top_laps(limit=limit, track_name=track_name)
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'items': records,
                    'count': len(records)
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_top_race_records(self, limit: int = 10, track_name: str = None) -> Dict[str, Any]:
        try:
            records = self.race_model.get_top_races(limit=limit, track_name=track_name)
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'items': records,
                    'count': len(records)
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_player_best_lap(self, player_name: str, track_name: str = None) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {
                'code': 1,
                'message': 'player_name is required',
                'data': None
            }

        try:
            record = self.lap_model.get_player_best(player_name.strip(), track_name=track_name)
            if record:
                return {
                    'code': 0,
                    'message': 'success',
                    'data': record
                }
            return {
                'code': 1,
                'message': 'No records found for this player',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_player_race_history(self, player_name: str, limit: int = 10) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {
                'code': 1,
                'message': 'player_name is required',
                'data': None
            }

        try:
            records = self.race_model.get_player_races(player_name.strip(), limit=limit)
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'items': records,
                    'count': len(records)
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }
