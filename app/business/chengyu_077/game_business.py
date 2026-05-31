from typing import Dict, Any, Optional
from app.model.chengyu_077.game import GameModel
from app.model.chengyu_077.score import ScoreModel
from app.model.chengyu_077.idiom import IdiomModel
from app.model.chengyu_077.user import ChengyuUserModel
from app.model.chengyu_077.achievement import AchievementModel
from app.model.chengyu_077.user_achievement import UserAchievementModel
from app.business.chengyu_077.achievement_business import AchievementBusiness


class GameBusiness:
    def __init__(self):
        self.game_model = GameModel()
        self.score_model = ScoreModel()
        self.idiom_model = IdiomModel()
        self.user_model = ChengyuUserModel()
        self.achievement_business = AchievementBusiness()

    def start_game(self, user_id: int, game_type: str = 'classic', mode: str = 'single', time_limit: int = 60) -> Dict[str, Any]:
        active = self.game_model.get_active_game(user_id)
        if active:
            self._end_game_internal(
                active.get('id'), user_id,
                active.get('score', 0),
                active.get('max_combo', 0),
                active.get('game_type', 'classic'),
                won=False
            )

        random_idiom = self.idiom_model.get_random(1)
        if not random_idiom:
            return {'code': 1, 'message': '成语库为空，无法开始游戏', 'data': None}

        start_idiom = random_idiom[0]
        game_id = self.game_model.create(user_id, game_type, mode, time_limit)
        self.game_model.update_state(game_id, start_idiom['word'], 0, 0, 0)
        game = self.game_model.get_by_id(game_id)

        return {
            'code': 0,
            'message': '游戏开始',
            'data': {
                'id': game.get('id'),
                'game_type': game.get('game_type'),
                'mode': game.get('mode'),
                'status': game.get('status'),
                'current_idiom': game.get('current_idiom'),
                'score': game.get('score', 0),
                'combo': game.get('combo', 0),
                'max_combo': game.get('max_combo', 0),
                'time_limit': game.get('time_limit', 60)
            }
        }

    def play_turn(self, user_id: int, game_id: int, idiom: str) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {'code': 1, 'message': '游戏不存在', 'data': None}
        if game.get('status') != 'playing':
            return {'code': 1, 'message': '游戏已结束', 'data': None}
        if game.get('user_id') != user_id:
            return {'code': 1, 'message': '不是您的游戏', 'data': None}

        idiom = idiom.strip()
        if not idiom:
            return {'code': 1, 'message': '请输入成语', 'data': None}

        last_char = game.get('current_idiom', '')[-1] if game.get('current_idiom') else ''
        if last_char and idiom[0] != last_char:
            new_combo = 0
            new_score = game.get('score', 0)
            new_max_combo = game.get('max_combo', 0)
            self.game_model.update_state(game_id, game.get('current_idiom'), new_score, new_combo, new_max_combo)
            if game.get('mode') == 'battle':
                self._end_game_internal(game_id, user_id, new_score, new_combo, game.get('game_type', 'classic'), won=False)
                return {
                    'code': 0,
                    'message': f'接龙失败！成语"{idiom}"不以"{last_char}"开头，对手获胜！',
                    'data': {
                        'success': False,
                        'game_over': True,
                        'score': new_score,
                        'combo': new_combo,
                        'current_idiom': game.get('current_idiom'),
                        'next_idiom': None,
                        'message': f'接龙失败！成语"{idiom}"不以"{last_char}"开头，对手获胜！'
                    }
                }
            return {
                'code': 0,
                'message': f'接龙失败！成语"{idiom}"不以"{last_char}"开头',
                'data': {
                    'success': False,
                    'game_over': False,
                    'score': new_score,
                    'combo': new_combo,
                    'current_idiom': game.get('current_idiom'),
                    'next_idiom': game.get('current_idiom'),
                    'message': f'接龙失败！成语"{idiom}"不以"{last_char}"开头'
                }
            }

        idiom_record = self.idiom_model.get_by_word(idiom)
        if not idiom_record:
            new_combo = 0
            new_score = game.get('score', 0)
            new_max_combo = game.get('max_combo', 0)
            self.game_model.update_state(game_id, game.get('current_idiom'), new_score, new_combo, new_max_combo)
            if game.get('mode') == 'battle':
                self._end_game_internal(game_id, user_id, new_score, new_combo, game.get('game_type', 'classic'), won=False)
                return {
                    'code': 0,
                    'message': f'成语"{idiom}"不在成语库中，对手获胜！',
                    'data': {
                        'success': False,
                        'game_over': True,
                        'score': new_score,
                        'combo': new_combo,
                        'current_idiom': game.get('current_idiom'),
                        'next_idiom': None,
                        'message': f'成语"{idiom}"不在成语库中，对手获胜！'
                    }
                }
            return {
                'code': 0,
                'message': f'成语"{idiom}"不在成语库中',
                'data': {
                    'success': False,
                    'game_over': False,
                    'score': new_score,
                    'combo': new_combo,
                    'current_idiom': game.get('current_idiom'),
                    'next_idiom': game.get('current_idiom'),
                    'message': f'成语"{idiom}"不在成语库中'
                }
            }

        new_combo = game.get('combo', 0) + 1
        combo_bonus = min(new_combo, 5)
        turn_score = 10 + combo_bonus * 5
        new_score = game.get('score', 0) + turn_score
        new_max_combo = max(game.get('max_combo', 0), new_combo)

        self.idiom_model.increment_usage(idiom_record.get('id'))

        next_char = idiom[-1]
        next_idioms = self.idiom_model.find_by_first_char(next_char, limit=10)

        if not next_idioms:
            self._end_game_internal(game_id, user_id, new_score, new_combo, game.get('game_type', 'classic'), won=True)
            return {
                'code': 0,
                'message': f'恭喜！你赢了！无人能接上"{next_char}"开头的成语',
                'data': {
                    'success': True,
                    'game_over': True,
                    'score': new_score,
                    'combo': new_combo,
                    'current_idiom': idiom,
                    'next_idiom': None,
                    'message': f'恭喜！你赢了！无人能接上"{next_char}"开头的成语'
                }
            }

        if game.get('mode') == 'battle':
            self.game_model.update_state(game_id, idiom, new_score, new_combo, new_max_combo)
            return {
                'code': 0,
                'message': f'接龙成功！+{turn_score}分，请交给对手继续',
                'data': {
                    'success': True,
                    'game_over': False,
                    'score': new_score,
                    'combo': new_combo,
                    'current_idiom': idiom,
                    'next_idiom': idiom,
                    'message': f'接龙成功！+{turn_score}分，请交给对手继续'
                }
            }

        import random
        ai_idiom = random.choice(next_idioms)
        self.idiom_model.increment_usage(ai_idiom.get('id'))

        ai_next_char = ai_idiom['word'][-1]
        user_can_continue = self.idiom_model.find_by_first_char(ai_next_char, limit=1)

        if not user_can_continue:
            self.game_model.update_state(game_id, ai_idiom['word'], new_score, new_combo, new_max_combo)
            self._end_game_internal(game_id, user_id, new_score, new_combo, game.get('game_type', 'classic'), won=False)
            return {
                'code': 0,
                'message': f'游戏结束！你无法接上"{ai_next_char}"开头的成语',
                'data': {
                    'success': True,
                    'game_over': True,
                    'score': new_score,
                    'combo': new_combo,
                    'current_idiom': ai_idiom['word'],
                    'next_idiom': None,
                    'message': f'游戏结束！你无法接上"{ai_next_char}"开头的成语'
                }
            }

        self.game_model.update_state(game_id, ai_idiom['word'], new_score, new_combo, new_max_combo)

        return {
            'code': 0,
            'message': f'接龙成功！+{turn_score}分',
            'data': {
                'success': True,
                'game_over': False,
                'score': new_score,
                'combo': new_combo,
                'current_idiom': ai_idiom['word'],
                'next_idiom': ai_idiom['word'],
                'message': f'接龙成功！+{turn_score}分'
            }
        }

    def _end_game_internal(self, game_id: int, user_id: int, score: int, combo: int, game_type: str, won: bool):
        self.game_model.end_game(game_id)
        is_win = 1 if won else 0
        self.score_model.create(user_id, game_id, game_type, score, is_win, combo)
        win_add = 1 if won else 0
        self.user_model.update_stats(user_id, score_add=score, game_add=1, win_add=win_add)
        self.achievement_business.check_and_unlock(user_id, score, combo, won)

    def end_game(self, user_id: int, game_id: int, won: bool = False) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {'code': 1, 'message': '游戏不存在', 'data': None}
        if game.get('status') != 'playing':
            return {'code': 1, 'message': '游戏已结束', 'data': None}
        if game.get('user_id') != user_id:
            return {'code': 1, 'message': '不是您的游戏', 'data': None}

        self._end_game_internal(
            game_id, user_id,
            game.get('score', 0),
            game.get('max_combo', 0),
            game.get('game_type', 'classic'),
            won
        )
        return {'code': 0, 'message': '游戏已结束', 'data': {'score': game.get('score', 0)}}

    def get_my_scores(self, user_id: int) -> Dict[str, Any]:
        scores = self.score_model.get_by_user(user_id)
        return {'code': 0, 'message': 'success', 'data': scores}

    def get_leaderboard(self, game_type: str = None, limit: int = 100) -> Dict[str, Any]:
        leaderboard = self.score_model.get_leaderboard(game_type, limit)
        return {'code': 0, 'message': 'success', 'data': leaderboard}
