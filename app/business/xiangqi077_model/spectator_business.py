from typing import Dict, Any
from app.model.xiangqi077_model import XiangqiSpectatorModel, XiangqiGameModel


class XiangqiSpectatorBusiness:
    def __init__(self):
        self.spectator_model = XiangqiSpectatorModel()
        self.game_model = XiangqiGameModel()

    def join_spectate(self, game_id: int, user_id: int, username: str = '', nickname: str = '') -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {'code': 1, 'msg': '对局不存在', 'data': None}
        if game.get('status') != XiangqiGameModel.STATUS_PLAYING:
            return {'code': 1, 'msg': '对局未在进行中', 'data': None}
        if game.get('red_player_id') == user_id or game.get('black_player_id') == user_id:
            return {'code': 1, 'msg': '不能观战自己的对局', 'data': None}
        record_id = self.spectator_model.join_spectate(game_id, user_id, username, nickname)
        return {'code': 0, 'msg': '加入观战成功', 'data': {'id': record_id}}

    def leave_spectate(self, game_id: int, user_id: int) -> Dict[str, Any]:
        self.spectator_model.leave_spectate(game_id, user_id)
        return {'code': 0, 'msg': '离开观战', 'data': None}

    def get_game_spectators(self, game_id: int) -> Dict[str, Any]:
        spectators = self.spectator_model.get_game_spectators(game_id)
        items = [self.spectator_model.to_dict(s) for s in spectators]
        return {'code': 0, 'msg': 'success', 'data': items}

    def get_spectator_count(self, game_id: int) -> Dict[str, Any]:
        count = self.spectator_model.get_spectator_count(game_id)
        return {'code': 0, 'msg': 'success', 'data': {'count': count}}

    def get_spectatable_games(self) -> Dict[str, Any]:
        games = self.game_model.get_active_games()
        result = []
        for g in games:
            game_dict = self.game_model.to_dict(g)
            game_dict['spectator_count'] = self.spectator_model.get_spectator_count(g.get('id'))
            result.append(game_dict)
        return {'code': 0, 'msg': 'success', 'data': result}

    def get_all_spectators(self, page: int = 1, page_size: int = 10, game_id: int = None) -> Dict[str, Any]:
        result = self.spectator_model.get_all(page, page_size, game_id)
        items = [self.spectator_model.to_dict(item) for item in result.get('items', [])]
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }
