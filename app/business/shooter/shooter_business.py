from typing import Dict, Any, Optional
from app.model.shooter import ShooterGameModel


def calculate_score(final_health: float, time_used: float) -> float:
    time_factor = max(0.5, 1.0 - max(0, (time_used - 300)) / 100)
    return round(final_health * time_factor, 2)


class ShooterBusiness:
    def __init__(self):
        self.model = ShooterGameModel()

    def submit_record(self, player_name: str, final_health: int, time_used: float,
                      cleared: bool, sniper_used: list, enemies_killed: int,
                      score: float = None) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            player_name = "Anonymous"
        
        player_name = player_name.strip()[:50]
        
        if final_health < 0 or final_health > 100:
            return {
                'code': 1,
                'message': 'final_health must be between 0 and 100',
                'data': None
            }
        
        if time_used <= 0:
            return {
                'code': 1,
                'message': 'time_used must be greater than 0',
                'data': None
            }
        
        if score is None:
            score = calculate_score(final_health, time_used)
        
        new_id = self.model.create(
            player_name=player_name,
            final_health=final_health,
            time_used=time_used,
            score=score,
            cleared=cleared,
            sniper_used=sniper_used,
            enemies_killed=enemies_killed
        )
        
        rank = self.model.get_rank(new_id)
        record = self.model.get_by_id(new_id)
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'id': new_id,
                'player_name': record['player_name'],
                'score': record['score'],
                'rank': rank,
                'created_at': record['created_at']
            }
        }

    def get_record(self, record_id: int) -> Dict[str, Any]:
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

    def get_leaderboard(self, limit: int = 10) -> Dict[str, Any]:
        if limit < 1 or limit > 100:
            limit = 10
        
        entries = self.model.get_leaderboard(limit)
        total_players = self.model.get_total_players()
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'entries': entries,
                'total_players': total_players
            }
        }

    def get_personal_best(self, player_name: str) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {
                'code': 1,
                'message': 'player_name is required',
                'data': None
            }
        
        player_name = player_name.strip()
        record = self.model.get_personal_best(player_name)
        
        if not record:
            return {
                'code': 0,
                'message': 'No records found for this player',
                'data': None
            }
        
        return {
            'code': 0,
            'message': 'success',
            'data': record
        }
