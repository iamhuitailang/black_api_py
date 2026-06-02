from typing import Dict, Any
from app.model.dafuweng import UserModel, GameModel, GamePlayerModel, PlayerItemModel


class StatsBusiness:
    def __init__(self):
        self.user_model = UserModel()
        self.game_model = GameModel()
        self.game_player_model = GamePlayerModel()
        self.player_item_model = PlayerItemModel()

    def get_dashboard_stats(self) -> Dict[str, Any]:
        all_users = self.user_model.get_all(1, 1)
        total_users = all_users.get('total', 0)

        all_games = self.game_model.get_all(1, 1)
        total_games = all_games.get('total', 0)

        active_games = self.game_model.get_all(1, 1, status=self.game_model.STATUS_PLAYING)
        active_games_count = active_games.get('total', 0)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_users': total_users,
                'total_games': total_games,
                'active_games': active_games_count,
                'total_items_sold': 0
            }
        }

    def get_user_stats(self) -> Dict[str, Any]:
        total_result = self.user_model.get_all(1, 1)
        total_users = total_result.get('total', 0)

        active_result = self.user_model.get_all(1, 1, status=self.user_model.STATUS_ACTIVE)
        active_users = active_result.get('total', 0)

        banned_result = self.user_model.get_all(1, 1, status=self.user_model.STATUS_BANNED)
        banned_users = banned_result.get('total', 0)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_users': total_users,
                'active_users': active_users,
                'banned_users': banned_users
            }
        }

    def get_game_stats(self) -> Dict[str, Any]:
        total_result = self.game_model.get_all(1, 1)
        total_games = total_result.get('total', 0)

        waiting_result = self.game_model.get_all(1, 1, status=self.game_model.STATUS_WAITING)
        waiting_games = waiting_result.get('total', 0)

        playing_result = self.game_model.get_all(1, 1, status=self.game_model.STATUS_PLAYING)
        playing_games = playing_result.get('total', 0)

        finished_result = self.game_model.get_all(1, 1, status=self.game_model.STATUS_FINISHED)
        finished_games = finished_result.get('total', 0)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_games': total_games,
                'waiting_games': waiting_games,
                'playing_games': playing_games,
                'finished_games': finished_games
            }
        }
