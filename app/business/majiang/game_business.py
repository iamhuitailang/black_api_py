from typing import Dict, Any, List, Optional, Tuple
import random
from app.model.majiang_model import (
    GameRecordModel, GameStateModel, UserModel, AiModel,
    MahjongGame, MahjongHand, MahjongTile, MahjongWinChecker,
    MahjongFanCalculator, MahjongAI
)


class MajiangGameBusiness:
    def __init__(self):
        self.game_record_model = GameRecordModel()
        self.game_state_model = GameStateModel()
        self.user_model = UserModel()
        self.ai_model = AiModel()

    def create_game(self, user_id: int, difficulty: int = 2, ai_count: int = 3) -> Dict[str, Any]:
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

        ais = self.ai_model.get_by_difficulty(difficulty)
        if len(ais) < ai_count:
            ais = self.ai_model.get_all_active()

        selected_ais = random.sample(ais, min(ai_count, len(ais)))
        ai_ids = [ai.get('id') for ai in selected_ais]

        game_record_id = self.game_record_model.create(user_id, ai_ids, difficulty)

        game = MahjongGame()
        game.shuffle()

        player_hands = {}
        players = ['player'] + [f'ai_{i}' for i in range(len(selected_ais))]

        for player in players:
            hand = MahjongHand()
            for _ in range(13):
                tile = game.draw_tile()
                if tile:
                    hand.add_tile(tile)
            player_hands[player] = hand.to_dict()

        is_ready_map = {p: False for p in players}
        waiting_tiles_map = {p: [] for p in players}

        for player in players:
            hand_dict = player_hands[player]
            hand_obj = MahjongHand.from_dict(hand_dict)
            is_ready, waiting = MahjongWinChecker.is_ready_hand(hand_obj)
            is_ready_map[player] = is_ready
            waiting_tiles_map[player] = [t.to_dict() for t in waiting]

        game_state = {
            'game_record_id': game_record_id,
            'players': players,
            'current_player_index': 0,
            'dealer_index': 0,
            'turn_count': 0,
            'tiles_remaining': game.tiles_remaining(),
            'deck': [t.to_dict() for t in game.tiles],
            'hands': player_hands,
            'discards': [],
            'melds': {p: [] for p in players},
            'is_ready': is_ready_map,
            'waiting_tiles': waiting_tiles_map,
            'last_discard': None,
            'winner': None,
            'game_over': False,
            'difficulty': difficulty
        }

        self.game_state_model.save_state(user_id, game_state, game_record_id)

        return {
            'code': 0,
            'msg': '游戏创建成功',
            'data': {
                'game_record_id': game_record_id,
                'my_hand': player_hands['player'],
                'ai_players': [{'id': ai.get('id'), 'name': ai.get('name'), 'difficulty': ai.get('difficulty')} for ai in selected_ais],
                'tiles_remaining': game.tiles_remaining(),
                'current_player': 'player',
                'is_dealer': True,
                'difficulty': difficulty,
                'is_ready': is_ready_map['player'],
                'waiting_tiles': waiting_tiles_map['player']
            }
        }

    def create_test_game(self, user_id: int, test_type: str = 'ready') -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        ais = self.ai_model.get_by_difficulty(1)
        if len(ais) < 3:
            ais = self.ai_model.get_all_active()

        selected_ais = ais[:3] if len(ais) >= 3 else ais
        ai_ids = [ai.get('id') for ai in selected_ais]

        game_record_id = self.game_record_model.create(user_id, ai_ids, 1)

        game = MahjongGame()
        game.shuffle()

        player_hands = {}
        players = ['player'] + [f'ai_{i}' for i in range(len(selected_ais))]

        for player in players:
            hand = MahjongHand()
            for _ in range(13):
                tile = game.draw_tile()
                if tile:
                    hand.add_tile(tile)
            player_hands[player] = hand.to_dict()

        if test_type == 'ready':
            test_hand = MahjongHand()
            for i in range(1, 10):
                test_hand.add_tile(MahjongTile('wan', i))
            test_hand.add_tile(MahjongTile('tiao', 5))
            test_hand.add_tile(MahjongTile('tiao', 5))
            test_hand.add_tile(MahjongTile('wan', 1))
            test_hand.add_tile(MahjongTile('wan', 1))
            player_hands['player'] = test_hand.to_dict()
        elif test_type == 'winning':
            test_hand = MahjongHand()
            for i in range(1, 10):
                test_hand.add_tile(MahjongTile('wan', i))
            test_hand.add_tile(MahjongTile('tiao', 5))
            test_hand.add_tile(MahjongTile('tiao', 5))
            test_hand.add_tile(MahjongTile('wan', 1))
            test_hand.add_tile(MahjongTile('wan', 1))
            test_hand.add_tile(MahjongTile('wan', 1))
            player_hands['player'] = test_hand.to_dict()
        elif test_type == 'seven_pairs_ready':
            test_hand = MahjongHand()
            for i in range(1, 7):
                test_hand.add_tile(MahjongTile('wan', i))
                test_hand.add_tile(MahjongTile('wan', i))
            test_hand.add_tile(MahjongTile('wan', 7))
            player_hands['player'] = test_hand.to_dict()

        is_ready_map = {p: False for p in players}
        waiting_tiles_map = {p: [] for p in players}

        for player in players:
            hand_dict = player_hands[player]
            hand_obj = MahjongHand.from_dict(hand_dict)
            is_ready, waiting = MahjongWinChecker.is_ready_hand(hand_obj)
            is_ready_map[player] = is_ready
            waiting_tiles_map[player] = [t.to_dict() for t in waiting]

        game_state = {
            'game_record_id': game_record_id,
            'players': players,
            'current_player_index': 0,
            'dealer_index': 0,
            'turn_count': 0,
            'tiles_remaining': game.tiles_remaining(),
            'deck': [t.to_dict() for t in game.tiles],
            'hands': player_hands,
            'discards': [],
            'melds': {p: [] for p in players},
            'is_ready': is_ready_map,
            'waiting_tiles': waiting_tiles_map,
            'last_discard': None,
            'winner': None,
            'game_over': False,
            'difficulty': 1
        }

        self.game_state_model.save_state(user_id, game_state, game_record_id)

        return {
            'code': 0,
            'msg': '测试游戏创建成功',
            'data': {
                'game_record_id': game_record_id,
                'my_hand': player_hands['player'],
                'ai_players': [{'id': ai.get('id'), 'name': ai.get('name'), 'difficulty': ai.get('difficulty')} for ai in selected_ais],
                'tiles_remaining': game.tiles_remaining(),
                'current_player': 'player',
                'is_dealer': True,
                'difficulty': 1,
                'is_ready': is_ready_map['player'],
                'waiting_tiles': waiting_tiles_map['player']
            }
        }

    def get_game_state(self, user_id: int) -> Dict[str, Any]:
        state = self.game_state_model.get_state(user_id)
        if not state:
            return {
                'code': 1,
                'msg': '没有进行中的游戏',
                'data': None
            }

        state_data = state.get('state_data', {})
        player_hand = state_data.get('hands', {}).get('player', {})
        difficulty = state_data.get('difficulty', 2)

        ai_list = self.ai_model.get_by_difficulty(difficulty)
        if not ai_list:
            ai_list = self.ai_model.get_all_active()

        ai_info = []
        for i in range(1, len(state_data.get('players', []))):
            ai_key = f'ai_{i-1}'
            ai_hand = state_data.get('hands', {}).get(ai_key, {})
            ai_data = ai_list[i-1] if len(ai_list) > i-1 else {'name': 'AI对手', 'difficulty': difficulty}
            ai_info.append({
                'id': ai_data.get('id'),
                'name': ai_data.get('name', 'AI对手'),
                'difficulty': ai_data.get('difficulty', difficulty),
                'player_key': ai_key,
                'tile_count': len(ai_hand.get('tiles', [])),
                'melds': ai_hand.get('melds', [])
            })

        player_hand = state_data.get('hands', {}).get('player', {})
        player_tiles = player_hand.get('tiles', [])
        player_melds = player_hand.get('melds', [])
        total_tiles = len(player_tiles) + sum(len(m) for m in player_melds)
        
        can_hu = False
        if total_tiles == 14:
            player_hand_obj = MahjongHand.from_dict(player_hand)
            can_hu = MahjongWinChecker.is_winning_hand(player_hand_obj)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'game_record_id': state.get('game_record_id'),
                'my_hand': player_hand,
                'ai_players': ai_info,
                'discards': state_data.get('discards', []),
                'tiles_remaining': state_data.get('tiles_remaining', 0),
                'current_player': state_data.get('players', [])[state_data.get('current_player_index', 0)] if state_data.get('players') else None,
                'is_my_turn': state_data.get('players', [])[state_data.get('current_player_index', 0)] == 'player' if state_data.get('players') else False,
                'is_ready': state_data.get('is_ready', {}).get('player', False),
                'waiting_tiles': state_data.get('waiting_tiles', {}).get('player', []),
                'last_discard': state_data.get('last_discard'),
                'game_over': state_data.get('game_over', False),
                'winner': state_data.get('winner'),
                'turn_count': state_data.get('turn_count', 0),
                'difficulty': difficulty,
                'can_hu': can_hu
            }
        }

    def draw_tile(self, user_id: int) -> Dict[str, Any]:
        state = self.game_state_model.get_state(user_id)
        if not state:
            return {
                'code': 1,
                'msg': '没有进行中的游戏',
                'data': None
            }

        state_data = state.get('state_data', {})
        if state_data.get('game_over', False):
            return {
                'code': 1,
                'msg': '游戏已结束',
                'data': None
            }

        players = state_data.get('players', [])
        current_index = state_data.get('current_player_index', 0)

        if players[current_index] != 'player':
            return {
                'code': 1,
                'msg': '还没轮到你摸牌',
                'data': None
            }

        deck_dicts = state_data.get('deck', [])
        if not deck_dicts:
            return {
                'code': 1,
                'msg': '牌堆已空，游戏结束',
                'data': None
            }

        tile_dict = deck_dicts.pop()
        tile = MahjongTile.from_dict(tile_dict)

        player_hand_dict = state_data.get('hands', {}).get('player', {})
        player_hand = MahjongHand.from_dict(player_hand_dict)
        player_hand.add_tile(tile)

        is_winning = MahjongWinChecker.is_winning_hand(player_hand)

        temp_hand = MahjongHand.from_dict(player_hand_dict)
        is_ready_before = False
        waiting_before = []
        if temp_hand.get_tile_count() == 13:
            is_ready_before, waiting_before = MahjongWinChecker.is_ready_hand(temp_hand)

        state_data['deck'] = deck_dicts
        state_data['hands']['player'] = player_hand.to_dict()
        state_data['tiles_remaining'] = len(deck_dicts)
        state_data['is_ready']['player'] = is_ready_before
        state_data['waiting_tiles']['player'] = [t.to_dict() for t in waiting_before]

        self.game_state_model.save_state(user_id, state_data, state.get('game_record_id'))

        if is_winning:
            return {
                'code': 0,
                'msg': '可以胡牌了！',
                'data': {
                    'drawn_tile': tile_dict,
                    'my_hand': player_hand.to_dict(),
                    'can_hu': True,
                    'is_ready': is_ready_before,
                    'waiting_tiles': [t.to_dict() for t in waiting_before]
                }
            }

        return {
            'code': 0,
            'msg': '摸牌成功',
            'data': {
                'drawn_tile': tile_dict,
                'my_hand': player_hand.to_dict(),
                'can_hu': False,
                'is_ready': is_ready_before,
                'waiting_tiles': [t.to_dict() for t in waiting_before]
            }
        }

    def discard_tile(self, user_id: int, tile_type: str, value: int) -> Dict[str, Any]:
        state = self.game_state_model.get_state(user_id)
        if not state:
            return {
                'code': 1,
                'msg': '没有进行中的游戏',
                'data': None
            }

        state_data = state.get('state_data', {})
        if state_data.get('game_over', False):
            return {
                'code': 1,
                'msg': '游戏已结束',
                'data': None
            }

        players = state_data.get('players', [])
        current_index = state_data.get('current_player_index', 0)

        if players[current_index] != 'player':
            return {
                'code': 1,
                'msg': '还没轮到你出牌',
                'data': None
            }

        player_hand_dict = state_data.get('hands', {}).get('player', {})
        player_hand = MahjongHand.from_dict(player_hand_dict)

        discard_tile = MahjongTile(tile_type, value)
        if not player_hand.remove_tile(discard_tile):
            return {
                'code': 1,
                'msg': '你没有这张牌',
                'data': None
            }

        state_data['hands']['player'] = player_hand.to_dict()
        state_data['discards'].append(discard_tile.to_dict())
        state_data['last_discard'] = {
            'tile': discard_tile.to_dict(),
            'player': 'player'
        }

        is_ready, waiting_tiles = MahjongWinChecker.is_ready_hand(player_hand)
        state_data['is_ready']['player'] = is_ready
        state_data['waiting_tiles']['player'] = [t.to_dict() for t in waiting_tiles]

        state_data['turn_count'] = state_data.get('turn_count', 0) + 1
        state_data['current_player_index'] = (current_index + 1) % len(players)

        self.game_state_model.save_state(user_id, state_data, state.get('game_record_id'))

        return {
            'code': 0,
            'msg': '出牌成功',
            'data': {
                'my_hand': player_hand.to_dict(),
                'discarded_tile': discard_tile.to_dict(),
                'is_ready': is_ready,
                'waiting_tiles': [t.to_dict() for t in waiting_tiles]
            }
        }

    def ai_play(self, user_id: int) -> Dict[str, Any]:
        state = self.game_state_model.get_state(user_id)
        if not state:
            return {
                'code': 1,
                'msg': '没有进行中的游戏',
                'data': None
            }

        state_data = state.get('state_data', {})
        if state_data.get('game_over', False):
            return {
                'code': 1,
                'msg': '游戏已结束',
                'data': None
            }

        players = state_data.get('players', [])
        current_index = state_data.get('current_player_index', 0)
        difficulty = state_data.get('difficulty', 2)

        if players[current_index] == 'player':
            return {
                'code': 1,
                'msg': '轮到玩家出牌了',
                'data': None
            }

        ai_player = players[current_index]
        ai_hand_dict = state_data.get('hands', {}).get(ai_player, {})
        ai_hand = MahjongHand.from_dict(ai_hand_dict)

        deck_dicts = state_data.get('deck', [])
        if deck_dicts:
            tile_dict = deck_dicts.pop()
            tile = MahjongTile.from_dict(tile_dict)
            ai_hand.add_tile(tile)
            state_data['tiles_remaining'] = len(deck_dicts)

        is_winning = MahjongWinChecker.is_winning_hand(ai_hand)
        if is_winning:
            state_data['game_over'] = True
            state_data['winner'] = ai_player

            self.game_state_model.save_state(user_id, state_data, state.get('game_record_id'))
            self._settle_game(user_id, state_data, ai_player)

            return {
                'code': 0,
                'msg': f'AI胡牌了！',
                'data': {
                    'game_over': True,
                    'winner': ai_player,
                    'winner_type': 'ai'
                }
            }

        ai = MahjongAI(difficulty=difficulty)
        all_discards = [MahjongTile.from_dict(t) for t in state_data.get('discards', [])]
        discard_tile = ai.choose_discard(ai_hand, all_discards)

        ai_hand.remove_tile(discard_tile)
        state_data['hands'][ai_player] = ai_hand.to_dict()
        state_data['discards'].append(discard_tile.to_dict())
        state_data['last_discard'] = {
            'tile': discard_tile.to_dict(),
            'player': ai_player
        }

        is_ready, waiting_tiles = MahjongWinChecker.is_ready_hand(ai_hand)
        state_data['is_ready'][ai_player] = is_ready
        state_data['waiting_tiles'][ai_player] = [t.to_dict() for t in waiting_tiles]

        state_data['turn_count'] = state_data.get('turn_count', 0) + 1
        state_data['current_player_index'] = (current_index + 1) % len(players)

        if not deck_dicts:
            state_data['game_over'] = True
            state_data['winner'] = None
            self._settle_game(user_id, state_data, None)

        self.game_state_model.save_state(user_id, state_data, state.get('game_record_id'))

        return {
            'code': 0,
            'msg': 'AI出牌完成',
            'data': {
                'ai_player': ai_player,
                'discarded_tile': discard_tile.to_dict(),
                'game_over': state_data.get('game_over', False),
                'next_player': players[state_data.get('current_player_index', 0)]
            }
        }

    def hu(self, user_id: int) -> Dict[str, Any]:
        state = self.game_state_model.get_state(user_id)
        if not state:
            return {
                'code': 1,
                'msg': '没有进行中的游戏',
                'data': None
            }

        state_data = state.get('state_data', {})
        if state_data.get('game_over', False):
            return {
                'code': 1,
                'msg': '游戏已结束',
                'data': None
            }

        player_hand_dict = state_data.get('hands', {}).get('player', {})
        player_hand = MahjongHand.from_dict(player_hand_dict)

        if not MahjongWinChecker.is_winning_hand(player_hand):
            return {
                'code': 1,
                'msg': '还不能胡牌',
                'data': None
            }

        is_dealer = state_data.get('dealer_index', 0) == 0
        total_tiles = len(player_hand.tiles) + sum(len(m) for m in player_hand.melds)
        is_self_draw = total_tiles == 14

        winning_tile = player_hand.tiles[-1] if player_hand.tiles else None
        if not winning_tile:
            return {
                'code': 1,
                'msg': '没有胡牌',
                'data': None
            }

        is_tian_hu = is_dealer and state_data.get('turn_count', 0) <= 1
        is_di_hu = not is_dealer and state_data.get('turn_count', 0) <= len(state_data.get('players', []))

        fan, fan_details = MahjongFanCalculator.calculate_fan(
            player_hand, winning_tile,
            is_self_draw=is_self_draw,
            is_dealer=is_dealer,
            is_tian_hu=is_tian_hu,
            is_di_hu=is_di_hu
        )

        state_data['game_over'] = True
        state_data['winner'] = 'player'

        coins_win = fan * 50 + 100

        scores = {
            'player': {'fan': fan, 'coins': coins_win, 'win': True},
        }
        for i in range(1, len(state_data.get('players', []))):
            scores[f'ai_{i-1}'] = {'fan': 0, 'coins': -coins_win // 3, 'win': False}

        self.game_state_model.save_state(user_id, state_data, state.get('game_record_id'))

        self.game_record_model.update_game_result(
            state.get('game_record_id'),
            'player', 'user', fan, fan_details, scores, coins_win
        )

        self.user_model.update_game_result(user_id, True, fan, coins_win)

        return {
            'code': 0,
            'msg': '恭喜胡牌！',
            'data': {
                'game_over': True,
                'winner': 'player',
                'winner_type': 'user',
                'fan': fan,
                'fan_details': fan_details,
                'coins_win': coins_win,
                'is_self_draw': is_self_draw,
                'is_dealer': is_dealer
            }
        }

    def _settle_game(self, user_id: int, state_data: Dict[str, Any], winner: str = None):
        game_record_id = state_data.get('game_record_id')
        difficulty = state_data.get('difficulty', 2)

        if winner and winner.startswith('ai_'):
            coins_lose = difficulty * 100
            self.user_model.update_game_result(user_id, False, 0, -coins_lose)

            self.game_record_model.update_game_result(
                game_record_id,
                winner, 'ai', 0, [],
                {'player': {'fan': 0, 'coins': -coins_lose, 'win': False}},
                -coins_lose
            )
        elif winner is None:
            self.game_record_model.update_game_result(
                game_record_id,
                '', 'draw', 0, [], {}, 0
            )

    def cancel_game(self, user_id: int) -> Dict[str, Any]:
        state = self.game_state_model.get_state(user_id)
        if not state:
            return {
                'code': 1,
                'msg': '没有进行中的游戏',
                'data': None
            }

        game_record_id = state.get('game_record_id')
        if game_record_id:
            self.game_record_model.cancel_game(game_record_id)

        self.game_state_model.clear_state(user_id)

        return {
            'code': 0,
            'msg': '游戏已取消',
            'data': None
        }

    def get_game_history(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.game_record_model.get_user_games(user_id, page, page_size, status=1)
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def check_ready(self, user_id: int) -> Dict[str, Any]:
        state = self.game_state_model.get_state(user_id)
        if not state:
            return {
                'code': 1,
                'msg': '没有进行中的游戏',
                'data': None
            }

        state_data = state.get('state_data', {})
        player_hand_dict = state_data.get('hands', {}).get('player', {})
        player_hand = MahjongHand.from_dict(player_hand_dict)

        is_ready, waiting_tiles = MahjongWinChecker.is_ready_hand(player_hand)
        waiting_tile_dicts = [t.to_dict() for t in waiting_tiles]

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'is_ready': is_ready,
                'waiting_tiles': waiting_tile_dicts,
                'waiting_count': len(waiting_tiles)
            }
        }

    def calculate_fan(self, hand_data: Dict[str, Any], winning_tile_data: Dict[str, Any],
                      is_self_draw: bool = False, is_dealer: bool = False) -> Dict[str, Any]:
        hand = MahjongHand.from_dict(hand_data)
        winning_tile = MahjongTile.from_dict(winning_tile_data)

        fan, fan_details = MahjongFanCalculator.calculate_fan(
            hand, winning_tile, is_self_draw, is_dealer
        )

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'fan': fan,
                'fan_details': fan_details
            }
        }
