import random
from typing import List, Dict, Any, Optional, Tuple
from enum import Enum


class CardSuit(Enum):
    SPADE = '♠'
    HEART = '♥'
    CLUB = '♣'
    DIAMOND = '♦'
    JOKER = '★'


class CardValue(Enum):
    THREE = 3
    FOUR = 4
    FIVE = 5
    SIX = 6
    SEVEN = 7
    EIGHT = 8
    NINE = 9
    TEN = 10
    JACK = 11
    QUEEN = 12
    KING = 13
    ACE = 14
    TWO = 15
    SMALL_JOKER = 16
    BIG_JOKER = 17


class CardType(Enum):
    SINGLE = 'single'
    PAIR = 'pair'
    TRIPLE = 'triple'
    TRIPLE_ONE = 'triple_one'
    TRIPLE_PAIR = 'triple_pair'
    STRAIGHT = 'straight'
    STRAIGHT_PAIR = 'straight_pair'
    STRAIGHT_TRIPLE = 'straight_triple'
    PLANE = 'plane'
    PLANE_SINGLE = 'plane_single'
    PLANE_PAIR = 'plane_pair'
    FOUR_TWO = 'four_two'
    FOUR_TWO_PAIR = 'four_two_pair'
    BOMB = 'bomb'
    ROCKET = 'rocket'
    INVALID = 'invalid'


class Card:
    def __init__(self, suit: CardSuit, value: CardValue):
        self.suit = suit
        self.value = value
        self.id = f"{suit.value}{value.value}"

    def __repr__(self):
        return f"{self.suit.value}{self.display_name()}"

    def __eq__(self, other):
        if isinstance(other, Card):
            return self.id == other.id
        return False

    def __hash__(self):
        return hash(self.id)

    def display_name(self) -> str:
        if self.value == CardValue.SMALL_JOKER:
            return '小王'
        elif self.value == CardValue.BIG_JOKER:
            return '大王'
        elif self.value == CardValue.JACK:
            return 'J'
        elif self.value == CardValue.QUEEN:
            return 'Q'
        elif self.value == CardValue.KING:
            return 'K'
        elif self.value == CardValue.ACE:
            return 'A'
        elif self.value == CardValue.TWO:
            return '2'
        else:
            return str(self.value.value)

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'suit': self.suit.value,
            'value': self.value.value,
            'display_name': self.display_name()
        }


