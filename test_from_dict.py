import sys
sys.path.insert(0, '/Users/sunmengmeng/works/solo-coder/github0601/060206')

from app.model.majiang_model import MahjongTile, MahjongHand, MahjongWinChecker

print('=== 测试1：直接创建MahjongHand对象 ===')
hand1 = MahjongHand()
for i in range(1, 10):
    hand1.add_tile(MahjongTile('wan', i))
hand1.add_tile(MahjongTile('tiao', 5))
hand1.add_tile(MahjongTile('tiao', 5))
hand1.add_tile(MahjongTile('wan', 1))
hand1.add_tile(MahjongTile('wan', 1))

print(f'牌数: {hand1.get_tile_count()}')
print(f'牌: {[str(t) for t in hand1.tiles]}')
is_ready, waiting = MahjongWinChecker.is_ready_hand(hand1)
print(f'is_ready_hand: is_ready={is_ready}, waiting={len(waiting)}张')
if is_ready:
    print(f'听牌: {[str(t) for t in waiting]}')
print()

print('=== 测试2：用to_dict和from_dict转换后测试 ===')
hand_dict = hand1.to_dict()
print(f'转换为dict后牌数: {len(hand_dict["tiles"])}')

hand2 = MahjongHand.from_dict(hand_dict)
print(f'from_dict后牌数: {hand2.get_tile_count()}')
print(f'牌: {[str(t) for t in hand2.tiles]}')
is_ready, waiting = MahjongWinChecker.is_ready_hand(hand2)
print(f'is_ready_hand: is_ready={is_ready}, waiting={len(waiting)}张')
if is_ready:
    print(f'听牌: {[str(t) for t in waiting]}')
print()

print('=== 测试3：检查tile_type字段 ===')
print(f'hand_dict tiles[0]: {hand_dict["tiles"][0]}')
print()

print('=== 测试4：七对子听牌 ===')
hand3 = MahjongHand()
for i in range(1, 7):
    hand3.add_tile(MahjongTile('wan', i))
    hand3.add_tile(MahjongTile('wan', i))
hand3.add_tile(MahjongTile('wan', 7))
print(f'牌数: {hand3.get_tile_count()}')
print(f'牌: {[str(t) for t in hand3.tiles]}')
is_ready, waiting = MahjongWinChecker.is_ready_hand(hand3)
print(f'is_ready_hand: is_ready={is_ready}, waiting={len(waiting)}张')
if is_ready:
    print(f'听牌: {[str(t) for t in waiting]}')
