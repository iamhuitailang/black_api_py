from typing import Dict, Any, List, Optional
from app.model.game import PlayerScoreModel, GameProgressModel


class GameBusiness:
    def __init__(self):
        self.score_model = PlayerScoreModel()
        self.progress_model = GameProgressModel()

    def save_game_score(self, player_name: str, score: int, wave: int, kills: int,
                        energy_collected: int = 0, boss_killed: bool = False) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {
                'code': 1,
                'message': 'Player name cannot be empty',
                'data': None
            }

        if score < 0:
            return {
                'code': 1,
                'message': 'Score cannot be negative',
                'data': None
            }

        player_name = player_name.strip()

        score_id = self.score_model.create(player_name, score, wave, kills)

        self.progress_model.update_progress(
            player_name=player_name,
            wave=wave,
            score=score,
            kills=kills,
            energy=energy_collected,
            boss_killed=boss_killed
        )

        score_record = self.score_model.get_by_id(score_id)
        progress_record = self.progress_model.get_by_player_name(player_name)

        return {
            'code': 0,
            'message': 'Score saved successfully',
            'data': {
                'score_record': score_record,
                'progress': progress_record
            }
        }

    def get_top_scores(self, limit: int = 10) -> Dict[str, Any]:
        if limit <= 0:
            limit = 10
        if limit > 100:
            limit = 100

        scores = self.score_model.get_top_scores(limit)
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'scores': scores,
                'count': len(scores)
            }
        }

    def get_player_progress(self, player_name: str) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {
                'code': 1,
                'message': 'Player name cannot be empty',
                'data': None
            }

        player_name = player_name.strip()
        progress = self.progress_model.get_by_player_name(player_name)

        if not progress:
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'player_name': player_name,
                    'highest_wave': 1,
                    'highest_score': 0,
                    'total_kills': 0,
                    'total_games': 0,
                    'energy_collected': 0,
                    'boss_kills': 0,
                    'is_new': True
                }
            }

        return {
            'code': 0,
            'message': 'success',
            'data': {
                **progress,
                'is_new': False
            }
        }

    def get_player_scores(self, player_name: str) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {
                'code': 1,
                'message': 'Player name cannot be empty',
                'data': None
            }

        player_name = player_name.strip()
        scores = self.score_model.get_by_player_name(player_name)

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'scores': scores,
                'count': len(scores)
            }
        }

    def get_leaderboard(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.score_model.paginate(page, page_size)
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

    def get_all_progress(self, limit: int = 50) -> Dict[str, Any]:
        if limit <= 0:
            limit = 50
        if limit > 200:
            limit = 200

        progress_list = self.progress_model.get_all(limit)
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'players': progress_list,
                'count': len(progress_list)
            }
        }