class DoudizhuGame:
    def __init__(self):
        self.deck: List[Card] = []
        self.player_cards: List[Card] = []
        self.ai1_cards: List[Card] = []
        self.ai2_cards: List[Card] = []
        self.bottom_cards: List[Card] = []
        self.landlord: Optional[int] = None
        self.current_turn: int = 0
        self.last_played_cards: List[Card] = []
        self.last_player: Optional[int] = None
        self.pass_count: int = 0
        self.played_cards_history: List[Dict[str, Any]] = []
        self.bomb_count: int = 0
        self.game_over: bool = False
        self.winner: Optional[int] = None
        self.landlord_bid: int = 0
        self.bid_history: List[Dict[str, Any]] = []
        self.base_score: int = 1
        self.current_multiplier: int = 1

    def create_deck(self) -> List[Card]:
        deck = []
        for suit in [CardSuit.SPADE, CardSuit.HEART, CardSuit.CLUB, CardSuit.DIAMOND]:
            for value in CardValue:
                if value in [CardValue.SMALL_JOKER, CardValue.BIG_JOKER]:
                    continue
                deck.append(Card(suit, value))
        deck.append(Card(CardSuit.JOKER, CardValue.SMALL_JOKER))
        deck.append(Card(CardSuit.JOKER, CardValue.BIG_JOKER))
        return deck

    def shuffle_deck(self, deck: List[Card]) -> List[Card]:
        shuffled = deck.copy()
        random.shuffle(shuffled)
        return shuffled

    def deal_cards(self) -> Dict[str, Any]:
        self.deck = self.create_deck()
        self.deck = self.shuffle_deck(self.deck)

        self.player_cards = sorted(self.deck[0:51:3], key=lambda c: c.value.value)
        self.ai1_cards = sorted(self.deck[1:51:3], key=lambda c: c.value.value)
        self.ai2_cards = sorted(self.deck[2:51:3], key=lambda c: c.value.value)
        self.bottom_cards = sorted(self.deck[51:54], key=lambda c: c.value.value)

        self.played_cards_history = []
        self.bomb_count = 0
        self.game_over = False
        self.winner = None
        self.landlord = None
        self.last_played_cards = []
        self.last_player = None
        self.pass_count = 0
        self.landlord_bid = 0
        self.bid_history = []
        self.current_multiplier = 1

        return {
            'player_cards': [c.to_dict() for c in self.player_cards],
            'ai1_card_count': len(self.ai1_cards),
            'ai2_card_count': len(self.ai2_cards),
            'bottom_cards': [c.to_dict() for c in self.bottom_cards]
        }

    def sort_cards(self, cards: List[Card]) -> List[Card]:
        return sorted(cards, key=lambda c: c.value.value)

    def get_card_counts(self, cards: List[Card]) -> Dict[int, int]:
        counts = {}
        for card in cards:
            val = card.value.value
            counts[val] = counts.get(val, 0) + 1
        return counts

    def get_cards_by_value(self, cards: List[Card], value: int) -> List[Card]:
        return [c for c in cards if c.value.value == value]

    def identify_card_type(self, cards: List[Card]) -> Tuple[CardType, int]:
        if not cards:
            return CardType.INVALID, 0

        count_map = self.get_card_counts(cards)
        values = sorted(count_map.keys())
        counts = sorted(count_map.values(), reverse=True)
        card_count = len(cards)

        if card_count == 2 and CardValue.SMALL_JOKER.value in count_map and CardValue.BIG_JOKER.value in count_map:
            return CardType.ROCKET, CardValue.BIG_JOKER.value

        if counts[0] == 4:
            if card_count == 4:
                return CardType.BOMB, values[0]
            elif card_count == 6 and len(values) == 3 and counts[1] == 1 and counts[2] == 1:
                return CardType.FOUR_TWO, values[0]
            elif card_count == 8 and len(values) == 3 and counts[1] == 2 and counts[2] == 2:
                return CardType.FOUR_TWO_PAIR, values[0]

        if counts[0] == 3:
            if card_count == 3:
                return CardType.TRIPLE, values[values.index([v for v in values if count_map[v] == 3][0])]
            elif card_count == 4 and len(values) == 2 and counts[1] == 1:
                main_val = [v for v in values if count_map[v] == 3][0]
                return CardType.TRIPLE_ONE, main_val
            elif card_count == 5 and len(values) == 2 and counts[1] == 2:
                main_val = [v for v in values if count_map[v] == 3][0]
                return CardType.TRIPLE_PAIR, main_val

        if counts[0] == 2 and len(values) >= 3:
            all_pairs = all(c == 2 for c in counts)
            consecutive = all(values[i] + 1 == values[i + 1] for i in range(len(values) - 1))
            if all_pairs and consecutive and max(values) < CardValue.TWO.value:
                return CardType.STRAIGHT_PAIR, max(values)

        if counts[0] == 1 and card_count >= 5:
            consecutive = all(values[i] + 1 == values[i + 1] for i in range(len(values) - 1))
            if consecutive and max(values) < CardValue.TWO.value:
                return CardType.STRAIGHT, max(values)

        if card_count == 1:
            return CardType.SINGLE, values[0]

        if card_count == 2 and counts[0] == 2:
            return CardType.PAIR, values[0]

        triple_vals = [v for v in values if count_map[v] == 3]
        if len(triple_vals) >= 2:
            triple_vals_sorted = sorted(triple_vals)
            consecutive = all(triple_vals_sorted[i] + 1 == triple_vals_sorted[i + 1] for i in range(len(triple_vals_sorted) - 1))
            if consecutive and max(triple_vals_sorted) < CardValue.TWO.value:
                n = len(triple_vals_sorted)
                if card_count == 3 * n:
                    return CardType.STRAIGHT_TRIPLE, max(triple_vals_sorted)
                elif card_count == 4 * n and len(values) == 2 * n:
                    return CardType.PLANE_SINGLE, max(triple_vals_sorted)
                elif card_count == 5 * n and len(values) == 2 * n:
                    return CardType.PLANE_PAIR, max(triple_vals_sorted)

        return CardType.INVALID, 0

    def can_play(self, cards: List[Card], last_cards: List[Card] = None) -> bool:
        if not last_cards:
            card_type, _ = self.identify_card_type(cards)
            return card_type != CardType.INVALID

        last_type, last_main_val = self.identify_card_type(last_cards)
        current_type, current_main_val = self.identify_card_type(cards)

        if current_type == CardType.INVALID or last_type == CardType.INVALID:
            return False

        if current_type == CardType.ROCKET:
            return True

        if current_type == CardType.BOMB and last_type != CardType.BOMB:
            return True

        if current_type == CardType.BOMB and last_type == CardType.BOMB:
            return current_main_val > last_main_val

        if current_type == last_type and len(cards) == len(last_cards):
            return current_main_val > last_main_val

        return False

    def play_cards(self, player_id: int, cards: List[Card]) -> Dict[str, Any]:
        if self.game_over:
            return {'success': False, 'msg': '游戏已结束'}

        if player_id != self.current_turn:
            return {'success': False, 'msg': '不是你的回合'}

        if not cards:
            self.pass_count += 1
            self.played_cards_history.append({
                'player': player_id,
                'cards': [],
                'action': 'pass'
            })
            if self.pass_count >= 2:
                self.last_played_cards = []
                self.last_player = None
                self.pass_count = 0
            self.current_turn = (self.current_turn + 1) % 3
            return {'success': True, 'action': 'pass', 'next_turn': self.current_turn}

        player_cards = self._get_player_cards(player_id)
        for card in cards:
            if card not in player_cards:
                return {'success': False, 'msg': '你没有这些牌'}

        if not self.can_play(cards, self.last_played_cards):
            return {'success': False, 'msg': '无法出这些牌'}

        card_type, main_val = self.identify_card_type(cards)

        for card in cards:
            player_cards.remove(card)

        if player_id == 0:
            self.player_cards = self.sort_cards(player_cards)
        elif player_id == 1:
            self.ai1_cards = self.sort_cards(player_cards)
        else:
            self.ai2_cards = self.sort_cards(player_cards)

        self.last_played_cards = cards
        self.last_player = player_id
        self.pass_count = 0

        if card_type in [CardType.BOMB, CardType.ROCKET]:
            self.bomb_count += 1
            self.current_multiplier *= 2

        self.played_cards_history.append({
            'player': player_id,
            'cards': [c.to_dict() for c in cards],
            'card_type': card_type.value,
            'main_val': main_val,
            'action': 'play'
        })

        if len(player_cards) == 0:
            self.game_over = True
            self.winner = player_id
            return {
                'success': True,
                'action': 'play',
                'game_over': True,
                'winner': player_id,
                'is_landlord_win': (player_id == self.landlord),
                'score': self.calculate_score(player_id),
                'bomb_count': self.bomb_count
            }

        self.current_turn = (self.current_turn + 1) % 3

        return {
            'success': True,
            'action': 'play',
            'card_type': card_type.value,
            'main_val': main_val,
            'next_turn': self.current_turn,
            'player_card_count': len(self._get_player_cards(player_id)),
            'game_over': False
        }

    def _get_player_cards(self, player_id: int) -> List[Card]:
        if player_id == 0:
            return self.player_cards
        elif player_id == 1:
            return self.ai1_cards
        else:
            return self.ai2_cards

    def calculate_score(self, winner: int) -> int:
        base = self.base_score * self.current_multiplier
        if self.landlord is not None and winner == self.landlord:
            return base * 2
        return base

    def bid_landlord(self, player_id: int, bid_score: int) -> Dict[str, Any]:
        if self.landlord is not None:
            return {'success': False, 'msg': '地主已经确定'}

        if bid_score <= self.landlord_bid:
            return {'success': False, 'msg': '叫分必须大于当前叫分'}

        if bid_score > 3:
            return {'success': False, 'msg': '叫分不能超过3'}

        self.landlord_bid = bid_score
        self.bid_history.append({'player': player_id, 'score': bid_score})

        if bid_score == 3:
            self.set_landlord(player_id)
            return {'success': True, 'landlord_set': True, 'landlord': player_id}

        if len(self.bid_history) >= 3 and self.landlord_bid > 0:
            max_bid = max(self.bid_history, key=lambda x: x['score'])
            self.set_landlord(max_bid['player'])
            return {'success': True, 'landlord_set': True, 'landlord': max_bid['player']}

        self.current_turn = (player_id + 1) % 3
        return {'success': True, 'landlord_set': False, 'current_bid': bid_score, 'next_turn': self.current_turn}

    def pass_bid(self, player_id: int) -> Dict[str, Any]:
        if self.landlord is not None:
            return {'success': False, 'msg': '地主已经确定'}

        self.bid_history.append({'player': player_id, 'score': 0})

        if len(self.bid_history) >= 3:
            if self.landlord_bid == 0:
                self.deal_cards()
                return {'success': True, 'landlord_set': False, 'restart': True}
            else:
                max_bid = max(self.bid_history, key=lambda x: x['score'])
                self.set_landlord(max_bid['player'])
                return {'success': True, 'landlord_set': True, 'landlord': max_bid['player']}

        self.current_turn = (player_id + 1) % 3
        return {'success': True, 'landlord_set': False, 'next_turn': self.current_turn}

    def set_landlord(self, player_id: int):
        self.landlord = player_id
        self.current_turn = player_id
        self.current_multiplier = self.landlord_bid

        landlord_cards = self._get_player_cards(player_id)
        landlord_cards.extend(self.bottom_cards)
        landlord_cards = self.sort_cards(landlord_cards)

        if player_id == 0:
            self.player_cards = landlord_cards
        elif player_id == 1:
            self.ai1_cards = landlord_cards
        else:
            self.ai2_cards = landlord_cards

    def ai_play(self, player_id: int, ai_config: Dict[str, Any] = None) -> Dict[str, Any]:
        if self.game_over:
            return {'success': False, 'msg': '游戏已结束'}

        if player_id != self.current_turn:
            return {'success': False, 'msg': '不是AI的回合'}

        ai_cards = self._get_player_cards(player_id)
        ai_config = ai_config or {
            'think_time': 1000,
            'bomb_probability': 0.3,
            'single_probability': 0.5
        }

        playable_cards = self.find_playable_cards(ai_cards, self.last_played_cards)

        if not playable_cards:
            return self.play_cards(player_id, [])

        if not self.last_played_cards:
            best_play = self.choose_best_play(playable_cards, ai_cards, ai_config, is_leader=True)
        else:
            best_play = self.choose_best_play(playable_cards, ai_cards, ai_config, is_leader=False)
            if best_play is None:
                return self.play_cards(player_id, [])

        is_bomb = self.identify_card_type(best_play)[0] in [CardType.BOMB, CardType.ROCKET]
        if is_bomb and random.random() > ai_config.get('bomb_probability', 0.3):
            if len(self.last_played_cards) > 0:
                non_bomb_plays = [c for c in playable_cards if self.identify_card_type(c)[0] not in [CardType.BOMB, CardType.ROCKET]]
                if non_bomb_plays:
                    best_play = non_bomb_plays[0]

        return self.play_cards(player_id, best_play)

    def find_playable_cards(self, cards: List[Card], last_cards: List[Card] = None) -> List[List[Card]]:
        playable = []
        count_map = self.get_card_counts(cards)
        values = sorted(count_map.keys())

        if not last_cards:
            for val in values:
                val_cards = self.get_cards_by_value(cards, val)
                playable.append([val_cards[0]])
                if len(val_cards) >= 2:
                    playable.append(val_cards[:2])
                if len(val_cards) >= 3:
                    playable.append(val_cards[:3])
                    for other_val in values:
                        if other_val != val and count_map[other_val] >= 1:
                            other_cards = self.get_cards_by_value(cards, other_val)
                            playable.append(val_cards[:3] + [other_cards[0]])
                        if other_val != val and count_map[other_val] >= 2:
                            other_cards = self.get_cards_by_value(cards, other_val)
                            playable.append(val_cards[:3] + other_cards[:2])
                if len(val_cards) >= 4:
                    playable.append(val_cards[:4])

            for length in range(5, min(13, len(values) + 1)):
                for start in range(len(values) - length + 1):
                    straight_vals = values[start:start + length]
                    if max(straight_vals) < CardValue.TWO.value and all(straight_vals[i] + 1 == straight_vals[i + 1] for i in range(length - 1)):
                        straight = []
                        for v in straight_vals:
                            straight.append(self.get_cards_by_value(cards, v)[0])
                        playable.append(straight)

            has_small = CardValue.SMALL_JOKER.value in count_map
            has_big = CardValue.BIG_JOKER.value in count_map
            if has_small and has_big:
                playable.append([
                    self.get_cards_by_value(cards, CardValue.SMALL_JOKER.value)[0],
                    self.get_cards_by_value(cards, CardValue.BIG_JOKER.value)[0]
                ])

            return playable

        last_type, last_main_val = self.identify_card_type(last_cards)
        last_len = len(last_cards)

        if last_type == CardType.ROCKET:
            return []

        if last_type == CardType.BOMB:
            for val in values:
                if val > last_main_val and count_map[val] >= 4:
                    playable.append(self.get_cards_by_value(cards, val)[:4])
            has_small = CardValue.SMALL_JOKER.value in count_map
            has_big = CardValue.BIG_JOKER.value in count_map
            if has_small and has_big:
                playable.append([
                    self.get_cards_by_value(cards, CardValue.SMALL_JOKER.value)[0],
                    self.get_cards_by_value(cards, CardValue.BIG_JOKER.value)[0]
                ])
            return playable

        if last_type == CardType.SINGLE:
            for val in values:
                if val > last_main_val:
                    playable.append([self.get_cards_by_value(cards, val)[0]])

        elif last_type == CardType.PAIR:
            for val in values:
                if val > last_main_val and count_map[val] >= 2:
                    playable.append(self.get_cards_by_value(cards, val)[:2])

        elif last_type == CardType.TRIPLE:
            for val in values:
                if val > last_main_val and count_map[val] >= 3:
                    playable.append(self.get_cards_by_value(cards, val)[:3])

        elif last_type == CardType.TRIPLE_ONE:
            for val in values:
                if val > last_main_val and count_map[val] >= 3:
                    triple = self.get_cards_by_value(cards, val)[:3]
                    for other_val in values:
                        if other_val != val and count_map[other_val] >= 1:
                            single = self.get_cards_by_value(cards, other_val)[0]
                            playable.append(triple + [single])

        elif last_type == CardType.TRIPLE_PAIR:
            for val in values:
                if val > last_main_val and count_map[val] >= 3:
                    triple = self.get_cards_by_value(cards, val)[:3]
                    for other_val in values:
                        if other_val != val and count_map[other_val] >= 2:
                            pair = self.get_cards_by_value(cards, other_val)[:2]
                            playable.append(triple + pair)

        elif last_type == CardType.STRAIGHT:
            length = last_len
            for start in range(len(values) - length + 1):
                straight_vals = values[start:start + length]
                if straight_vals[0] > last_main_val and max(straight_vals) < CardValue.TWO.value and all(straight_vals[i] + 1 == straight_vals[i + 1] for i in range(length - 1)):
                    straight = []
                    for v in straight_vals:
                        straight.append(self.get_cards_by_value(cards, v)[0])
                    playable.append(straight)

        elif last_type == CardType.STRAIGHT_PAIR:
            length = last_len // 2
            for start in range(len(values) - length + 1):
                straight_vals = values[start:start + length]
                if straight_vals[0] > last_main_val and max(straight_vals) < CardValue.TWO.value and all(straight_vals[i] + 1 == straight_vals[i + 1] for i in range(length - 1)) and all(count_map[v] >= 2 for v in straight_vals):
                    straight = []
                    for v in straight_vals:
                        straight.extend(self.get_cards_by_value(cards, v)[:2])
                    playable.append(straight)

        elif last_type == CardType.STRAIGHT_TRIPLE:
            length = last_len // 3
            for start in range(len(values) - length + 1):
                straight_vals = values[start:start + length]
                if straight_vals[0] > last_main_val and max(straight_vals) < CardValue.TWO.value and all(straight_vals[i] + 1 == straight_vals[i + 1] for i in range(length - 1)) and all(count_map[v] >= 3 for v in straight_vals):
                    straight = []
                    for v in straight_vals:
                        straight.extend(self.get_cards_by_value(cards, v)[:3])
                    playable.append(straight)

        for val in values:
            if count_map[val] >= 4:
                playable.append(self.get_cards_by_value(cards, val)[:4])
        has_small = CardValue.SMALL_JOKER.value in count_map
        has_big = CardValue.BIG_JOKER.value in count_map
        if has_small and has_big:
            playable.append([
                self.get_cards_by_value(cards, CardValue.SMALL_JOKER.value)[0],
                self.get_cards_by_value(cards, CardValue.BIG_JOKER.value)[0]
            ])

        return playable

    def choose_best_play(self, playable: List[List[Card]], ai_cards: List[Card], ai_config: Dict[str, Any], is_leader: bool) -> Optional[List[Card]]:
        if not playable:
            return None

        def evaluate_play(cards: List[Card]) -> int:
            card_type, main_val = self.identify_card_type(cards)
            score = 0

            if card_type in [CardType.BOMB, CardType.ROCKET]:
                score -= 100

            single_count = sum(1 for c in ai_cards if self.get_card_counts([c]) == 1)
            if card_type == CardType.SINGLE:
                if single_count > len(ai_cards) * 0.3:
                    score += 50

            values = [c.value.value for c in cards]
            if max(values) < CardValue.TWO.value:
                score += 20

            score += main_val

            return score

        if is_leader:
            playable.sort(key=evaluate_play, reverse=True)
        else:
            playable.sort(key=lambda c: self.identify_card_type(c)[1])

        return playable[0] if playable else None

    def ai_bid(self, player_id: int, ai_config: Dict[str, Any] = None) -> Dict[str, Any]:
        if self.landlord is not None:
            return {'success': False, 'msg': '地主已经确定'}

        ai_cards = self._get_player_cards(player_id)
        ai_config = ai_config or {}

        score = self.evaluate_hand_strength(ai_cards)

        current_max = self.landlord_bid
        bid = min(score, 3)

        if bid > current_max:
            return self.bid_landlord(player_id, bid)
        else:
            return self.pass_bid(player_id)

    def evaluate_hand_strength(self, cards: List[Card]) -> int:
        count_map = self.get_card_counts(cards)
        score = 0

        if CardValue.BIG_JOKER.value in count_map:
            score += 1
        if CardValue.SMALL_JOKER.value in count_map:
            score += 1
        if CardValue.TWO.value in count_map:
            score += count_map[CardValue.TWO.value] * 0.5

        for val, count in count_map.items():
            if count == 4:
                score += 1

        straight_count = 0
        values = sorted([v for v in count_map.keys() if v < CardValue.TWO.value])
        for i in range(len(values) - 1):
            if values[i] + 1 == values[i + 1]:
                straight_count += 1

        if straight_count >= 4:
            score += 0.5

        if score >= 4:
            return 3
        elif score >= 3:
            return 2
        elif score >= 2:
            return 1
        else:
            return 0

    def get_game_state(self) -> Dict[str, Any]:
        return {
            'player_cards': [c.to_dict() for c in self.player_cards],
            'ai1_card_count': len(self.ai1_cards),
            'ai2_card_count': len(self.ai2_cards),
            'bottom_cards': [c.to_dict() for c in self.bottom_cards] if self.landlord is not None else [],
            'landlord': self.landlord,
            'current_turn': self.current_turn,
            'last_played_cards': [c.to_dict() for c in self.last_played_cards],
            'last_player': self.last_player,
            'last_card_type': self.identify_card_type(self.last_played_cards)[0].value if self.last_played_cards else None,
            'played_history': self.played_cards_history,
            'bomb_count': self.bomb_count,
            'current_multiplier': self.current_multiplier,
            'landlord_bid': self.landlord_bid,
            'bid_history': self.bid_history,
            'game_over': self.game_over,
            'winner': self.winner,
            'is_spring': self._check_spring()
        }

    def _check_spring(self) -> bool:
        if not self.game_over or self.landlord is None:
            return False

        landlord_plays = [h for h in self.played_cards_history if h['player'] == self.landlord and h.get('action') == 'play']
        peasant_plays = [h for h in self.played_cards_history if h['player'] != self.landlord and h.get('action') == 'play']

        if self.winner == self.landlord and len(peasant_plays) == 0:
            return True
        if self.winner != self.landlord and len(landlord_plays) <= 1:
            return True
        return False
