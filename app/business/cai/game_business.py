from typing import Dict, Any, Optional
from app.model.cai import GameModel, RoomModel, AnimalModel, ScoreModel


class CaiGameBusiness:
    def __init__(self):
        self.game_model = GameModel()
        self.room_model = RoomModel()
        self.animal_model = AnimalModel()
        self.score_model = ScoreModel()

    def create_game(self, room_id: int) -> Dict[str, Any]:
        room = self.room_model.get_by_id(room_id)
        if not room:
            return {
                'code': 1,
                'msg': '房间不存在',
                'data': None
            }

        animal_id = room.get('current_animal_id', 0)
        animal_name = room.get('current_animal_name', '')
        current_drawer = room.get('current_drawer', 1)
        round_num = room.get('round', 1)

        if current_drawer == 1:
            drawer_id = room.get('player1_id', 0)
            drawer_name = room.get('player1_name', '')
            guesser_id = room.get('player2_id', 0)
            guesser_name = room.get('player2_name', '')
        else:
            drawer_id = room.get('player2_id', 0)
            drawer_name = room.get('player2_name', '')
            guesser_id = room.get('player1_id', 0)
            guesser_name = room.get('player1_name', '')

        game_id = self.game_model.create(
            room_id=room_id,
            room_code=room.get('room_code', ''),
            round_num=round_num,
            animal_id=animal_id,
            animal_name=animal_name,
            drawer_id=drawer_id,
            drawer_name=drawer_name,
            guesser_id=guesser_id,
            guesser_name=guesser_name
        )

        if game_id > 0:
            game = self.game_model.get_by_id(game_id)
            return {
                'code': 0,
                'msg': '创建游戏记录成功',
                'data': self.game_model.to_dict(game)
            }

        return {
            'code': 1,
            'msg': '创建游戏记录失败',
            'data': None
        }

    def get_game_by_id(self, game_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {
                'code': 1,
                'msg': '游戏记录不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.game_model.to_dict(game)
        }

    def get_game_by_room_and_round(self, room_id: int, round_num: int) -> Dict[str, Any]:
        game = self.game_model.get_by_room_and_round(room_id, round_num)
        if not game:
            return {
                'code': 1,
                'msg': '游戏记录不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.game_model.to_dict(game)
        }

    def get_games_by_room(self, room_id: int) -> Dict[str, Any]:
        games = self.game_model.get_by_room(room_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': [self.game_model.to_dict(g) for g in games]
        }

    def submit_guess(self, game_id: int, guess_answer: str, time_used: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {
                'code': 1,
                'msg': '游戏记录不存在',
                'data': None
            }

        if game.get('status') == GameModel.STATUS_CORRECT:
            return {
                'code': 1,
                'msg': '该题已答对',
                'data': None
            }

        animal_name = game.get('animal_name', '')
        is_correct = 1 if guess_answer == animal_name else 0

        time_limit = 60
        score_awarded = 0
        if is_correct:
            score_awarded = max(10, int(100 - time_used * 1.5))

        self.game_model.update_guess(game_id, guess_answer, is_correct, score_awarded, time_used)

        room_id = game.get('room_id', 0)
        guesser_id = game.get('guesser_id', 0)
        guesser_name = game.get('guesser_name', '')

        if is_correct:
            current_drawer = 1 if game.get('drawer_id') == game.get('guesser_id') else 2
            guesser_num = 1 if current_drawer == 2 else 2
            self.room_model.add_score(room_id, guesser_num, score_awarded)
            self.score_model.update_guess_stats(guesser_id, guesser_name, True)
        else:
            self.score_model.update_guess_stats(guesser_id, guesser_name, False)

        updated_game = self.game_model.get_by_id(game_id)
        return {
            'code': 0,
            'msg': '答对了！' if is_correct else '答错了，继续加油！',
            'data': {
                'game': self.game_model.to_dict(updated_game),
                'is_correct': is_correct,
                'score_awarded': score_awarded
            }
        }

    def update_drawing(self, game_id: int, drawing_data: str) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {
                'code': 1,
                'msg': '游戏记录不存在',
                'data': None
            }

        affected = self.game_model.update_drawing(game_id, drawing_data)
        if affected >= 0:
            updated_game = self.game_model.get_by_id(game_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.game_model.to_dict(updated_game)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def mark_timeout(self, game_id: int, time_used: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {
                'code': 1,
                'msg': '游戏记录不存在',
                'data': None
            }

        affected = self.game_model.mark_timeout(game_id, time_used)
        if affected >= 0:
            updated_game = self.game_model.get_by_id(game_id)
            return {
                'code': 0,
                'msg': '时间到',
                'data': self.game_model.to_dict(updated_game)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_game(self, game_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {
                'code': 1,
                'msg': '游戏记录不存在',
                'data': None
            }

        affected = self.game_model.delete(game_id)
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
