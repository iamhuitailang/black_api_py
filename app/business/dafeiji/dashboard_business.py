from typing import Dict, Any
from app.model.dafeiji_model import DafeijiGameRecordModel, DafeijiUserModel, DafeijiLeaderboardModel


class DafeijiDashboardBusiness:
    def __init__(self):
        self.game_record_model = DafeijiGameRecordModel()
        self.user_model = DafeijiUserModel()
        self.leaderboard_model = DafeijiLeaderboardModel()

    def get_overview(self) -> Dict[str, Any]:
        total_users = self.user_model.query.count({'role': 'user'})
        total_games = self.game_record_model.get_total_games()
        total_score = self.game_record_model.get_total_score()
        avg_score = self.game_record_model.get_avg_score()
        total_enemies = self.game_record_model.get_total_enemies_killed()
        total_play_time = self.game_record_model.get_total_play_time()
        max_wave = self.game_record_model.get_max_wave()
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_users': total_users,
                'total_games': total_games,
                'total_score': total_score,
                'avg_score': avg_score,
                'total_enemies_killed': total_enemies,
                'total_play_time': total_play_time,
                'max_wave': max_wave
            }
        }

    def get_daily_stats(self, days: int = 7) -> Dict[str, Any]:
        stats = self.game_record_model.get_daily_stats(days)
        return {'code': 0, 'msg': 'success', 'data': stats}

    def get_popular_aircraft(self) -> Dict[str, Any]:
        stats = self.game_record_model.get_popular_aircraft()
        return {'code': 0, 'msg': 'success', 'data': stats}

    def get_top_players(self, limit: int = 10) -> Dict[str, Any]:
        records = self.leaderboard_model.get_top(limit)
        items = [self.leaderboard_model.to_dict(r) for r in records]
        return {'code': 0, 'msg': 'success', 'data': items}
