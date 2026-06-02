from typing import Dict, Any, List, Optional, Tuple
from collections import Counter
import random


class MahjongTile:
    TILE_TYPES = {
        'wan': {'name': '万', 'count': 9, 'start': 1},
        'tiao': {'name': '条', 'count': 9, 'start': 1},
        'tong': {'name': '筒', 'count': 9, 'start': 1},
        'feng': {'name': '风', 'count': 4, 'start': 1, 'names': ['东', '南', '西', '北']},
        'jian': {'name': '箭', 'count': 3, 'start': 1, 'names': ['中', '发', '白']}
    }

    def __init__(self, tile_type: str, value: int):
        self.tile_type = tile_type
        self.value = value

    def __str__(self) -> str:
        type_info = self.TILE_TYPES.get(self.tile_type, {})
        if self.tile_type == 'feng':
            return f"{type_info.get('names', [])[self.value - 1]}"
        elif self.tile_type == 'jian':
            return f"{type_info.get('names', [])[self.value - 1]}"
        else:
            return f"{self.value}{type_info.get('name', '')}"

    def __repr__(self) -> str:
        return self.__str__()

    def __eq__(self, other) -> bool:
        if not isinstance(other, MahjongTile):
            return False
        return self.tile_type == other.tile_type and self.value == other.value

    def __hash__(self) -> int:
        return hash((self.tile_type, self.value))

    def to_dict(self) -> Dict[str, Any]:
        return {
            'type': self.tile_type,
            'tile_type': self.tile_type,
            'value': self.value,
            'display': str(self)
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'MahjongTile':
        return cls(data['tile_type'], data['value'])


class MahjongGame:
    def __init__(self):
        self.tiles: List[MahjongTile] = []
        self._init_tiles()

    def _init_tiles(self):
        self.tiles = []
        for tile_type, info in MahjongTile.TILE_TYPES.items():
            for value in range(info['start'], info['start'] + info['count']):
                for _ in range(4):
                    self.tiles.append(MahjongTile(tile_type, value))

    def shuffle(self):
        random.shuffle(self.tiles)

    def draw_tile(self) -> Optional[MahjongTile]:
        if self.tiles:
            return self.tiles.pop()
        return None

    def tiles_remaining(self) -> int:
        return len(self.tiles)


class MahjongHand:
    def __init__(self, tiles: List[MahjongTile] = None):
        self.tiles: List[MahjongTile] = tiles or []
        self.melds: List[List[MahjongTile]] = []
        self.winning_tile: Optional[MahjongTile] = None

    def add_tile(self, tile: MahjongTile):
        self.tiles.append(tile)
        self.sort()

    def remove_tile(self, tile: MahjongTile) -> bool:
        for t in self.tiles:
            if t == tile:
                self.tiles.remove(t)
                return True
        return False

    def sort(self):
        type_order = {'wan': 0, 'tiao': 1, 'tong': 2, 'feng': 3, 'jian': 4}
        self.tiles.sort(key=lambda t: (type_order.get(t.tile_type, 99), t.value))

    def get_tile_count(self) -> int:
        return len(self.tiles) + sum(len(meld) for meld in self.melds)

    def to_dict(self) -> Dict[str, Any]:
        return {
            'tiles': [t.to_dict() for t in self.tiles],
            'melds': [[t.to_dict() for t in meld] for meld in self.melds],
            'winning_tile': self.winning_tile.to_dict() if self.winning_tile else None
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'MahjongHand':
        hand = cls()
        hand.tiles = [MahjongTile.from_dict(t) for t in data.get('tiles', [])]
        hand.melds = [[MahjongTile.from_dict(t) for t in meld] for meld in data.get('melds', [])]
        if data.get('winning_tile'):
            hand.winning_tile = MahjongTile.from_dict(data['winning_tile'])
        return hand


class MahjongWinChecker:
    @staticmethod
    def is_winning_hand(hand: MahjongHand, winning_tile: MahjongTile = None) -> bool:
        tiles = list(hand.tiles)
        if winning_tile:
            tiles.append(winning_tile)

        total_tiles = len(tiles) + sum(len(meld) for meld in hand.melds)
        if total_tiles != 14:
            return False

        all_tiles = tiles + [t for meld in hand.melds for t in meld]
        tile_counts = Counter(all_tiles)

        pair_candidates = [tile for tile, count in tile_counts.items() if count >= 2]

        for pair in pair_candidates:
            remaining_counts = tile_counts.copy()
            remaining_counts[pair] -= 2
            if remaining_counts[pair] == 0:
                del remaining_counts[pair]

            if MahjongWinChecker._can_form_melds(remaining_counts):
                return True

        return False

    @staticmethod
    def _can_form_melds(tile_counts: Counter) -> bool:
        if not tile_counts:
            return True

        tile = next(iter(tile_counts.keys()))

        if tile_counts[tile] >= 3:
            new_counts = tile_counts.copy()
            new_counts[tile] -= 3
            if new_counts[tile] == 0:
                del new_counts[tile]
            if MahjongWinChecker._can_form_melds(new_counts):
                return True

        if tile.tile_type in ['wan', 'tiao', 'tong']:
            tile1 = MahjongTile(tile.tile_type, tile.value + 1)
            tile2 = MahjongTile(tile.tile_type, tile.value + 2)

            if tile1 in tile_counts and tile2 in tile_counts:
                new_counts = tile_counts.copy()
                for t in [tile, tile1, tile2]:
                    new_counts[t] -= 1
                    if new_counts[t] == 0:
                        del new_counts[t]
                if MahjongWinChecker._can_form_melds(new_counts):
                    return True

        return False

    @staticmethod
    def is_ready_hand(hand: MahjongHand) -> Tuple[bool, List[MahjongTile]]:
        if len(hand.tiles) + sum(len(meld) for meld in hand.melds) != 13:
            return False, []

        waiting_tiles = []
        for tile_type, info in MahjongTile.TILE_TYPES.items():
            for value in range(info['start'], info['start'] + info['count']):
                test_tile = MahjongTile(tile_type, value)
                if MahjongWinChecker.is_winning_hand(hand, test_tile):
                    waiting_tiles.append(test_tile)

        return len(waiting_tiles) > 0, waiting_tiles


class MahjongFanCalculator:
    FAN_PATTERNS = [
        {'name': '天胡', 'fan': 13, 'check': 'check_tian_hu'},
        {'name': '地胡', 'fan': 10, 'check': 'check_di_hu'},
        {'name': '十三幺', 'fan': 13, 'check': 'check_shisan_yao'},
        {'name': '九莲宝灯', 'fan': 13, 'check': 'check_jiulian_baodeng'},
        {'name': '大四喜', 'fan': 10, 'check': 'check_da_sixi'},
        {'name': '大三元', 'fan': 8, 'check': 'check_da_sanyuan'},
        {'name': '小四喜', 'fan': 6, 'check': 'check_xiao_sixi'},
        {'name': '小三元', 'fan': 6, 'check': 'check_xiao_sanyuan'},
        {'name': '清一色', 'fan': 6, 'check': 'check_qingyise'},
        {'name': '字一色', 'fan': 6, 'check': 'check_ziyise'},
        {'name': '对对胡', 'fan': 4, 'check': 'check_duidui_hu'},
        {'name': '七对子', 'fan': 4, 'check': 'check_qiduizi'},
        {'name': '混一色', 'fan': 3, 'check': 'check_hunyise'},
        {'name': '一条龙', 'fan': 3, 'check': 'check_yitiaolong'},
        {'name': '断幺九', 'fan': 2, 'check': 'check_duan_yaojiu'},
        {'name': '平胡', 'fan': 1, 'check': 'check_ping_hu'},
    ]

    @staticmethod
    def calculate_fan(hand: MahjongHand, winning_tile: MahjongTile,
                      is_self_draw: bool = False, is_dealer: bool = False,
                      is_tian_hu: bool = False, is_di_hu: bool = False) -> Tuple[int, List[Dict[str, Any]]]:
        if not MahjongWinChecker.is_winning_hand(hand, winning_tile):
            return 0, []

        total_fan = 0
        fan_details = []

        all_tiles = hand.tiles + [winning_tile] + [t for meld in hand.melds for t in meld]

        if is_tian_hu:
            total_fan += 13
            fan_details.append({'name': '天胡', 'fan': 13})

        if is_di_hu and not is_tian_hu:
            total_fan += 10
            fan_details.append({'name': '地胡', 'fan': 10})

        if MahjongFanCalculator.check_shisan_yao(all_tiles):
            total_fan += 13
            fan_details.append({'name': '十三幺', 'fan': 13})
            return total_fan, fan_details

        if MahjongFanCalculator.check_jiulian_baodeng(all_tiles):
            total_fan += 13
            fan_details.append({'name': '九莲宝灯', 'fan': 13})
            return total_fan, fan_details

        if MahjongFanCalculator.check_da_sixi(hand.melds):
            total_fan += 10
            fan_details.append({'name': '大四喜', 'fan': 10})

        if MahjongFanCalculator.check_da_sanyuan(hand.melds):
            total_fan += 8
            fan_details.append({'name': '大三元', 'fan': 8})

        if MahjongFanCalculator.check_xiao_sixi(hand.melds):
            total_fan += 6
            fan_details.append({'name': '小四喜', 'fan': 6})

        if MahjongFanCalculator.check_xiao_sanyuan(hand.melds):
            total_fan += 6
            fan_details.append({'name': '小三元', 'fan': 6})

        if MahjongFanCalculator.check_qingyise(all_tiles):
            total_fan += 6
            fan_details.append({'name': '清一色', 'fan': 6})

        if MahjongFanCalculator.check_ziyise(all_tiles):
            total_fan += 6
            fan_details.append({'name': '字一色', 'fan': 6})

        if MahjongFanCalculator.check_duidui_hu(all_tiles, hand.melds):
            total_fan += 4
            fan_details.append({'name': '对对胡', 'fan': 4})

        if MahjongFanCalculator.check_qiduizi(all_tiles):
            total_fan += 4
            fan_details.append({'name': '七对子', 'fan': 4})

        if MahjongFanCalculator.check_hunyise(all_tiles):
            total_fan += 3
            fan_details.append({'name': '混一色', 'fan': 3})

        if MahjongFanCalculator.check_yitiaolong(all_tiles):
            total_fan += 3
            fan_details.append({'name': '一条龙', 'fan': 3})

        if MahjongFanCalculator.check_duan_yaojiu(all_tiles):
            total_fan += 2
            fan_details.append({'name': '断幺九', 'fan': 2})

        if is_self_draw:
            total_fan += 1
            fan_details.append({'name': '自摸', 'fan': 1})

        if is_dealer:
            total_fan += 1
            fan_details.append({'name': '庄家', 'fan': 1})

        if total_fan == 0:
            total_fan = 1
            fan_details.append({'name': '平胡', 'fan': 1})

        return total_fan, fan_details

    @staticmethod
    def check_shisan_yao(tiles: List[MahjongTile]) -> bool:
        if len(tiles) != 14:
            return False

        yao_tiles = set()
        for t in ['wan', 'tiao', 'tong']:
            yao_tiles.add(MahjongTile(t, 1))
            yao_tiles.add(MahjongTile(t, 9))
        for i in range(1, 5):
            yao_tiles.add(MahjongTile('feng', i))
        for i in range(1, 4):
            yao_tiles.add(MahjongTile('jian', i))

        tile_set = set(tiles)
        if len(tile_set) != 13:
            return False

        for yao in yao_tiles:
            if yao not in tile_set:
                return False

        count = Counter(tiles)
        pair_count = sum(1 for c in count.values() if c == 2)
        return pair_count == 1

    @staticmethod
    def check_jiulian_baodeng(tiles: List[MahjongTile]) -> bool:
        if len(tiles) != 14:
            return False

        types = set(t.tile_type for t in tiles)
        if len(types) != 1:
            return False

        tile_type = next(iter(types))
        if tile_type not in ['wan', 'tiao', 'tong']:
            return False

        count = Counter(t.value for t in tiles)
        if count.get(1, 0) < 3 or count.get(9, 0) < 3:
            return False

        for i in range(2, 9):
            if count.get(i, 0) < 1:
                return False

        return True

    @staticmethod
    def check_da_sixi(melds: List[List[MahjongTile]]) -> bool:
        feng_melds = [meld for meld in melds if all(t.tile_type == 'feng' for t in meld)]
        feng_values = set()
        for meld in feng_melds:
            if len(meld) == 3 or len(meld) == 4:
                feng_values.add(meld[0].value)
        return len(feng_values) >= 4

    @staticmethod
    def check_da_sanyuan(melds: List[List[MahjongTile]]) -> bool:
        jian_melds = [meld for meld in melds if all(t.tile_type == 'jian' for t in meld)]
        jian_values = set()
        for meld in jian_melds:
            if len(meld) == 3 or len(meld) == 4:
                jian_values.add(meld[0].value)
        return len(jian_values) >= 3

    @staticmethod
    def check_xiao_sixi(melds: List[List[MahjongTile]]) -> bool:
        feng_melds = [meld for meld in melds if all(t.tile_type == 'feng' for t in meld)]
        feng_values = set()
        for meld in feng_melds:
            if len(meld) == 3 or len(meld) == 4:
                feng_values.add(meld[0].value)
        return len(feng_values) >= 3

    @staticmethod
    def check_xiao_sanyuan(melds: List[List[MahjongTile]]) -> bool:
        jian_melds = [meld for meld in melds if all(t.tile_type == 'jian' for t in meld)]
        jian_values = set()
        for meld in jian_melds:
            if len(meld) == 3 or len(meld) == 4:
                jian_values.add(meld[0].value)
        return len(jian_values) >= 2

    @staticmethod
    def check_qingyise(tiles: List[MahjongTile]) -> bool:
        types = set(t.tile_type for t in tiles)
        return len(types) == 1 and next(iter(types)) in ['wan', 'tiao', 'tong']

    @staticmethod
    def check_ziyise(tiles: List[MahjongTile]) -> bool:
        types = set(t.tile_type for t in tiles)
        return all(t in ['feng', 'jian'] for t in types)

    @staticmethod
    def check_duidui_hu(tiles: List[MahjongTile], melds: List[List[MahjongTile]]) -> bool:
        all_melds = melds.copy()
        count = Counter(tiles)
        pairs = [t for t, c in count.items() if c == 2]
        triplets = [t for t, c in count.items() if c >= 3]

        if len(pairs) != 1:
            return False

        for t in triplets:
            all_melds.append([t, t, t])

        return all(len(meld) == 3 or len(meld) == 4 for meld in all_melds)

    @staticmethod
    def check_qiduizi(tiles: List[MahjongTile]) -> bool:
        if len(tiles) != 14:
            return False

        count = Counter(tiles)
        return all(c == 2 for c in count.values()) and len(count) == 7

    @staticmethod
    def check_hunyise(tiles: List[MahjongTile]) -> bool:
        types = set(t.tile_type for t in tiles)
        has_number = any(t in ['wan', 'tiao', 'tong'] for t in types)
        has_honor = any(t in ['feng', 'jian'] for t in types)
        number_types = set(t for t in types if t in ['wan', 'tiao', 'tong'])
        return has_number and has_honor and len(number_types) == 1

    @staticmethod
    def check_yitiaolong(tiles: List[MahjongTile]) -> bool:
        count = Counter((t.tile_type, t.value) for t in tiles)

        for tile_type in ['wan', 'tiao', 'tong']:
            has_all = all((tile_type, i) in count for i in range(1, 10))
            if has_all:
                return True
        return False

    @staticmethod
    def check_duan_yaojiu(tiles: List[MahjongTile]) -> bool:
        for t in tiles:
            if t.tile_type in ['feng', 'jian']:
                return False
            if t.value == 1 or t.value == 9:
                return False
        return True

    @staticmethod
    def check_ping_hu(tiles: List[MahjongTile], melds: List[List[MahjongTile]]) -> bool:
        return True


class MahjongAI:
    def __init__(self, difficulty: int = 2, risk_tolerance: float = 0.5):
        self.difficulty = difficulty
        self.risk_tolerance = risk_tolerance

    def choose_discard(self, hand: MahjongHand, available_tiles: List[MahjongTile]) -> MahjongTile:
        if len(hand.tiles) == 0:
            raise ValueError("No tiles to discard")

        is_ready, waiting_tiles = MahjongWinChecker.is_ready_hand(hand)

        if self.difficulty == 1:
            return random.choice(hand.tiles)

        tile_scores = {}
        for tile in hand.tiles:
            score = self._evaluate_discard(hand, tile, is_ready, waiting_tiles, available_tiles)
            tile_scores[tile] = score

        if self.difficulty >= 3:
            best_tile = max(tile_scores, key=tile_scores.get)
        elif self.difficulty == 2 and random.random() < self.risk_tolerance:
            best_tile = max(tile_scores, key=tile_scores.get)
        else:
            sorted_tiles = sorted(tile_scores.items(), key=lambda x: x[1], reverse=True)
            top_count = max(1, int(len(sorted_tiles) * 0.3))
            best_tile = random.choice([t for t, _ in sorted_tiles[:top_count]])

        return best_tile

    def _evaluate_discard(self, hand: MahjongHand, tile: MahjongTile,
                          is_ready: bool, waiting_tiles: List[MahjongTile],
                          available_tiles: List[MahjongTile]) -> float:
        score = 0.0

        test_hand = MahjongHand(list(hand.tiles))
        test_hand.melds = [list(m) for m in hand.melds]
        test_hand.remove_tile(tile)

        test_ready, test_waiting = MahjongWinChecker.is_ready_hand(test_hand)
        if test_ready:
            score += 100 * len(test_waiting)

        tile_type_counts = Counter(t.tile_type for t in test_hand.tiles)
        if tile.tile_type in tile_type_counts and tile_type_counts[tile.tile_type] == 1:
            score -= 20

        nearby_count = 0
        if tile.tile_type in ['wan', 'tiao', 'tong']:
            for delta in [-2, -1, 1, 2]:
                if MahjongTile(tile.tile_type, tile.value + delta) in test_hand.tiles:
                    nearby_count += 1
        score -= nearby_count * 10

        same_value_count = sum(1 for t in test_hand.tiles if t == tile)
        if same_value_count >= 2:
            score -= 30

        if tile in available_tiles:
            remaining = available_tiles.count(tile)
            score -= remaining * 5

        if tile.tile_type in ['feng', 'jian']:
            score += 5

        if tile.value == 1 or tile.value == 9:
            score += 3

        return score

    def should_peng(self, hand: MahjongHand, tile: MahjongTile) -> bool:
        count = sum(1 for t in hand.tiles if t == tile)
        if count < 2:
            return False

        if self.difficulty >= 3:
            return True
        elif self.difficulty == 2:
            return random.random() < self.risk_tolerance
        else:
            return random.random() < 0.3

    def should_gang(self, hand: MahjongHand, tile: MahjongTile) -> bool:
        count = sum(1 for t in hand.tiles if t == tile)
        if count < 3:
            return False

        if self.difficulty >= 2:
            return True
        return random.random() < 0.5

    def should_hu(self, hand: MahjongHand, tile: MahjongTile) -> bool:
        return MahjongWinChecker.is_winning_hand(hand, tile)
