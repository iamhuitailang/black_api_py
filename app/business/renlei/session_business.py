from typing import Dict, Any, Optional
from app.model.renlei import GameSessionModel


class SessionBusiness:
    def __init__(self):
        self.model = GameSessionModel()

    def create_session(self, user_id: int, level_id: int, character_id: int) -> Dict[str, Any]:
        session_token = self.model.create(user_id, level_id, character_id)
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'session_token': session_token,
                'level_id': level_id,
                'character_id': character_id
            }
        }

    def get_active_session(self, user_id: int) -> Dict[str, Any]:
        session = self.model.get_active_by_user(user_id)
        if not session:
            return {'code': 1, 'message': '没有活跃的游戏会话', 'data': None}
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'session_token': session['session_token'],
                'level_id': session['level_id'],
                'character_id': session['character_id'],
                'game_state': session['game_state'],
                'player_position': session['player_position']
            }
        }

    def get_session(self, session_token: str) -> Dict[str, Any]:
        session = self.model.get_by_token(session_token)
        if not session:
            return {'code': 1, 'message': '游戏会话不存在', 'data': None}
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'session_token': session['session_token'],
                'level_id': session['level_id'],
                'character_id': session['character_id'],
                'game_state': session['game_state'],
                'player_position': session['player_position'],
                'is_active': session['is_active']
            }
        }

    def update_session(self, session_token: str, game_state: dict = None, player_position: dict = None) -> Dict[str, Any]:
        session = self.model.update_state(session_token, game_state, player_position)
        if not session:
            return {'code': 1, 'message': '游戏会话不存在', 'data': None}
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'session_token': session['session_token'],
                'game_state': session['game_state'],
                'player_position': session['player_position']
            }
        }

    def end_session(self, session_token: str) -> Dict[str, Any]:
        session = self.model.end_session(session_token)
        if not session:
            return {'code': 1, 'message': '游戏会话不存在', 'data': None}
        return {'code': 0, 'message': '游戏会话已结束', 'data': None}

    def get_my_sessions(self, user_id: int, limit: int = 10) -> Dict[str, Any]:
        sessions = self.model.get_by_user(user_id, limit)
        return {
            'code': 0,
            'message': 'success',
            'data': [{
                'session_token': s['session_token'],
                'level_id': s['level_id'],
                'character_id': s['character_id'],
                'is_active': s['is_active'],
                'created_at': s['created_at']
            } for s in sessions]
        }
