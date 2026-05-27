from typing import Dict, Any, Optional
from app.model.cai import ScoreModel, RoomModel


class CaiScoreBusiness:
    def __init__(self):
        self.score_model = ScoreModel()
        self.room_model = RoomModel()

    def get_score_by_player_id(self, player_id: int) -> Dict[str, Any]:
        score = self.score_model.get_by_player_id(player_id)
        if not score:
            return {
                'code': 1,
                'msg': '玩家数据不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.score_model.to_dict(score)
        }

    def get_or_create_score(self, player_id: int, player_name: str) -> Dict[str, Any]:
        score = self.score_model.get_or_create(player_id, player_name)
        return {
            'code': 0,
            'msg': 'success',
            'data': self.score_model.to_dict(score)
        }

    def update_game_result(self, room_id: int) -> Dict[str, Any]:
        room = self.room_model.get_by_id(room_id)
        if not room:
            return {
                'code': 1,
                'msg': '房间不存在',
                'data': None
            }

        player1_id = room.get('player1_id', 0)
        player1_name = room.get('player1_name', '')
        player1_score = room.get('player1_score', 0)

        player2_id = room.get('player2_id', 0)
        player2_name = room.get('player2_name', '')
        player2_score = room.get('player2_score', 0)

        player1_won = None
        player2_won = None

        if player1_score > player2_score:
            player1_won = True
            player2_won = False
        elif player2_score > player1_score:
            player1_won = False
            player2_won = True

        self.score_model.update_score(player1_id, player1_name, player1_score, player1_won)
        self.score_model.update_score(player2_id, player2_name, player2_score, player2_won)

        score1 = self.score_model.get_by_player_id(player1_id)
        score2 = self.score_model.get_by_player_id(player2_id)

        return {
            'code': 0,
            'msg': '成绩更新成功',
            'data': {
                'player1': self.score_model.to_dict(score1) if score1 else None,
                'player2': self.score_model.to_dict(score2) if score2 else None
            }
        }

    def get_leaderboard(self, limit: int = 10) -> Dict[str, Any]:
        scores = self.score_model.get_leaderboard(limit)
        return {
            'code': 0,
            'msg': 'success',
            'data': [self.score_model.to_dict(s) for s in scores]
        }

    def get_score_list(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.score_model.get_list(page, page_size)
        items = [self.score_model.to_dict(item) for item in result.get('items', [])]

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

    def delete_score(self, score_id: int) -> Dict[str, Any]:
        affected = self.score_model.delete(score_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '删除成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '删除失败',
            'data': None
        }
