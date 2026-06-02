from typing import Dict, Any
from app.model.dafeiji_model import DafeijiGameStateModel, DafeijiGameRecordModel, DafeijiLeaderboardModel, DafeijiUserModel


class DafeijiGameBusiness:
    def __init__(self):
        self.game_state_model = DafeijiGameStateModel()
        self.game_record_model = DafeijiGameRecordModel()
        self.leaderboard_model = DafeijiLeaderboardModel()
        self.user_model = DafeijiUserModel()

    def save_state(self, user_id: int, state_data: Dict[str, Any]) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}
        self.game_state_model.save_state(user_id, state_data)
        state = self.game_state_model.get_state(user_id)
        return {'code': 0, 'msg': '保存成功', 'data': self.game_state_model.to_dict(state) if state else None}

    def load_state(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}
        state = self.game_state_model.get_state(user_id)
        if state:
            return {'code': 0, 'msg': 'success', 'data': self.game_state_model.to_dict(state)}
        return {'code': 0, 'msg': '无存档', 'data': None}

    def submit_score(self, user_id: int, game_data: Dict[str, Any]) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}
        score = game_data.get('score', 0)
        wave = game_data.get('wave', 1)
        aircraft_id = game_data.get('aircraft_id', 1)
        enemies_killed = game_data.get('enemies_killed', 0)
        items_collected = game_data.get('items_collected', 0)
        play_time = game_data.get('play_time', 0)
        self.game_record_model.create({
            'user_id': user_id,
            'score': score,
            'wave': wave,
            'aircraft_id': aircraft_id,
            'enemies_killed': enemies_killed,
            'items_collected': items_collected,
            'play_time': play_time
        })
        self.leaderboard_model.add_record(
            user_id=user_id, score=score, wave=wave,
            aircraft_id=aircraft_id, enemies_killed=enemies_killed,
            play_time=play_time
        )
        self.user_model.update_score(user_id, score)
        self.user_model.increment_games_played(user_id)
        self.game_state_model.clear_state(user_id)
        rank = self.leaderboard_model.get_user_rank(user_id)
        return {
            'code': 0,
            'msg': '提交成功',
            'data': {
                'score': score,
                'rank': rank
            }
        }

    def get_game_records(self, user_id: int, limit: int = 20) -> Dict[str, Any]:
        records = self.game_record_model.get_user_records(user_id, limit)
        return {
            'code': 0,
            'msg': 'success',
            'data': [self.game_record_model.to_dict(r) for r in records]
        }
