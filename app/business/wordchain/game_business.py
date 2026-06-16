from typing import Dict, Any, Optional, List
from app.model.wordchain import WordModel, GameModel, GameRoundModel, UserStatsModel
from app.model.auth import UserModel


class GameBusiness:
    def __init__(self):
        self.word_model = WordModel()
        self.game_model = GameModel()
        self.game_round_model = GameRoundModel()
        self.user_stats_model = UserStatsModel()
        self.user_model = UserModel()
        self.time_limit = 15

    def register(self, username: str, password: str) -> Dict[str, Any]:
        if not username or not username.strip():
            return {
                'code': 1,
                'message': '用户名不能为空',
                'data': None
            }
        
        if len(username.strip()) < 2 or len(username.strip()) > 20:
            return {
                'code': 1,
                'message': '用户名长度必须在2-20个字符之间',
                'data': None
            }
        
        if not password or len(password) < 6:
            return {
                'code': 1,
                'message': '密码长度至少6位',
                'data': None
            }
        
        existing = self.user_model.get_by_username(username.strip())
        if existing:
            return {
                'code': 1,
                'message': '用户名已存在',
                'data': None
            }
        
        user_id = self.user_model.create_user(username.strip(), password)
        if user_id > 0:
            return {
                'code': 0,
                'message': '注册成功',
                'data': {
                    'user_id': user_id,
                    'username': username.strip()
                }
            }
        
        return {
            'code': 1,
            'message': '注册失败',
            'data': None
        }

    def start_game(self, user_id: int) -> Dict[str, Any]:
        start_word = self.word_model.get_random_start_word()
        if not start_word:
            return {
                'code': 1,
                'message': '词库为空，请先初始化词库',
                'data': None
            }
        
        game_id = self.game_model.create_game(
            user_id=user_id,
            start_word=start_word['word'],
            time_limit=self.time_limit
        )
        
        if game_id <= 0:
            return {
                'code': 1,
                'message': '创建游戏失败',
                'data': None
            }
        
        self.game_round_model.add_round(
            game_id=game_id,
            user_id=user_id,
            round_number=1,
            source='system',
            word=start_word['word'],
            first_char=start_word['first_char'],
            last_char=start_word['last_char'],
            score=0,
            result='success'
        )
        
        return {
            'code': 0,
            'message': '游戏开始',
            'data': {
                'game_id': game_id,
                'start_word': start_word['word'],
                'current_last_char': start_word['last_char'],
                'time_limit': self.time_limit,
                'score': 0,
                'round': 1,
                'winning_streak': 0
            }
        }

    def submit_word(self, user_id: int, game_id: int, word: str) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {
                'code': 1,
                'message': '游戏不存在',
                'data': None
            }
        
        if game.get('user_id') != user_id:
            return {
                'code': 1,
                'message': '无权操作此游戏',
                'data': None
            }
        
        if game.get('status') != 'playing':
            return {
                'code': 1,
                'message': '游戏已结束',
                'data': None
            }
        
        if not word or not word.strip():
            return {
                'code': 1,
                'message': '词语不能为空',
                'data': None
            }
        
        word = word.strip()
        required_first_char = game.get('current_last_char')
        
        used_words = self.game_round_model.get_game_words(game_id)
        if word in used_words:
            self._record_failed_round(game_id, user_id, game, word, '词语已使用过')
            return self._finish_game(game_id, user_id, game, word, '词语已使用过')
        
        validation = self.word_model.validate_word(word, required_first_char)
        if not validation.get('valid'):
            self._record_failed_round(game_id, user_id, game, word, validation.get('message', '词语不合法'))
            return self._finish_game(game_id, user_id, game, word, validation.get('message', '词语不合法'))
        
        word_info = validation.get('word')
        length = word_info.get('length', 2) if word_info else len(word)
        
        if length == 2:
            base_score = 10
        elif length == 3:
            base_score = 20
        else:
            base_score = 35
        
        current_streak = game.get('winning_streak', 0)
        new_streak = current_streak + 1
        is_streak_bonus = new_streak >= 5
        final_score = base_score * 2 if is_streak_bonus else base_score
        
        round_number = game.get('round_count', 1) + 1
        
        first_char = word_info.get('first_char') if word_info else word[0]
        last_char = word_info.get('last_char') if word_info else word[-1]
        
        self.game_round_model.add_round(
            game_id=game_id,
            user_id=user_id,
            round_number=round_number,
            source='player',
            word=word,
            first_char=first_char,
            last_char=last_char,
            score=final_score,
            result='success'
        )
        
        game_update = self.game_model.add_score(game_id, final_score, is_streak_bonus)
        new_score = game_update.get('new_score', 0) if game_update else game.get('score', 0) + final_score
        new_last_char = last_char
        
        if not self.word_model.has_continuation(new_last_char, game_id):
            return self._finish_game(game_id, user_id, game, word, '没有可以接龙的词了，恭喜通关！', is_win=True)
        
        return {
            'code': 0,
            'message': '接龙成功',
            'data': {
                'game_id': game_id,
                'word': word,
                'score': final_score,
                'total_score': new_score,
                'base_score': base_score,
                'is_streak_bonus': is_streak_bonus,
                'winning_streak': new_streak,
                'next_required_char': new_last_char,
                'round': round_number,
                'length': length
            }
        }

    def _record_failed_round(self, game_id: int, user_id: int, game: Dict, word: str, reason: str):
        round_number = game.get('round_count', 1) + 1
        first_char = word[0] if word else ''
        last_char = word[-1] if word else ''
        
        self.game_round_model.add_round(
            game_id=game_id,
            user_id=user_id,
            round_number=round_number,
            source='player',
            word=word,
            first_char=first_char,
            last_char=last_char,
            score=0,
            result='failed'
        )

    def _finish_game(self, game_id: int, user_id: int, game: Dict, word: str, reason: str, is_win: bool = False) -> Dict[str, Any]:
        final_game = self.game_model.finish_game(game_id, 'finished' if is_win else 'failed')
        final_score = final_game.get('score', 0)
        round_count = final_game.get('round_count', 0)
        max_streak = final_game.get('winning_streak', 0)
        
        rounds = self.game_round_model.get_game_rounds(game_id)
        player_words = [r for r in rounds if r.get('source') == 'player' and r.get('result') == 'success']
        
        self.user_stats_model.update_after_game(
            user_id=user_id,
            score=final_score,
            rounds=round_count,
            max_streak=max_streak,
            is_win=is_win,
            words_count=len(player_words)
        )
        
        return {
            'code': 0,
            'message': reason,
            'data': {
                'game_id': game_id,
                'game_over': True,
                'is_win': is_win,
                'final_score': final_score,
                'round_count': round_count,
                'max_streak': max_streak,
                'words_count': len(player_words)
            }
        }

    def get_game_history(self, game_id: int, user_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {
                'code': 1,
                'message': '游戏不存在',
                'data': None
            }
        
        if game.get('user_id') != user_id:
            return {
                'code': 1,
                'message': '无权查看此游戏',
                'data': None
            }
        
        rounds = self.game_round_model.get_game_rounds(game_id)
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'game': game,
                'rounds': rounds
            }
        }

    def get_user_stats(self, user_id: int) -> Dict[str, Any]:
        stats = self.user_stats_model.get_user_stats(user_id)
        first_char_stats = self.game_round_model.get_user_first_char_stats(user_id, limit=15)
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'stats': stats,
                'first_char_stats': first_char_stats
            }
        }

    def timeout(self, user_id: int, game_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {
                'code': 1,
                'message': '游戏不存在',
                'data': None
            }
        
        if game.get('user_id') != user_id:
            return {
                'code': 1,
                'message': '无权操作此游戏',
                'data': None
            }
        
        if game.get('status') != 'playing':
            return {
                'code': 1,
                'message': '游戏已结束',
                'data': None
            }
        
        return self._finish_game(game_id, user_id, game, '', '时间到！', is_win=False)
