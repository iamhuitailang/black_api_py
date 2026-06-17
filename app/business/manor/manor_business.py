from typing import Dict, Any, List, Optional
import json
import random
from app.model.manor import GameStateModel, RoomModel, ItemModel, GhostModel


class ManorBusiness:
    def __init__(self):
        self.game_state_model = GameStateModel()
        self.room_model = RoomModel()
        self.item_model = ItemModel()
        self.ghost_model = GhostModel()

    def _init_rooms_if_empty(self):
        existing = self.room_model.get_all()
        if len(existing) > 0:
            return

        rooms = [
            {
                'room_id': 'entrance_hall',
                'name': '门厅',
                'description': '高大的门厅里，破碎的彩色玻璃窗透进微弱的月光。墙上挂着一幅维多利亚时代的家族肖像画，画中人物的眼睛似乎在注视着你。',
                'connections': json.dumps(['living_room', 'staircase', 'library']),
                'has_puzzle': 1,
                'puzzle_type': 'painting_door',
                'puzzle_solved': 0,
                'locked': 0,
                'decor_style': 'victorian_grand'
            },
            {
                'room_id': 'living_room',
                'name': '客厅',
                'description': '破旧的丝绒沙发上落满灰尘，壁炉早已熄灭。墙上的烛台还残留着蜡泪。角落里有一架老旧的留声机。',
                'connections': json.dumps(['entrance_hall', 'dining_room']),
                'has_puzzle': 0,
                'puzzle_solved': 0,
                'locked': 0,
                'decor_style': 'victorian'
            },
            {
                'room_id': 'dining_room',
                'name': '餐厅',
                'description': '长长的餐桌上摆着落满灰尘的餐具，仿佛主人似乎随时会有人来用餐。水晶吊灯摇摇欲坠。',
                'connections': json.dumps(['living_room', 'kitchen']),
                'has_puzzle': 0,
                'puzzle_solved': 0,
                'locked': 0,
                'decor_style': 'victorian_elegant'
            },
            {
                'room_id': 'kitchen',
                'name': '厨房',
                'description': '锈迹斑斑的铁锅挂在墙上，铜制的炉灶早已冷却。地板上散落着碎裂的瓷片。',
                'connections': json.dumps(['dining_room', 'pantry', 'basement_stairs']),
                'has_puzzle': 0,
                'puzzle_solved': 0,
                'locked': 0,
                'decor_style': 'victorian_rustic'
            },
            {
                'room_id': 'pantry',
                'name': '储藏室',
                'description': '狭小的储藏室里堆满了旧罐子和木箱。空气中弥漫着霉味。',
                'connections': json.dumps(['kitchen']),
                'has_puzzle': 0,
                'puzzle_solved': 0,
                'locked': 0,
                'decor_style': 'victorian'
            },
            {
                'room_id': 'staircase',
                'name': '楼梯间',
                'description': '旋转楼梯通往二楼，每走一步都会发出吱呀的响声。墙上挂着历代主人的画像。',
                'connections': json.dumps(['entrance_hall', 'upstairs_hall']),
                'has_puzzle': 0,
                'puzzle_solved': 0,
                'locked': 0,
                'decor_style': 'victorian_grand'
            },
            {
                'room_id': 'library',
                'name': '图书馆',
                'description': '高耸的书架直达天花板，空气中弥漫着旧书的气息。一架梯子靠在书架旁。',
                'connections': json.dumps(['entrance_hall', 'study']),
                'has_puzzle': 1,
                'puzzle_type': 'bookshelf_lever',
                'puzzle_solved': 0,
                'locked': 0,
                'decor_style': 'victorian_library'
            },
            {
                'room_id': 'study',
                'name': '书房',
                'description': '一张巨大的橡木书桌上摆着未完成的信件。桌上的墨水早已干涸。',
                'connections': json.dumps(['library']),
                'has_puzzle': 0,
                'puzzle_solved': 0,
                'locked': 1,
                'required_key': 'study_key',
                'decor_style': 'victorian_study'
            },
            {
                'room_id': 'upstairs_hall',
                'name': '二楼走廊',
                'description': '狭长的走廊两侧是几扇紧闭的房门。地毯上有奇怪的脚印。',
                'connections': json.dumps(['staircase', 'master_bedroom', 'guest_room', 'bathroom']),
                'has_puzzle': 0,
                'puzzle_solved': 0,
                'locked': 0,
                'decor_style': 'victorian'
            },
            {
                'room_id': 'master_bedroom',
                'name': '主卧室',
                'description': '华丽的四柱床上挂着残破的纱帐。梳妆台上的镜子蒙着灰尘。',
                'connections': json.dumps(['upstairs_hall']),
                'has_puzzle': 0,
                'puzzle_solved': 0,
                'locked': 0,
                'decor_style': 'victorian_bedroom'
            },
            {
                'room_id': 'guest_room',
                'name': '客房',
                'description': '简单的客房，墙上挂着一幅风景画。衣柜里似乎有什么东西在动。',
                'connections': json.dumps(['upstairs_hall']),
                'has_puzzle': 0,
                'puzzle_solved': 0,
                'locked': 0,
                'decor_style': 'victorian'
            },
            {
                'room_id': 'bathroom',
                'name': '浴室',
                'description': '铸铁浴缸上布满了水渍。镜子上有手写的字迹。',
                'connections': json.dumps(['upstairs_hall']),
                'has_puzzle': 0,
                'puzzle_solved': 0,
                'locked': 0,
                'decor_style': 'victorian'
            },
            {
                'room_id': 'basement_stairs',
                'name': '地下室楼梯',
                'description': '陡峭的楼梯向下延伸，黑暗中似乎有什么在窥视。',
                'connections': json.dumps(['kitchen', 'basement']),
                'has_puzzle': 0,
                'puzzle_solved': 0,
                'locked': 1,
                'required_key': 'basement_key',
                'decor_style': 'victorian_dark'
            },
            {
                'room_id': 'basement',
                'name': '地下室',
                'description': '潮湿的地下室里堆满了旧家具和箱子。角落里有一扇锈迹斑斑的铁门。',
                'connections': json.dumps(['basement_stairs', 'secret_room']),
                'has_puzzle': 1,
                'puzzle_type': 'floor_trap',
                'puzzle_solved': 0,
                'locked': 0,
                'decor_style': 'victorian_dark'
            },
            {
                'room_id': 'secret_room',
                'name': '密室',
                'description': '隐藏的密室里，祭坛上放着一把古老的钥匙。墙上刻着神秘的符文。',
                'connections': json.dumps(['basement']),
                'has_puzzle': 0,
                'puzzle_solved': 0,
                'locked': 1,
                'required_key': 'master_key',
                'decor_style': 'victorian_mystery'
            }
        ]

        for room in rooms:
            self.room_model.create(room)

    def _init_items_if_empty(self):
        existing = self.item_model.get_all()
        if len(existing) > 0:
            return

        items = [
            {
                'item_id': 'key_fragment_1',
                'name': '钥匙碎片·壹',
                'description': '一块古老的金色钥匙碎片，上面刻着数字"壹"。',
                'item_type': 'key_fragment',
                'location': 'living_room',
                'collected': 0
            },
            {
                'item_id': 'key_fragment_2',
                'name': '钥匙碎片·贰',
                'description': '一块古老的金色钥匙碎片，上面刻着数字"贰"。',
                'item_type': 'key_fragment',
                'location': 'master_bedroom',
                'collected': 0
            },
            {
                'item_id': 'key_fragment_3',
                'name': '钥匙碎片·叁',
                'description': '一块古老的金色钥匙碎片，上面刻着数字"叁"。',
                'item_type': 'key_fragment',
                'location': 'pantry',
                'collected': 0
            },
            {
                'item_id': 'basement_key',
                'name': '地下室钥匙',
                'description': '一把锈迹斑斑的铁钥匙，可以打开地下室的门。',
                'item_type': 'key',
                'location': 'study',
                'collected': 0
            },
            {
                'item_id': 'study_key',
                'name': '书房钥匙',
                'description': '一把铜制的书房钥匙。',
                'item_type': 'key',
                'location': 'library',
                'collected': 0
            },
            {
                'item_id': 'battery_1',
                'name': '电池',
                'description': '一节新的手电筒电池，可以恢复30%电量。',
                'item_type': 'battery',
                'location': 'kitchen',
                'collected': 0
            },
            {
                'item_id': 'battery_2',
                'name': '电池',
                'description': '一节新的手电筒电池，可以恢复30%电量。',
                'item_type': 'battery',
                'location': 'guest_room',
                'collected': 0
            },
            {
                'item_id': 'battery_3',
                'name': '电池',
                'description': '一节新的手电筒电池，可以恢复30%电量。',
                'item_type': 'battery',
                'location': 'bathroom',
                'collected': 0
            },
            {
                'item_id': 'master_key',
                'name': '庄园主钥匙',
                'description': '由三块钥匙碎片合成的完整钥匙，可以打开密室的门。',
                'item_type': 'key',
                'location': 'inventory',
                'collected': 0
            },
            {
                'item_id': 'escape_key',
                'name': '逃生钥匙',
                'description': '可以打开庄园大门，逃离这座可怕的地方！',
                'item_type': 'key',
                'location': 'secret_room',
                'collected': 0
            }
        ]

        for item in items:
            self.item_model.create(item)

    def _init_ghosts_if_empty(self):
        existing = self.ghost_model.get_all()
        if len(existing) > 0:
            return

        ghosts = [
            {
                'ghost_id': 'lady_blackwell',
                'name': '布莱克威尔夫人',
                'description': '庄园女主人的幽灵，穿着黑色的维多利亚长裙。',
                'position': 'basement',
                'speed': 1.0,
                'is_chasing': 0
            }
        ]

        for ghost in ghosts:
            self.ghost_model.create(ghost)

    def _reset_world_state(self):
        all_items = self.item_model.get_all()
        for item in all_items:
            self.item_model.update(item['item_id'], {'collected': 0})

        all_rooms = self.room_model.get_all()
        for room in all_rooms:
            if room['room_id'] == 'study':
                self.room_model.update(room['room_id'], {'locked': 1, 'puzzle_solved': 0})
            elif room['room_id'] == 'basement_stairs':
                self.room_model.update(room['room_id'], {'locked': 1})
            elif room['room_id'] == 'secret_room':
                self.room_model.update(room['room_id'], {'locked': 1})
            elif room['has_puzzle'] == 1:
                self.room_model.update(room['room_id'], {'puzzle_solved': 0})

        all_ghosts = self.ghost_model.get_all()
        for ghost in all_ghosts:
            self.ghost_model.update(ghost['ghost_id'], {'position': 'basement', 'is_chasing': 0})

    def start_new_game(self, player_name: str = 'player') -> Dict[str, Any]:
        self._init_rooms_if_empty()
        self._init_items_if_empty()
        self._init_ghosts_if_empty()

        existing = self.game_state_model.get_by_player_name(player_name)
        if existing:
            self.game_state_model.delete(existing['id'])

        self._reset_world_state()

        game_id = self.game_state_model.create(player_name)
        game_state = self.game_state_model.get_by_id(game_id)

        current_room = self.room_model.get_by_room_id(game_state['current_room'])
        room_items = self.item_model.get_by_location(game_state['current_room'])
        ghost = self.ghost_model.get_by_ghost_id('lady_blackwell')

        return {
            'code': 0,
            'message': '游戏开始',
            'data': {
                'game_id': game_id,
                'player_name': player_name,
                'current_room': current_room,
                'room_items': room_items,
                'game_state': {
                    'lives': game_state['lives'],
                    'flashlight_battery': game_state['flashlight_battery'],
                    'collected_items': json.loads(game_state['collected_items']),
                    'unlocked_rooms': json.loads(game_state['unlocked_rooms']),
                    'ghost_position': game_state['ghost_position'],
                    'game_status': game_state['game_status']
                },
                'ghost': {
                    'name': ghost['name'],
                    'description': ghost['description'],
                    'position': ghost['position']
                }
            }
        }

    def get_game_state(self, player_name: str) -> Dict[str, Any]:
        game_state = self.game_state_model.get_by_player_name(player_name)
        if not game_state:
            return {
                'code': 1,
                'message': '游戏不存在，请先开始新游戏',
                'data': None
            }

        current_room = self.room_model.get_by_room_id(game_state['current_room'])
        room_items = self.item_model.get_by_location(game_state['current_room'])
        room_items = [item for item in room_items if item['collected'] == 0]
        ghost = self.ghost_model.get_by_ghost_id('lady_blackwell')

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'game_id': game_state['id'],
                'player_name': player_name,
                'current_room': current_room,
                'room_items': room_items,
                'game_state': {
                    'lives': game_state['lives'],
                    'flashlight_battery': game_state['flashlight_battery'],
                    'collected_items': json.loads(game_state['collected_items']),
                    'unlocked_rooms': json.loads(game_state['unlocked_rooms']),
                    'ghost_position': game_state['ghost_position'],
                    'game_status': game_state['game_status']
                },
                'ghost': {
                    'name': ghost['name'],
                    'description': ghost['description'],
                    'position': ghost['position']
                }
            }
        }

    def move_to_room(self, player_name: str, target_room: str) -> Dict[str, Any]:
        game_state = self.game_state_model.get_by_player_name(player_name)
        if not game_state:
            return {
                'code': 1,
                'message': '游戏不存在，请先开始新游戏',
                'data': None
            }

        if game_state['game_status'] != 'playing':
            return {
                'code': 2,
                'message': '游戏已结束',
                'data': None
            }

        current_room = self.room_model.get_by_room_id(game_state['current_room'])
        connections = json.loads(current_room['connections'])

        if target_room not in connections:
            return {
                'code': 3,
                'message': '无法到达该房间',
                'data': None
            }

        target_room_data = self.room_model.get_by_room_id(target_room)
        if not target_room_data:
            return {
                'code': 4,
                'message': '房间不存在',
                'data': None
            }

        if target_room_data['locked'] == 1:
            collected_items = json.loads(game_state['collected_items'])
            required_key = target_room_data['required_key']
            if required_key not in collected_items:
                return {
                    'code': 5,
                    'message': f'房间被锁住了，需要钥匙',
                    'data': {
                        'locked': True,
                        'required_key': required_key
                    }
                }
            self.room_model.update(target_room, {'locked': 0})
            target_room_data['locked'] = 0

        new_battery = game_state['flashlight_battery'] - 5.0
        if new_battery < 0:
            new_battery = 0

        ghost = self.ghost_model.get_by_ghost_id('lady_blackwell')
        ghost_position = ghost['position']
        ghost_moved = False

        if random.random() < 0.6:
            ghost_room = self.room_model.get_by_room_id(ghost_position)
            ghost_connections = json.loads(ghost_room['connections'])
            if ghost_connections:
                new_ghost_pos = random.choice(ghost_connections)
                self.ghost_model.update(ghost['ghost_id'], {'position': new_ghost_pos})
                ghost_position = new_ghost_pos
                ghost_moved = True

        ghost_nearby = ghost_position == target_room
        lives = game_state['lives']
        game_status = game_state['game_status']

        if ghost_nearby:
            lives -= 1
            if lives <= 0:
                game_status = 'lost'
            else:
                safe_rooms = json.loads(current_room['connections'])
                if safe_rooms:
                    target_room = random.choice(safe_rooms)
                    target_room_data = self.room_model.get_by_room_id(target_room)

        unlocked_rooms = json.loads(game_state['unlocked_rooms'])
        if target_room not in unlocked_rooms:
            unlocked_rooms.append(target_room)

        update_data = {
            'current_room': target_room,
            'flashlight_battery': new_battery,
            'lives': lives,
            'game_status': game_status,
            'unlocked_rooms': json.dumps(unlocked_rooms),
            'ghost_position': ghost_position
        }

        self.game_state_model.update(game_state['id'], update_data)

        room_items = self.item_model.get_by_location(target_room)
        room_items = [item for item in room_items if item['collected'] == 0]

        return {
            'code': 0,
            'message': '移动成功',
            'data': {
                'current_room': target_room_data,
                'room_items': room_items,
                'game_state': {
                    'lives': lives,
                    'flashlight_battery': new_battery,
                    'collected_items': json.loads(game_state['collected_items']),
                    'unlocked_rooms': unlocked_rooms,
                    'ghost_position': ghost_position,
                    'game_status': game_status
                },
                'ghost': {
                    'name': ghost['name'],
                    'description': ghost['description'],
                    'position': ghost_position,
                    'moved': ghost_moved
                },
                'ghost_encounter': ghost_nearby,
                'fled_to': target_room if ghost_nearby and lives > 0 else None
            }
        }

    def collect_item(self, player_name: str, item_id: str) -> Dict[str, Any]:
        game_state = self.game_state_model.get_by_player_name(player_name)
        if not game_state:
            return {
                'code': 1,
                'message': '游戏不存在，请先开始新游戏',
                'data': None
            }

        if game_state['game_status'] != 'playing':
            return {
                'code': 2,
                'message': '游戏已结束',
                'data': None
            }

        item = self.item_model.get_by_item_id(item_id)
        if not item:
            return {
                'code': 3,
                'message': '物品不存在',
                'data': None
            }

        if item['collected'] == 1:
            return {
                'code': 4,
                'message': '物品已被收集',
                'data': None
            }

        if item['location'] != game_state['current_room']:
            return {
                'code': 5,
                'message': '物品不在当前房间',
                'data': None
            }

        collected_items = json.loads(game_state['collected_items'])
        collected_items.append(item_id)

        new_battery = game_state['flashlight_battery']
        if item['item_type'] == 'battery':
            new_battery = min(100.0, new_battery + 30.0)

        if item['item_type'] == 'key_fragment':
            fragment_count = sum(1 for i in collected_items if i.startswith('key_fragment_'))
            if fragment_count >= 3:
                collected_items = [i for i in collected_items if not i.startswith('key_fragment_')]
                collected_items.append('master_key')

        game_status = game_state['game_status']
        if item_id == 'escape_key':
            game_status = 'won'

        self.item_model.update(item_id, {'collected': 1})
        self.game_state_model.update(game_state['id'], {
            'collected_items': json.dumps(collected_items),
            'flashlight_battery': new_battery,
            'game_status': game_status
        })

        room_items = self.item_model.get_by_location(game_state['current_room'])
        room_items = [i for i in room_items if i['collected'] == 0]

        return {
            'code': 0,
            'message': '拾取成功',
            'data': {
                'item': item,
                'room_items': room_items,
                'game_state': {
                    'lives': game_state['lives'],
                    'flashlight_battery': new_battery,
                    'collected_items': collected_items,
                    'unlocked_rooms': json.loads(game_state['unlocked_rooms']),
                    'ghost_position': game_state['ghost_position'],
                    'game_status': game_status
                }
            }
        }

    def solve_puzzle(self, player_name: str, puzzle_type: str) -> Dict[str, Any]:
        game_state = self.game_state_model.get_by_player_name(player_name)
        if not game_state:
            return {
                'code': 1,
                'message': '游戏不存在，请先开始新游戏',
                'data': None
            }

        if game_state['game_status'] != 'playing':
            return {
                'code': 2,
                'message': '游戏已结束',
                'data': None
            }

        current_room = self.room_model.get_by_room_id(game_state['current_room'])
        if current_room['has_puzzle'] != 1:
            return {
                'code': 3,
                'message': '当前房间没有机关',
                'data': None
            }

        if current_room['puzzle_solved'] == 1:
            return {
                'code': 4,
                'message': '机关已经解开了',
                'data': None
            }

        if current_room['puzzle_type'] != puzzle_type:
            return {
                'code': 5,
                'message': '机关类型不匹配',
                'data': None
            }

        self.room_model.update(game_state['current_room'], {'puzzle_solved': 1})

        activated_puzzles = json.loads(game_state['activated_puzzles'])
        activated_puzzles.append(puzzle_type)
        self.game_state_model.update(game_state['id'], {
            'activated_puzzles': json.dumps(activated_puzzles)
        })

        reward = None
        if puzzle_type == 'painting_door':
            reward = '发现画框后面有一个暗门，但似乎需要在其他地方找到开关...'
        elif puzzle_type == 'bookshelf_lever':
            reward = '你拉动了书架上的一本特殊书籍，书房的门咔嗒一声打开了！'
            self.room_model.update('study', {'locked': 0})

        return {
            'code': 0,
            'message': '机关解开了',
            'data': {
                'puzzle_type': puzzle_type,
                'reward': reward,
                'game_state': {
                    'lives': game_state['lives'],
                    'flashlight_battery': game_state['flashlight_battery'],
                    'collected_items': json.loads(game_state['collected_items']),
                    'unlocked_rooms': json.loads(game_state['unlocked_rooms']),
                    'activated_puzzles': activated_puzzles,
                    'ghost_position': game_state['ghost_position'],
                    'game_status': game_state['game_status']
                }
            }
        }

    def get_map(self, player_name: str) -> Dict[str, Any]:
        game_state = self.game_state_model.get_by_player_name(player_name)
        if not game_state:
            return {
                'code': 1,
                'message': '游戏不存在，请先开始新游戏',
                'data': None
            }

        all_rooms = self.room_model.get_all()
        unlocked_rooms = json.loads(game_state['unlocked_rooms'])

        map_data = []
        for room in all_rooms:
            room_data = {
                'room_id': room['room_id'],
                'name': room['name'],
                'connections': json.loads(room['connections']),
                'unlocked': room['room_id'] in unlocked_rooms,
                'visited': room['room_id'] in unlocked_rooms,
                'locked': room['locked'] == 1,
                'has_puzzle': room['has_puzzle'] == 1,
                'puzzle_solved': room['puzzle_solved'] == 1
            }
            map_data.append(room_data)

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'rooms': map_data,
                'current_room': game_state['current_room'],
                'ghost_position': game_state['ghost_position']
            }
        }

    def use_flashlight(self, player_name: str) -> Dict[str, Any]:
        game_state = self.game_state_model.get_by_player_name(player_name)
        if not game_state:
            return {
                'code': 1,
                'message': '游戏不存在，请先开始新游戏',
                'data': None
            }

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'flashlight_battery': game_state['flashlight_battery'],
                'current_room': game_state['current_room']
            }
        }
