from typing import Dict, Any, Optional
from app.model.xiangqi077_model import (
    XiangqiGameModel, XiangqiGameMoveModel, XiangqiGameStateModel,
    XiangqiUserModel, XiangqiLeaderboardModel
)
from datetime import datetime


class XiangqiGameBusiness:
    def __init__(self):
        self.game_model = XiangqiGameModel()
        self.move_model = XiangqiGameMoveModel()
        self.state_model = XiangqiGameStateModel()
        self.user_model = XiangqiUserModel()
        self.leaderboard_model = XiangqiLeaderboardModel()

    def create_pve_game(self, user_id: int, ai_level: int = 1, play_color: str = 'red') -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}
        init_fen = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR'
        if play_color == 'black':
            game_id = self.game_model.create(
                game_type=XiangqiGameModel.TYPE_PVE,
                red_player_id=0,
                black_player_id=user_id,
                ai_level=ai_level,
                fen=init_fen
            )
        else:
            game_id = self.game_model.create(
                game_type=XiangqiGameModel.TYPE_PVE,
                red_player_id=user_id,
                black_player_id=0,
                ai_level=ai_level,
                fen=init_fen
            )
        if game_id > 0:
            self.state_model.save_state(game_id, init_fen, 'red', 0)
            game = self.game_model.get_by_id(game_id)
            return {'code': 0, 'msg': '创建对局成功', 'data': self.game_model.to_dict(game)}
        return {'code': 1, 'msg': '创建对局失败', 'data': None}

    def create_pvp_game(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}
        init_fen = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR'
        game_id = self.game_model.create(
            game_type=XiangqiGameModel.TYPE_PVP,
            red_player_id=user_id,
            fen=init_fen
        )
        if game_id > 0:
            self.state_model.save_state(game_id, init_fen, 'red', 0)
            game = self.game_model.get_by_id(game_id)
            return {'code': 0, 'msg': '创建对局成功，等待对手加入', 'data': self.game_model.to_dict(game)}
        return {'code': 1, 'msg': '创建对局失败', 'data': None}

    def join_pvp_game(self, game_id: int, user_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {'code': 1, 'msg': '对局不存在', 'data': None}
        if game.get('status') != XiangqiGameModel.STATUS_WAITING:
            return {'code': 1, 'msg': '对局已开始或已结束', 'data': None}
        if game.get('red_player_id') == user_id:
            return {'code': 1, 'msg': '不能加入自己的对局', 'data': None}
        self.game_model.join_game(game_id, user_id)
        game = self.game_model.get_by_id(game_id)
        return {'code': 0, 'msg': '加入对局成功', 'data': self.game_model.to_dict(game)}

    def get_game(self, game_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {'code': 1, 'msg': '对局不存在', 'data': None}
        state = self.state_model.get_state(game_id)
        game_dict = self.game_model.to_dict(game)
        if state:
            game_dict['state'] = state
        return {'code': 0, 'msg': 'success', 'data': game_dict}

    def make_move(self, game_id: int, user_id: int, piece: str,
                  from_pos: str, to_pos: str, fen_after: str) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {'code': 1, 'msg': '对局不存在', 'data': None}
        if game.get('status') != XiangqiGameModel.STATUS_PLAYING:
            return {'code': 1, 'msg': '对局未在进行中', 'data': None}
        state = self.state_model.get_state(game_id)
        if not state:
            return {'code': 1, 'msg': '对局状态不存在', 'data': None}
        current_turn = state.get('current_turn', 'red')
        is_red = game.get('red_player_id') == user_id
        is_black = game.get('black_player_id') == user_id
        if current_turn == 'red' and not is_red:
            return {'code': 1, 'msg': '不是你的回合', 'data': None}
        if current_turn == 'black' and not is_black:
            return {'code': 1, 'msg': '不是你的回合', 'data': None}
        move_count = state.get('move_count', 0) + 1
        next_turn = 'black' if current_turn == 'red' else 'red'
        self.move_model.create(game_id, move_count, current_turn, piece, from_pos, to_pos, fen_after)
        self.game_model.update_fen(game_id, fen_after, next_turn, move_count)
        self.state_model.save_state(
            game_id, fen_after, next_turn, move_count,
            last_move_from=from_pos, last_move_to=to_pos
        )
        self.state_model.clear_undo_request(game_id)
        self.state_model.clear_draw_request(game_id)
        return {'code': 0, 'msg': '走棋成功', 'data': {
            'move_count': move_count,
            'current_turn': next_turn,
            'fen': fen_after
        }}

    def request_undo(self, game_id: int, user_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {'code': 1, 'msg': '对局不存在', 'data': None}
        if game.get('status') != XiangqiGameModel.STATUS_PLAYING:
            return {'code': 1, 'msg': '对局未在进行中', 'data': None}
        is_red = game.get('red_player_id') == user_id
        requester = 'red' if is_red else 'black'
        state = self.state_model.get_state(game_id)
        if state and state.get('undo_requested'):
            return {'code': 1, 'msg': '已有悔棋请求待处理', 'data': None}
        self.state_model.set_undo_request(game_id, requester)
        return {'code': 0, 'msg': '悔棋请求已发送', 'data': {'requester': requester}}

    def accept_undo(self, game_id: int, user_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {'code': 1, 'msg': '对局不存在', 'data': None}
        state = self.state_model.get_state(game_id)
        if not state or not state.get('undo_requested'):
            return {'code': 1, 'msg': '没有待处理的悔棋请求', 'data': None}
        is_red = game.get('red_player_id') == user_id
        accepter = 'red' if is_red else 'black'
        if accepter == state.get('undo_requester'):
            return {'code': 1, 'msg': '不能同意自己的悔棋请求', 'data': None}
        last_move = self.move_model.get_last_move(game_id)
        if last_move:
            self.move_model.mark_undo(last_move.get('id'))
            prev_fen = last_move.get('fen_after', '')
            move_count = state.get('move_count', 0) - 1
            prev_turn = 'red' if last_move.get('player') == 'black' else 'black'
            self.game_model.update_fen(game_id, prev_fen, prev_turn, move_count)
            self.state_model.save_state(game_id, prev_fen, prev_turn, move_count)
        self.state_model.clear_undo_request(game_id)
        return {'code': 0, 'msg': '悔棋成功', 'data': None}

    def reject_undo(self, game_id: int, user_id: int) -> Dict[str, Any]:
        self.state_model.clear_undo_request(game_id)
        return {'code': 0, 'msg': '已拒绝悔棋', 'data': None}

    def request_draw(self, game_id: int, user_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {'code': 1, 'msg': '对局不存在', 'data': None}
        if game.get('status') != XiangqiGameModel.STATUS_PLAYING:
            return {'code': 1, 'msg': '对局未在进行中', 'data': None}
        is_red = game.get('red_player_id') == user_id
        requester = 'red' if is_red else 'black'
        state = self.state_model.get_state(game_id)
        if state and state.get('draw_requested'):
            return {'code': 1, 'msg': '已有求和请求待处理', 'data': None}
        self.state_model.set_draw_request(game_id, requester)
        return {'code': 0, 'msg': '求和请求已发送', 'data': {'requester': requester}}

    def accept_draw(self, game_id: int, user_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {'code': 1, 'msg': '对局不存在', 'data': None}
        state = self.state_model.get_state(game_id)
        if not state or not state.get('draw_requested'):
            return {'code': 1, 'msg': '没有待处理的求和请求', 'data': None}
        is_red = game.get('red_player_id') == user_id
        accepter = 'red' if is_red else 'black'
        if accepter == state.get('draw_requester'):
            return {'code': 1, 'msg': '不能同意自己的求和请求', 'data': None}
        self.game_model.finish_game(game_id, XiangqiGameModel.RESULT_DRAW)
        self._update_scores(game, 'draw')
        self.state_model.clear_draw_request(game_id)
        return {'code': 0, 'msg': '和棋', 'data': None}

    def reject_draw(self, game_id: int, user_id: int) -> Dict[str, Any]:
        self.state_model.clear_draw_request(game_id)
        return {'code': 0, 'msg': '已拒绝求和', 'data': None}

    def resign(self, game_id: int, user_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {'code': 1, 'msg': '对局不存在', 'data': None}
        if game.get('status') != XiangqiGameModel.STATUS_PLAYING:
            return {'code': 1, 'msg': '对局未在进行中', 'data': None}
        is_red = game.get('red_player_id') == user_id
        result = XiangqiGameModel.RESULT_BLACK_WIN if is_red else XiangqiGameModel.RESULT_RED_WIN
        self.game_model.finish_game(game_id, result)
        self._update_scores(game, 'red_win' if result == XiangqiGameModel.RESULT_RED_WIN else 'black_win')
        return {'code': 0, 'msg': '认输成功', 'data': {'result': result}}

    def finish_game_result(self, game_id: int, result: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {'code': 1, 'msg': '对局不存在', 'data': None}
        self.game_model.finish_game(game_id, result)
        if result == XiangqiGameModel.RESULT_RED_WIN:
            self._update_scores(game, 'red_win')
        elif result == XiangqiGameModel.RESULT_BLACK_WIN:
            self._update_scores(game, 'black_win')
        elif result == XiangqiGameModel.RESULT_DRAW:
            self._update_scores(game, 'draw')
        return {'code': 0, 'msg': '对局已结束', 'data': None}

    def _update_scores(self, game: Dict[str, Any], outcome: str):
        red_id = game.get('red_player_id')
        black_id = game.get('black_player_id')
        if outcome == 'red_win':
            if red_id and red_id > 0:
                self.user_model.increment_wins(red_id)
                self.user_model.update_score(red_id, 30)
                red_user = self.user_model.get_by_id(red_id)
                if red_user:
                    self.leaderboard_model.upsert_user_score(
                        red_id, red_user.get('nickname', ''), 30, win_delta=1)
            if black_id and black_id > 0:
                self.user_model.increment_losses(black_id)
                self.user_model.update_score(black_id, -20)
                black_user = self.user_model.get_by_id(black_id)
                if black_user:
                    self.leaderboard_model.upsert_user_score(
                        black_id, black_user.get('nickname', ''), -20, loss_delta=1)
        elif outcome == 'black_win':
            if black_id and black_id > 0:
                self.user_model.increment_wins(black_id)
                self.user_model.update_score(black_id, 30)
                black_user = self.user_model.get_by_id(black_id)
                if black_user:
                    self.leaderboard_model.upsert_user_score(
                        black_id, black_user.get('nickname', ''), 30, win_delta=1)
            if red_id and red_id > 0:
                self.user_model.increment_losses(red_id)
                self.user_model.update_score(red_id, -20)
                red_user = self.user_model.get_by_id(red_id)
                if red_user:
                    self.leaderboard_model.upsert_user_score(
                        red_id, red_user.get('nickname', ''), -20, loss_delta=1)
        elif outcome == 'draw':
            if red_id and red_id > 0:
                self.user_model.increment_draws(red_id)
                self.user_model.update_score(red_id, 5)
                red_user = self.user_model.get_by_id(red_id)
                if red_user:
                    self.leaderboard_model.upsert_user_score(
                        red_id, red_user.get('nickname', ''), 5, draw_delta=1)
            if black_id and black_id > 0:
                self.user_model.increment_draws(black_id)
                self.user_model.update_score(black_id, 5)
                black_user = self.user_model.get_by_id(black_id)
                if black_user:
                    self.leaderboard_model.upsert_user_score(
                        black_id, black_user.get('nickname', ''), 5, draw_delta=1)

    def get_game_moves(self, game_id: int) -> Dict[str, Any]:
        moves = self.move_model.get_game_moves(game_id)
        return {'code': 0, 'msg': 'success', 'data': moves}

    def get_game_state(self, game_id: int) -> Dict[str, Any]:
        state = self.state_model.get_state(game_id)
        if not state:
            return {'code': 1, 'msg': '对局状态不存在', 'data': None}
        return {'code': 0, 'msg': 'success', 'data': state}

    def get_waiting_games(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.game_model.get_waiting_games(page, page_size)
        items = [self.game_model.to_dict(item) for item in result.get('items', [])]
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

    def get_user_games(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.game_model.get_user_games(user_id, page, page_size)
        items = [self.game_model.to_dict(item) for item in result.get('items', [])]
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

    def get_active_games(self) -> Dict[str, Any]:
        games = self.game_model.get_active_games()
        items = [self.game_model.to_dict(g) for g in games]
        return {'code': 0, 'msg': 'success', 'data': items}

    def get_all_games(self, page: int = 1, page_size: int = 10,
                      game_type: int = None, status: int = None) -> Dict[str, Any]:
        result = self.game_model.get_all(page, page_size, game_type, status)
        items = [self.game_model.to_dict(item) for item in result.get('items', [])]
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
