import random
from typing import Dict, Any, Optional, List
from app.model.dafuweng import (
    GameModel, GamePlayerModel, PlayerLandModel, PlayerItemModel,
    MapCellModel, ItemModel, RandomEventModel, GameLogModel,
    UserModel, AchievementModel, PlayerAchievementModel
)


class GameBusiness:
    def __init__(self):
        self.game_model = GameModel()
        self.game_player_model = GamePlayerModel()
        self.player_land_model = PlayerLandModel()
        self.player_item_model = PlayerItemModel()
        self.map_cell_model = MapCellModel()
        self.item_model = ItemModel()
        self.random_event_model = RandomEventModel()
        self.game_log_model = GameLogModel()
        self.user_model = UserModel()
        self.achievement_model = AchievementModel()
        self.player_achievement_model = PlayerAchievementModel()

    def create_game(self, max_rounds: int = 20, name: str = '', max_players: int = 4, creator_id: int = 0) -> Dict[str, Any]:
        game_id = self.game_model.create(max_rounds, name, max_players, creator_id)
        if game_id > 0:
            game = self.game_model.get_by_id(game_id)
            return {
                'code': 0,
                'msg': '创建游戏成功',
                'data': game
            }

        return {
            'code': 1,
            'msg': '创建游戏失败',
            'data': None
        }

    def join_game(self, game_id: int, user_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {
                'code': 1,
                'msg': '游戏不存在',
                'data': None
            }

        existing = self.game_player_model.get_by_game_and_user(game_id, user_id)
        if existing:
            return {
                'code': 0,
                'msg': '已在游戏中',
                'data': existing
            }

        if game.get('status') != self.game_model.STATUS_WAITING:
            return {
                'code': 1,
                'msg': '游戏已开始，无法加入',
                'data': None
            }

        existing_players = self.game_player_model.get_by_game_id(game_id)
        max_players = game.get('max_players', 4)
        if len(existing_players) >= max_players:
            return {
                'code': 1,
                'msg': '游戏人数已满',
                'data': None
            }

        player_order = len(existing_players) + 1
        player_id = self.game_player_model.create(game_id, user_id, player_order)
        if player_id > 0:
            player = self.game_player_model.get_by_id(player_id)
            self.game_log_model.create(game_id, user_id, 'join_game', f'加入游戏，玩家序号:{player_order}')
            return {
                'code': 0,
                'msg': '加入游戏成功',
                'data': player
            }

        return {
            'code': 1,
            'msg': '加入游戏失败',
            'data': None
        }

    def start_game(self, game_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {
                'code': 1,
                'msg': '游戏不存在',
                'data': None
            }

        if game.get('status') != self.game_model.STATUS_WAITING:
            return {
                'code': 1,
                'msg': '游戏状态不正确',
                'data': None
            }

        players = self.game_player_model.get_by_game_id(game_id)
        if len(players) < 2:
            return {
                'code': 1,
                'msg': '至少需要2名玩家才能开始',
                'data': None
            }

        self.game_model.update(game_id, {
            'status': self.game_model.STATUS_PLAYING,
            'current_turn': 1,
            'current_round': 1
        })

        self.game_log_model.create(game_id, 0, 'start_game', '游戏开始')

        updated_game = self.game_model.get_by_id(game_id)
        return {
            'code': 0,
            'msg': '游戏开始',
            'data': updated_game
        }

    def roll_dice(self, game_id: int, user_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {
                'code': 1,
                'msg': '游戏不存在',
                'data': None
            }

        if game.get('status') != self.game_model.STATUS_PLAYING:
            return {
                'code': 1,
                'msg': '游戏未在进行中',
                'data': None
            }

        player = self.game_player_model.get_by_game_and_user(game_id, user_id)
        if not player:
            return {
                'code': 1,
                'msg': '玩家不在此游戏中',
                'data': None
            }

        if player.get('player_order') != game.get('current_turn'):
            return {
                'code': 1,
                'msg': '不是你的回合',
                'data': None
            }

        if player.get('is_bankrupt'):
            return {
                'code': 1,
                'msg': '你已破产',
                'data': None
            }

        dice = random.randint(1, 6)
        old_position = player.get('position', 0)
        cells = self.map_cell_model.get_all_cells()
        total_cells = len(cells)

        new_position = (old_position + dice) % total_cells
        passed_start = (old_position + dice) >= total_cells

        if passed_start:
            self.game_player_model.update_money(player.get('id'), 2000)
            self.game_log_model.create(game_id, user_id, 'pass_start', '经过起点，获得2000金币')

        self.game_player_model.update_position(player.get('id'), new_position)

        current_cell = None
        for cell in cells:
            if cell.get('position') == new_position:
                current_cell = cell
                break

        self.game_log_model.create(game_id, user_id, 'roll_dice',
                                   f'掷出{dice}点，从{old_position}移动到{new_position}')

        landing_result = self._handle_cell_landing(game_id, user_id, current_cell)

        land_action = None
        event_data = None
        lr_type = landing_result.get('type') if landing_result else None
        if landing_result:
            if lr_type == 'can_buy':
                land_action = {
                    'type': 'buy_land',
                    'landId': current_cell.get('id') if current_cell else 0,
                    'landName': current_cell.get('name', '') if current_cell else '',
                    'price': landing_result.get('price', 0)
                }
            elif lr_type == 'pay_rent':
                owner = None
                owner_id = landing_result.get('landlord_id')
                if owner_id:
                    owner_user = self.user_model.get_by_id(owner_id)
                    owner = owner_user.get('nickname') or owner_user.get('username') if owner_user else f'玩家{owner_id}'
                land_action = {
                    'type': 'pay_rent',
                    'landName': current_cell.get('name', '') if current_cell else '',
                    'rent': landing_result.get('rent', 0),
                    'ownerName': owner or ''
                }
            elif lr_type == 'own_land' and landing_result.get('can_upgrade'):
                land = landing_result.get('land', {})
                level = land.get('level', 1)
                base_price = current_cell.get('base_price', 0) if current_cell else 0
                land_action = {
                    'type': 'upgrade',
                    'landId': current_cell.get('id') if current_cell else 0,
                    'landName': current_cell.get('name', '') if current_cell else '',
                    'upgradeCost': base_price * level
                }
            elif lr_type == 'chance':
                event_data = landing_result.get('event')

        updated_player = self.game_player_model.get_by_id(player.get('id'))

        next_turn_result = self.next_turn(game_id)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'dice': dice,
                'old_position': old_position,
                'new_position': new_position,
                'passed_start': passed_start,
                'cell': self.map_cell_model.to_dict(current_cell) if current_cell else None,
                'landing_result': landing_result,
                'landAction': land_action,
                'event': event_data,
                'player': updated_player,
                'nextTurn': next_turn_result.get('data')
            }
        }

    def _handle_cell_landing(self, game_id: int, user_id: int, cell: Dict[str, Any]) -> Dict[str, Any]:
        if not cell:
            return {'type': 'none', 'message': '未知格子'}

        cell_type = cell.get('cell_type')
        cell_id = cell.get('id')

        if cell_type == self.map_cell_model.TYPE_START:
            return {'type': 'start', 'message': '到达起点'}

        if cell_type == self.map_cell_model.TYPE_EMPTY:
            return {'type': 'empty', 'message': f'到达空地: {cell.get("name")}'}

        if cell_type == self.map_cell_model.TYPE_LAND:
            owner = self.player_land_model.get_by_game_and_cell(game_id, cell_id)
            if owner:
                if owner.get('user_id') == user_id:
                    return {
                        'type': 'own_land',
                        'message': '自己的地产，可以升级',
                        'land': owner,
                        'can_upgrade': owner.get('level', 1) < 3
                    }
                else:
                    player = self.game_player_model.get_by_game_and_user(game_id, user_id)
                    level = owner.get('level', 1)
                    rent_key = f'rent_level{level}'
                    rent = cell.get(rent_key, 0)
                    self.game_player_model.update_money(player.get('id'), -rent)
                    self.game_player_model.update_money(
                        self.game_player_model.get_by_game_and_user(game_id, owner.get('user_id')).get('id'),
                        rent
                    )
                    self.game_log_model.create(game_id, user_id, 'pay_rent',
                                               f'支付租金{rent}金币给玩家{owner.get("user_id")}')
                    return {
                        'type': 'pay_rent',
                        'message': f'支付租金{rent}金币',
                        'rent': rent,
                        'landlord_id': owner.get('user_id')
                    }
            else:
                return {
                    'type': 'can_buy',
                    'message': f'可以购买{cell.get("name")}，价格{cell.get("base_price")}金币',
                    'price': cell.get('base_price')
                }

        if cell_type == self.map_cell_model.TYPE_CHANCE:
            event_result = self.trigger_random_event(game_id, user_id)
            return {
                'type': 'chance',
                'message': '触发随机事件',
                'event': event_result.get('data')
            }

        if cell_type == self.map_cell_model.TYPE_TAX:
            position = cell.get('position', 0)
            tax = 500 if position in [4] else 800
            player = self.game_player_model.get_by_game_and_user(game_id, user_id)
            self.game_player_model.update_money(player.get('id'), -tax)
            self.game_log_model.create(game_id, user_id, 'pay_tax', f'缴纳税款{tax}金币')
            return {
                'type': 'tax',
                'message': f'缴纳税款{tax}金币',
                'tax': tax
            }

        if cell_type == self.map_cell_model.TYPE_ITEM_SHOP:
            items = self.item_model.get_all()
            return {
                'type': 'item_shop',
                'message': '到达道具店',
                'items': [self.item_model.to_dict(item) for item in items]
            }

        if cell_type == self.map_cell_model.TYPE_BANK:
            return {'type': 'bank', 'message': '到达银行'}

        if cell_type == self.map_cell_model.TYPE_REST:
            player = self.game_player_model.get_by_game_and_user(game_id, user_id)
            self.game_player_model.update(player.get('id'), {'is_active': 0})
            self.game_log_model.create(game_id, user_id, 'rest', '休息一回合')
            return {'type': 'rest', 'message': '休息一回合，下回合跳过'}

        return {'type': 'unknown', 'message': '未知格子类型'}

    def buy_land(self, game_id: int, user_id: int, cell_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game or game.get('status') != self.game_model.STATUS_PLAYING:
            return {
                'code': 1,
                'msg': '游戏未在进行中',
                'data': None
            }

        cell = self.map_cell_model.get_by_id(cell_id)
        if not cell:
            return {
                'code': 1,
                'msg': '格子不存在',
                'data': None
            }

        if cell.get('cell_type') not in [self.map_cell_model.TYPE_LAND, self.map_cell_model.TYPE_EMPTY]:
            return {
                'code': 1,
                'msg': '该格子不可购买',
                'data': None
            }

        existing = self.player_land_model.get_by_game_and_cell(game_id, cell_id)
        if existing:
            return {
                'code': 1,
                'msg': '该地产已被购买',
                'data': None
            }

        player = self.game_player_model.get_by_game_and_user(game_id, user_id)
        if not player:
            return {
                'code': 1,
                'msg': '玩家不在此游戏中',
                'data': None
            }

        price = cell.get('base_price', 0)
        if player.get('money', 0) < price:
            return {
                'code': 1,
                'msg': '金币不足',
                'data': None
            }

        self.game_player_model.update_money(player.get('id'), -price)
        land_id = self.player_land_model.create(game_id, user_id, cell_id, level=1)
        self.game_log_model.create(game_id, user_id, 'buy_land',
                                   f'购买{cell.get("name")}，花费{price}金币')

        land = self.player_land_model.get_by_id(land_id)
        return {
            'code': 0,
            'msg': '购买成功',
            'data': land
        }

    def upgrade_land(self, game_id: int, user_id: int, cell_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game or game.get('status') != self.game_model.STATUS_PLAYING:
            return {
                'code': 1,
                'msg': '游戏未在进行中',
                'data': None
            }

        land = self.player_land_model.get_by_game_and_cell(game_id, cell_id)
        if not land:
            return {
                'code': 1,
                'msg': '地产不存在',
                'data': None
            }

        if land.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '不是你的地产',
                'data': None
            }

        current_level = land.get('level', 1)
        if current_level >= 3:
            return {
                'code': 1,
                'msg': '已达最高等级',
                'data': None
            }

        cell = self.map_cell_model.get_by_id(cell_id)
        base_price = cell.get('base_price', 0)
        upgrade_cost = base_price * current_level

        player = self.game_player_model.get_by_game_and_user(game_id, user_id)
        if player.get('money', 0) < upgrade_cost:
            return {
                'code': 1,
                'msg': '金币不足',
                'data': None
            }

        self.game_player_model.update_money(player.get('id'), -upgrade_cost)
        self.player_land_model.update_level(land.get('id'), current_level + 1)
        self.game_log_model.create(game_id, user_id, 'upgrade_land',
                                   f'升级{cell.get("name")}到等级{current_level + 1}，花费{upgrade_cost}金币')

        updated_land = self.player_land_model.get_by_id(land.get('id'))
        return {
            'code': 0,
            'msg': '升级成功',
            'data': updated_land
        }

    def sell_land(self, game_id: int, user_id: int, cell_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game or game.get('status') != self.game_model.STATUS_PLAYING:
            return {
                'code': 1,
                'msg': '游戏未在进行中',
                'data': None
            }

        land = self.player_land_model.get_by_game_and_cell(game_id, cell_id)
        if not land:
            return {
                'code': 1,
                'msg': '地产不存在',
                'data': None
            }

        if land.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '不是你的地产',
                'data': None
            }

        cell = self.map_cell_model.get_by_id(cell_id)
        base_price = cell.get('base_price', 0)
        level = land.get('level', 1)
        total_investment = base_price
        for i in range(1, level):
            total_investment += base_price * i

        refund = total_investment // 2

        player = self.game_player_model.get_by_game_and_user(game_id, user_id)
        self.game_player_model.update_money(player.get('id'), refund)
        self.player_land_model.delete_by_game(game_id)
        land_copy = dict(land)

        from app.common.sqlite.orm_exec import ORMExec
        exec_obj = ORMExec(self.player_land_model.TABLE_NAME)
        exec_obj.delete_by_id(land.get('id'))

        self.game_log_model.create(game_id, user_id, 'sell_land',
                                   f'出售{cell.get("name")}，获得{refund}金币')

        return {
            'code': 0,
            'msg': '出售成功',
            'data': {
                'refund': refund,
                'cell_id': cell_id
            }
        }

    def buy_item(self, game_id: int, user_id: int, item_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game or game.get('status') != self.game_model.STATUS_PLAYING:
            return {
                'code': 1,
                'msg': '游戏未在进行中',
                'data': None
            }

        item = self.item_model.get_by_id(item_id)
        if not item or not item.get('is_active'):
            return {
                'code': 1,
                'msg': '道具不存在或已下架',
                'data': None
            }

        player = self.game_player_model.get_by_game_and_user(game_id, user_id)
        if not player:
            return {
                'code': 1,
                'msg': '玩家不在此游戏中',
                'data': None
            }

        price = item.get('price', 0)
        if player.get('money', 0) < price:
            return {
                'code': 1,
                'msg': '金币不足',
                'data': None
            }

        self.game_player_model.update_money(player.get('id'), -price)
        self.player_item_model.add_item(game_id, user_id, item_id, 1)
        self.game_log_model.create(game_id, user_id, 'buy_item',
                                   f'购买道具{item.get("name")}，花费{price}金币')

        return {
            'code': 0,
            'msg': '购买成功',
            'data': self.item_model.to_dict(item)
        }

    def use_item(self, game_id: int, user_id: int, item_id: int,
                 target_user_id: int = None) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game or game.get('status') != self.game_model.STATUS_PLAYING:
            return {
                'code': 1,
                'msg': '游戏未在进行中',
                'data': None
            }

        player = self.game_player_model.get_by_game_and_user(game_id, user_id)
        if not player:
            return {
                'code': 1,
                'msg': '玩家不在此游戏中',
                'data': None
            }

        item = self.item_model.get_by_id(item_id)
        if not item:
            return {
                'code': 1,
                'msg': '道具不存在',
                'data': None
            }

        result = self.player_item_model.use_item(game_id, user_id, item_id, 1)
        if result == 0:
            return {
                'code': 1,
                'msg': '没有该道具或数量不足',
                'data': None
            }

        item_type = item.get('item_type')
        effect_value = item.get('effect_value', 0)
        effect_result = {}

        if item_type == self.item_model.TYPE_ATTACK:
            if not target_user_id:
                return {
                    'code': 1,
                    'msg': '攻击类道具需要指定目标玩家',
                    'data': None
                }
            target_player = self.game_player_model.get_by_game_and_user(game_id, target_user_id)
            if not target_player:
                return {
                    'code': 1,
                    'msg': '目标玩家不存在',
                    'data': None
                }
            self.game_player_model.update_money(target_player.get('id'), -effect_value)
            effect_result = {'action': 'attack', 'target': target_user_id, 'damage': effect_value}
            self.game_log_model.create(game_id, user_id, 'use_item_attack',
                                       f'对玩家{target_user_id}使用{item.get("name")}，造成{effect_value}金币损失')

        elif item_type == self.item_model.TYPE_DEFENSE:
            player_data = self.game_player_model.get_by_game_and_user(game_id, user_id)
            self.game_player_model.update(player_data.get('id'), {'is_active': 1})
            effect_result = {'action': 'defense', 'shield': True}
            self.game_log_model.create(game_id, user_id, 'use_item_defense',
                                       f'使用{item.get("name")}，获得防御护盾')

        elif item_type == self.item_model.TYPE_MOVE:
            cells = self.map_cell_model.get_all_cells()
            total_cells = len(cells)
            old_pos = player.get('position', 0)
            new_pos = (old_pos + effect_value) % total_cells
            self.game_player_model.update_position(player.get('id'), new_pos)
            effect_result = {'action': 'move', 'steps': effect_value, 'new_position': new_pos}
            self.game_log_model.create(game_id, user_id, 'use_item_move',
                                       f'使用{item.get("name")}，前进{effect_value}步')

        elif item_type == self.item_model.TYPE_ECONOMY:
            self.game_player_model.update_money(player.get('id'), effect_value)
            effect_result = {'action': 'economy', 'gain': effect_value}
            self.game_log_model.create(game_id, user_id, 'use_item_economy',
                                       f'使用{item.get("name")}，获得{effect_value}金币')

        return {
            'code': 0,
            'msg': '使用成功',
            'data': {
                'item': self.item_model.to_dict(item),
                'effect': effect_result
            }
        }

    def trigger_random_event(self, game_id: int, user_id: int) -> Dict[str, Any]:
        events = self.random_event_model.get_active_events()
        if not events:
            return {
                'code': 1,
                'msg': '没有可用的随机事件',
                'data': None
            }

        total_weight = sum(e.get('probability', 10) for e in events)
        rand_val = random.randint(1, total_weight)
        cumulative = 0
        selected_event = events[0]
        for event in events:
            cumulative += event.get('probability', 10)
            if rand_val <= cumulative:
                selected_event = event
                break

        event_type = selected_event.get('event_type')
        effect_value = selected_event.get('effect_value', 0)

        player = self.game_player_model.get_by_game_and_user(game_id, user_id)

        if event_type == self.random_event_model.TYPE_GAIN_MONEY:
            self.game_player_model.update_money(player.get('id'), effect_value)
        elif event_type == self.random_event_model.TYPE_LOSE_MONEY:
            self.game_player_model.update_money(player.get('id'), -effect_value)
        elif event_type == self.random_event_model.TYPE_FORWARD:
            cells = self.map_cell_model.get_all_cells()
            total_cells = len(cells)
            old_pos = player.get('position', 0)
            new_pos = (old_pos + effect_value) % total_cells
            self.game_player_model.update_position(player.get('id'), new_pos)
        elif event_type == self.random_event_model.TYPE_BACKWARD:
            cells = self.map_cell_model.get_all_cells()
            total_cells = len(cells)
            old_pos = player.get('position', 0)
            new_pos = max(0, old_pos - effect_value)
            self.game_player_model.update_position(player.get('id'), new_pos)
        elif event_type == self.random_event_model.TYPE_GAIN_ITEM:
            items = self.item_model.get_all()
            if items:
                random_item = random.choice(items)
                self.player_item_model.add_item(game_id, user_id, random_item.get('id'), 1)
        elif event_type == self.random_event_model.TYPE_TAX_FREE:
            pass

        self.game_log_model.create(game_id, user_id, 'random_event',
                                   f'触发随机事件: {selected_event.get("name")}')

        return {
            'code': 0,
            'msg': 'success',
            'data': self.random_event_model.to_dict(selected_event)
        }

    def next_turn(self, game_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {
                'code': 1,
                'msg': '游戏不存在',
                'data': None
            }

        if game.get('status') != self.game_model.STATUS_PLAYING:
            return {
                'code': 1,
                'msg': '游戏未在进行中',
                'data': None
            }

        players = self.game_player_model.get_active_players(game_id)
        if not players:
            return {
                'code': 1,
                'msg': '没有活跃玩家',
                'data': None
            }

        current_turn = game.get('current_turn', 1)
        current_round = game.get('current_round', 1)
        max_rounds = game.get('max_rounds', 20)

        next_turn = current_turn + 1
        next_round = current_round

        if next_turn > len(players):
            next_turn = 1
            next_round = current_round + 1

        active_players = self.game_player_model.get_active_players(game_id)
        if len(active_players) <= 1 or next_round > max_rounds:
            scores = self._calculate_final_scores(game_id)
            self._end_game(game_id, scores)
            return {
                'code': 0,
                'msg': '游戏结束',
                'data': {
                    'game_ended': True,
                    'scores': scores
                }
            }

        for p in players:
            if not p.get('is_active') and not p.get('is_bankrupt'):
                self.game_player_model.update(p.get('id'), {'is_active': 1})

        self.game_model.update(game_id, {
            'current_turn': next_turn,
            'current_round': next_round
        })

        self.game_log_model.create(game_id, 0, 'next_turn',
                                   f'回合切换，当前回合:玩家{next_turn}，第{next_round}轮')

        updated_game = self.game_model.get_by_id(game_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': updated_game
        }

    def get_game_state(self, game_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {
                'code': 1,
                'msg': '游戏不存在',
                'data': None
            }

        status_num = game.get('status', 0)
        status_map = {0: 'waiting', 1: 'playing', 2: 'finished'}
        status_str = status_map.get(status_num, 'waiting')

        cells = self.map_cell_model.get_all_cells()
        all_lands = self.player_land_model.get_by_game_id(game_id)
        land_owner_map = {}
        for land in all_lands:
            land_owner_map[land.get('cell_id')] = land

        type_map = {
            0: 'start', 1: 'empty', 2: 'land', 3: 'event',
            4: 'tax', 5: 'item', 6: 'bank', 7: 'parking'
        }

        board_cells = []
        for cell in cells:
            cell_id = cell.get('id')
            cell_type = cell.get('cell_type', 1)
            land = land_owner_map.get(cell_id)
            board_cells.append({
                'id': cell_id,
                'position': cell.get('position'),
                'name': cell.get('name'),
                'type': type_map.get(cell_type, 'empty'),
                'cellType': cell_type,
                'icon': cell.get('icon', '⬜'),
                'color': cell.get('color', '#9E9E9E'),
                'price': cell.get('base_price', 0),
                'rentLevel1': cell.get('rent_level1', 0),
                'rentLevel2': cell.get('rent_level2', 0),
                'rentLevel3': cell.get('rent_level3', 0),
                'ownerId': land.get('user_id') if land else None,
                'level': land.get('level') if land else 0,
                'description': cell.get('description', '')
            })

        players = self.game_player_model.get_by_game_id(game_id)
        player_states = []
        last_log = None
        for p in players:
            user_id = p.get('user_id')
            user = self.user_model.get_by_id(user_id)
            lands = self.player_land_model.get_by_game_and_user(game_id, user_id)
            items = self.player_item_model.get_by_game_and_user(game_id, user_id)

            player_lands = []
            for land in lands:
                cell = self.map_cell_model.get_by_id(land.get('cell_id'))
                land_level = land.get('level', 1)
                base_price = cell.get('base_price', 0) if cell else 0
                upgrade_cost = base_price * land_level if land_level < 3 else 0
                player_lands.append({
                    'id': land.get('cell_id'),
                    'landId': land.get('id'),
                    'name': cell.get('name', '') if cell else '',
                    'level': land_level,
                    'canUpgrade': land_level < 3,
                    'upgradeCost': upgrade_cost
                })

            player_items = []
            for pi in items:
                item = self.item_model.get_by_id(pi.get('item_id'))
                if item:
                    player_items.append({
                        'id': pi.get('item_id'),
                        'playerItemId': pi.get('id'),
                        'name': item.get('name'),
                        'icon': item.get('icon', '📦'),
                        'description': item.get('description', ''),
                        'itemType': item.get('item_type'),
                        'quantity': pi.get('count', 1)
                    })

            player_states.append({
                'userId': user_id,
                'playerId': p.get('id'),
                'username': user.get('username', '') if user else '',
                'nickname': user.get('nickname', f'玩家{user_id}') if user else f'玩家{user_id}',
                'avatar': user.get('avatar', '') if user else '',
                'money': p.get('money', 0),
                'position': p.get('position', 0),
                'playerOrder': p.get('player_order', 0),
                'isBankrupt': p.get('is_bankrupt', 0),
                'isActive': p.get('is_active', 1),
                'lands': player_lands,
                'items': player_items
            })

        logs = self.game_log_model.get_recent(game_id, limit=1)
        if logs and len(logs) > 0:
            last_log = logs[0].get('detail', '')

        current_turn = game.get('current_turn', 0)
        current_player_index = 0
        for idx, p in enumerate(player_states):
            if p.get('playerOrder') == current_turn:
                current_player_index = idx
                break

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'gameId': game.get('id'),
                'name': game.get('name', ''),
                'status': status_str,
                'currentRound': game.get('current_round', 1),
                'maxRounds': game.get('max_rounds', 20),
                'maxPlayers': game.get('max_players', 4),
                'creatorId': game.get('creator_id', 0),
                'currentTurn': current_turn,
                'currentPlayerIndex': current_player_index,
                'map': board_cells,
                'players': player_states,
                'lastLog': last_log,
                'createdAt': game.get('created_at', '')
            }
        }

    def get_game_list(self, page: int = 1, page_size: int = 10, status: str = None) -> Dict[str, Any]:
        status_val = None
        if status == 'waiting':
            status_val = 0
        elif status == 'playing':
            status_val = 1
        elif status == 'finished':
            status_val = 2
        elif status is not None and status != '':
            try:
                status_val = int(status)
            except:
                pass

        result = self.game_model.get_all(page, page_size, status_val)
        items = []
        for item in result.get('items', []):
            players = self.game_player_model.get_by_game_id(item.get('id'))
            status_num = item.get('status', 0)
            status_map = {0: 'waiting', 1: 'playing', 2: 'finished'}
            items.append({
                'id': item.get('id'),
                'name': item.get('name', f'房间{item.get("id")}'),
                'status': status_map.get(status_num, 'waiting'),
                'statusText': self.game_model.get_status_text(status_num),
                'playerCount': len(players),
                'maxPlayers': item.get('max_players', 4),
                'maxRounds': item.get('max_rounds', 20),
                'creatorId': item.get('creator_id', 0),
                'createdAt': item.get('created_at', '')
            })

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

    def _check_achievements(self, user_id: int) -> List[Dict[str, Any]]:
        achievements = self.achievement_model.get_active_achievements()
        unlocked = []

        for achievement in achievements:
            if self.player_achievement_model.check_unlocked(user_id, achievement.get('id')):
                continue

            condition_type = achievement.get('condition_type')
            condition_value = achievement.get('condition_value')
            should_unlock = False

            if condition_type == 'total_games':
                user = self.user_model.get_by_id(user_id)
                if user and user.get('total_games', 0) >= condition_value:
                    should_unlock = True
            elif condition_type == 'wins':
                user = self.user_model.get_by_id(user_id)
                if user and user.get('wins', 0) >= condition_value:
                    should_unlock = True

            if should_unlock:
                self.player_achievement_model.create(user_id, achievement.get('id'))
                self.user_model.update_coins(user_id, achievement.get('reward_coins', 0))
                unlocked.append(self.achievement_model.to_dict(achievement))

        return unlocked

    def _calculate_final_scores(self, game_id: int) -> List[Dict[str, Any]]:
        players = self.game_player_model.get_by_game_id(game_id)
        scores = []

        for p in players:
            money = p.get('money', 0)
            lands = self.player_land_model.get_by_game_and_user(game_id, p.get('user_id'))
            land_value = 0
            for land in lands:
                cell = self.map_cell_model.get_by_id(land.get('cell_id'))
                if cell:
                    base_price = cell.get('base_price', 0)
                    level = land.get('level', 1)
                    investment = base_price
                    for i in range(1, level):
                        investment += base_price * i
                    land_value += investment

            total_score = money + land_value
            scores.append({
                'user_id': p.get('user_id'),
                'money': money,
                'land_value': land_value,
                'total_score': total_score,
                'is_bankrupt': p.get('is_bankrupt', 0)
            })

        scores.sort(key=lambda x: x.get('total_score', 0), reverse=True)
        return scores

    def _end_game(self, game_id: int, scores: List[Dict[str, Any]]) -> Dict[str, Any]:
        self.game_model.update(game_id, {'status': self.game_model.STATUS_FINISHED})

        if scores:
            winner_id = scores[0].get('user_id')
            winner = self.user_model.get_by_id(winner_id)
            if winner:
                self.user_model.update_coins(winner_id, 1000)
                current_wins = winner.get('wins', 0)
                from app.common.sqlite.orm_exec import ORMExec
                user_exec = ORMExec(self.user_model.TABLE_NAME)
                user_exec.update_by_id(winner_id, {'wins': current_wins + 1})

        for score in scores:
            user = self.user_model.get_by_id(score.get('user_id'))
            if user:
                current_games = user.get('total_games', 0)
                from app.common.sqlite.orm_exec import ORMExec
                user_exec = ORMExec(self.user_model.TABLE_NAME)
                user_exec.update_by_id(score.get('user_id'), {'total_games': current_games + 1})

        for score in scores:
            self._check_achievements(score.get('user_id'))

        self.game_log_model.create(game_id, 0, 'end_game', '游戏结束')

        return {
            'code': 0,
            'msg': '游戏结束',
            'data': scores
        }
