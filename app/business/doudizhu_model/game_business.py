from typing import Dict, Any, Optional, List
from app.common.doudizhu_game import DoudizhuGame, Card, CardSuit, CardValue
from app.model.doudizhu_model import UserModel, GameRecordModel, AiConfigModel, AchievementModel, UserAchievementModel
import json
import time


class DoudizhuGameBusiness:
    def __init__(self):
        self.user_model = UserModel()
        self.game_record_model = GameRecordModel()
        self.ai_config_model = AiConfigModel()
        self.achievement_model = AchievementModel()
        self.user_achievement_model = UserAchievementModel()
        self.games: Dict[str, DoudizhuGame] = {}
        self.game_start_time: Dict[str, float] = {}

    def _get_game(self, game_id: str) -> Optional[DoudizhuGame]:
        return self.games.get(game_id)

    def _parse_card_ids(self, card_ids: List[str], game: DoudizhuGame) -> List[Card]:
        all_cards = game.player_cards + game.ai1_cards + game.ai2_cards + game.bottom_cards
        return [c for c in all_cards if c.id in card_ids]

    def create_game(self, user_id: int, ai_difficulty: int = 1) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        if user.get('coins', 0) < 100:
            return {
                'code': 1,
                'msg': '金币不足，需要至少100金币',
                'data': None
            }

        ai_config = self.ai_config_model.get_by_difficulty(ai_difficulty)
        if not ai_config:
            ai_config = self.ai_config_model.get_by_difficulty(1)

        game_id = f"game_{user_id}_{int(time.time())}"
        game = DoudizhuGame()
        deal_result = game.deal_cards()

        self.games[game_id] = game
        self.game_start_time[game_id] = time.time()

        return {
            'code': 0,
            'msg': '游戏创建成功',
            'data': {
                'game_id': game_id,
                **deal_result,
                'ai_difficulty': ai_difficulty,
                'ai_config': self.ai_config_model.to_dict(ai_config) if ai_config else None
            }
        }

    def get_game_state(self, game_id: str) -> Dict[str, Any]:
        game = self._get_game(game_id)
        if not game:
            return {
                'code': 1,
                'msg': '游戏不存在',
                'data': None
            }

        state = game.get_game_state()
        return {
            'code': 0,
            'msg': 'success',
            'data': state
        }

    def player_bid(self, game_id: str, user_id: int, bid_score: int) -> Dict[str, Any]:
        game = self._get_game(game_id)
        if not game:
            return {
                'code': 1,
                'msg': '游戏不存在',
                'data': None
            }

        if game.current_turn != 0:
            return {
                'code': 1,
                'msg': '不是你的叫分回合',
                'data': None
            }

        result = game.bid_landlord(0, bid_score)
        if not result.get('success'):
            return {
                'code': 1,
                'msg': result.get('msg', '叫分失败'),
                'data': None
            }

        if result.get('restart'):
            deal_result = game.deal_cards()
            return {
                'code': 0,
                'msg': '无人叫分，重新发牌',
                'data': {
                    'restart': True,
                    **deal_result
                }
            }

        if result.get('landlord_set'):
            state = game.get_game_state()
            return {
                'code': 0,
                'msg': '地主确定',
                'data': {
                    'landlord_set': True,
                    'landlord': result.get('landlord'),
                    **state
                }
            }

        return {
            'code': 0,
            'msg': '叫分成功',
            'data': result
        }

    def player_pass_bid(self, game_id: str, user_id: int) -> Dict[str, Any]:
        game = self._get_game(game_id)
        if not game:
            return {
                'code': 1,
                'msg': '游戏不存在',
                'data': None
            }

        if game.current_turn != 0:
            return {
                'code': 1,
                'msg': '不是你的叫分回合',
                'data': None
            }

        result = game.pass_bid(0)
        if not result.get('success'):
            return {
                'code': 1,
                'msg': result.get('msg', '操作失败'),
                'data': None
            }

        if result.get('restart'):
            deal_result = game.deal_cards()
            return {
                'code': 0,
                'msg': '无人叫分，重新发牌',
                'data': {
                    'restart': True,
                    **deal_result
                }
            }

        if result.get('landlord_set'):
            state = game.get_game_state()
            return {
                'code': 0,
                'msg': '地主确定',
                'data': {
                    'landlord_set': True,
                    'landlord': result.get('landlord'),
                    **state
                }
            }

        return {
            'code': 0,
            'msg': '不叫成功',
            'data': result
        }

    def ai_bid(self, game_id: str, ai_difficulty: int = 1) -> Dict[str, Any]:
        game = self._get_game(game_id)
        if not game:
            return {
                'code': 1,
                'msg': '游戏不存在',
                'data': None
            }

        if game.landlord is not None:
            return {
                'code': 1,
                'msg': '地主已确定',
                'data': None
            }

        ai_config = self.ai_config_model.get_by_difficulty(ai_difficulty)
        ai_config_dict = self.ai_config_model.to_dict(ai_config) if ai_config else None

        while game.current_turn != 0 and game.landlord is None:
            result = game.ai_bid(game.current_turn, ai_config_dict)
            if result.get('restart'):
                deal_result = game.deal_cards()
                return {
                    'code': 0,
                    'msg': '无人叫分，重新发牌',
                    'data': {
                        'restart': True,
                        **deal_result
                    }
                }
            if result.get('landlord_set'):
                break

        state = game.get_game_state()
        return {
            'code': 0,
            'msg': 'AI叫分完成',
            'data': {
                'landlord_set': game.landlord is not None,
                'landlord': game.landlord,
                **state
            }
        }

    def player_play(self, game_id: str, user_id: int, card_ids: List[str]) -> Dict[str, Any]:
        game = self._get_game(game_id)
        if not game:
            return {
                'code': 1,
                'msg': '游戏不存在',
                'data': None
            }

        if game.current_turn != 0:
            return {
                'code': 1,
                'msg': '不是你的出牌回合',
                'data': None
            }

        if game.landlord is None:
            return {
                'code': 1,
                'msg': '请先叫地主',
                'data': None
            }

        cards = self._parse_card_ids(card_ids, game) if card_ids else []

        result = game.play_cards(0, cards)
        if not result.get('success'):
            return {
                'code': 1,
                'msg': result.get('msg', '出牌失败'),
                'data': None
            }

        if result.get('game_over'):
            game_result = self._handle_game_end(game_id, user_id, game)
            return {
                'code': 0,
                'msg': '游戏结束',
                'data': game_result
            }

        state = game.get_game_state()
        return {
            'code': 0,
            'msg': '出牌成功',
            'data': {
                **result,
                **state
            }
        }

    def ai_play(self, game_id: str, ai_difficulty: int = 1) -> Dict[str, Any]:
        game = self._get_game(game_id)
        if not game:
            return {
                'code': 1,
                'msg': '游戏不存在',
                'data': None
            }

        if game.game_over:
            return {
                'code': 1,
                'msg': '游戏已结束',
                'data': None
            }

        if game.landlord is None:
            return {
                'code': 1,
                'msg': '请先叫地主',
                'data': None
            }

        if game.current_turn == 0:
            return {
                'code': 1,
                'msg': '不是AI的回合',
                'data': None
            }

        ai_config = self.ai_config_model.get_by_difficulty(ai_difficulty)
        ai_config_dict = self.ai_config_model.to_dict(ai_config) if ai_config else None

        while game.current_turn != 0 and not game.game_over:
            result = game.ai_play(game.current_turn, ai_config_dict)
            if not result.get('success'):
                break
            if result.get('game_over'):
                break

        if game.game_over:
            game_result = self._handle_game_end(game_id, None, game)
            return {
                'code': 0,
                'msg': '游戏结束',
                'data': game_result
            }

        state = game.get_game_state()
        return {
            'code': 0,
            'msg': 'AI出牌完成',
            'data': state
        }

    def _handle_game_end(self, game_id: str, user_id: Optional[int], game: DoudizhuGame) -> Dict[str, Any]:
        winner = game.winner
        is_player_win = winner == 0
        is_landlord_win = winner == game.landlord

        base_bet = 100
        score = game.calculate_score(winner)
        coins_change = base_bet * game.current_multiplier

        if is_player_win:
            if winner == game.landlord:
                coins_change = coins_change * 2
            final_coins = coins_change
        else:
            final_coins = -coins_change

        duration = int(time.time() - self.game_start_time.get(game_id, time.time()))

        user_id_final = user_id
        if user_id_final is None:
            for gid, g in self.games.items():
                if g == game:
                    parts = gid.split('_')
                    if len(parts) >= 2:
                        user_id_final = int(parts[1])
                    break

        if user_id_final:
            self.user_model.update_coins(user_id_final, final_coins)
            self.user_model.update_game_result(user_id_final, is_player_win, score)

            play_cards = json.dumps([c.to_dict() for c in game.player_cards])
            played_cards = json.dumps(game.played_cards_history)

            self.game_record_model.create(
                user_id=user_id_final,
                game_type=0,
                ai_difficulty=1,
                role=1 if game.landlord == 0 else 0,
                result=1 if is_player_win else 0,
                score=score,
                coins_change=final_coins,
                bomb_count=game.bomb_count,
                is_spring=1 if game._check_spring() else 0,
                play_cards=play_cards,
                played_cards=played_cards,
                duration=duration
            )

            self._check_achievements(user_id_final, game)

        if game_id in self.games:
            del self.games[game_id]
        if game_id in self.game_start_time:
            del self.game_start_time[game_id]

        state = game.get_game_state()
        return {
            'game_over': True,
            'winner': winner,
            'is_player_win': is_player_win,
            'is_landlord_win': is_landlord_win,
            'score': score,
            'coins_change': final_coins,
            'bomb_count': game.bomb_count,
            'is_spring': game._check_spring(),
            'current_multiplier': game.current_multiplier,
            **state
        }

    def _check_achievements(self, user_id: int, game: DoudizhuGame):
        user = self.user_model.get_by_id(user_id)
        if not user:
            return

        all_achievements = self.achievement_model.query.find_all({'status': 1})

        for achievement in all_achievements:
            ach_id = achievement.get('id')
            ach_type = achievement.get('type')
            condition_value = achievement.get('condition_value')

            if self.user_achievement_model.is_unlocked(user_id, ach_id):
                continue

            unlocked = False

            if ach_type == 0:
                if user.get('win_count', 0) >= condition_value:
                    unlocked = True
            elif ach_type == 1:
                if user.get('level', 1) >= condition_value:
                    unlocked = True
            elif ach_type == 2:
                if user.get('coins', 0) >= condition_value:
                    unlocked = True
            elif ach_type == 3:
                if condition_value == 3 and game.bomb_count >= 3:
                    unlocked = True
                elif condition_value == 1 and game._check_spring():
                    unlocked = True

            if unlocked:
                self.user_achievement_model.create(user_id, ach_id)
                reward_coins = achievement.get('reward_coins', 0)
                if reward_coins > 0:
                    self.user_model.update_coins(user_id, reward_coins)

    def get_played_cards(self, game_id: str) -> Dict[str, Any]:
        game = self._get_game(game_id)
        if not game:
            return {
                'code': 1,
                'msg': '游戏不存在',
                'data': None
            }

        all_played = []
        for record in game.played_cards_history:
            if record.get('action') == 'play':
                all_played.extend(record.get('cards', []))

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'played_cards': all_played,
                'history': game.played_cards_history
            }
        }

    def get_game_history(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.game_record_model.get_by_user_id(user_id, page, page_size)
        items = [self.game_record_model.to_dict(item) for item in result.get('items', [])]

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

    def get_user_stats(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        stats = self.game_record_model.get_user_stats(user_id)
        user_dict = self.user_model.to_public_dict(user)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'user': user_dict,
                'stats': stats
            }
        }
