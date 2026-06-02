import sys
sys.path.insert(0, '/Users/sunmengmeng/works/solo-coder/github0601/060206')

from app.model.majiang_model import MahjongGame, MahjongHand, MahjongWinChecker

print('=== 测试：模拟create_game中的听牌检测 ===')
print()

for test_round in range(5):
    print(f'--- 第 {test_round+1} 次发牌 ---')
    
    game = MahjongGame()
    game.shuffle()
    
    hand = MahjongHand()
    for _ in range(13):
        tile = game.draw_tile()
        if tile:
            hand.add_tile(tile)
    
    print(f'手牌: {[str(t) for t in hand.tiles]}')
    print(f'牌数: {hand.get_tile_count()}')
    
    hand_dict = hand.to_dict()
    hand_obj = MahjongHand.from_dict(hand_dict)
    is_ready, waiting = MahjongWinChecker.is_ready_hand(hand_obj)
    print(f'听牌检测: is_ready={is_ready}, waiting={len(waiting)}张')
    if is_ready:
        print(f'听的牌: {[str(t) for t in waiting]}')
    print()
