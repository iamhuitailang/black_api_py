from typing import Dict, Any, Optional
from app.model.danzhu import GameStateModel
from app.business.auth import AuthBusiness


class GameStateBusiness:
    def __init__(self):
        self.state_model = GameStateModel()
        self.auth_business = AuthBusiness()

    def save_state(self, token: str, state_json: str,
                   score: int, combo: int,
                   balls_left: int, highest_combo: int) -> Dict[str, Any]:
        user = self.auth_business.verify_token(token)
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }

        user_id = user.get('id')
        record_id = self.state_model.create(
            user_id=user_id,
            state_json=state_json,
            score=score,
            combo=combo,
            balls_left=balls_left,
            highest_combo=highest_combo
        )

        if record_id > 0:
            return {
                'code': 0,
                'message': '保存成功',
                'data': {'id': record_id}
            }

        return {
            'code': 1,
            'message': '保存失败',
            'data': None
        }

    def get_state(self, token: str) -> Dict[str, Any]:
        user = self.auth_business.verify_token(token)
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }

        state = self.state_model.get_by_user_id(user.get('id'))
        return {
            'code': 0,
            'message': 'success',
            'data': state
        }

    def clear_state(self, token: str) -> Dict[str, Any]:
        user = self.auth_business.verify_token(token)
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }

        self.state_model.delete_by_user_id(user.get('id'))
        return {
            'code': 0,
            'message': '清除成功',
            'data': None
        }
