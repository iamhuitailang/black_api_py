from typing import Dict, Any, Optional
from app.model.cai import RoomModel, AnimalModel


class CaiRoomBusiness:
    def __init__(self):
        self.room_model = RoomModel()
        self.animal_model = AnimalModel()

    def create_room(self, mode: int, player_name: str, player_id: int = 0, max_rounds: int = 5, time_limit: int = 60) -> Dict[str, Any]:
        if not player_name:
            return {
                'code': 1,
                'msg': '玩家名称不能为空',
                'data': None
            }

        if mode not in [RoomModel.MODE_SINGLE, RoomModel.MODE_DOUBLE]:
            return {
                'code': 1,
                'msg': '无效的游戏模式',
                'data': None
            }

        room_id = self.room_model.create(mode, player_name, player_id, max_rounds, time_limit)
        if room_id > 0:
            room = self.room_model.get_by_id(room_id)
            return {
                'code': 0,
                'msg': '创建房间成功',
                'data': self.room_model.to_dict(room)
            }

        return {
            'code': 1,
            'msg': '创建房间失败',
            'data': None
        }

    def get_room_by_id(self, room_id: int) -> Dict[str, Any]:
        room = self.room_model.get_by_id(room_id)
        if not room:
            return {
                'code': 1,
                'msg': '房间不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.room_model.to_dict(room)
        }

    def get_room_by_code(self, room_code: str) -> Dict[str, Any]:
        room = self.room_model.get_by_code(room_code)
        if not room:
            return {
                'code': 1,
                'msg': '房间不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.room_model.to_dict(room)
        }

    def join_room(self, room_code: str, player_name: str, player_id: int = 0) -> Dict[str, Any]:
        if not player_name:
            return {
                'code': 1,
                'msg': '玩家名称不能为空',
                'data': None
            }

        room = self.room_model.get_by_code(room_code)
        if not room:
            return {
                'code': 1,
                'msg': '房间不存在',
                'data': None
            }

        if room.get('status') != RoomModel.STATUS_WAITING:
            return {
                'code': 1,
                'msg': '房间不可加入',
                'data': None
            }

        if room.get('mode') != RoomModel.MODE_DOUBLE:
            return {
                'code': 1,
                'msg': '该房间不是双人模式',
                'data': None
            }

        affected = self.room_model.join_room(room.get('id'), player_name, player_id)
        if affected > 0:
            updated_room = self.room_model.get_by_id(room.get('id'))
            return {
                'code': 0,
                'msg': '加入房间成功',
                'data': self.room_model.to_dict(updated_room)
            }

        return {
            'code': 1,
            'msg': '加入房间失败',
            'data': None
        }

    def start_game(self, room_id: int) -> Dict[str, Any]:
        room = self.room_model.get_by_id(room_id)
        if not room:
            return {
                'code': 1,
                'msg': '房间不存在',
                'data': None
            }

        animal = self.animal_model.get_random()
        if not animal:
            return {
                'code': 1,
                'msg': '没有可用的题目',
                'data': None
            }

        self.room_model.update_current_animal(room_id, animal.get('id'), animal.get('name'))
        self.room_model.update_status(room_id, RoomModel.STATUS_PLAYING)

        updated_room = self.room_model.get_by_id(room_id)
        return {
            'code': 0,
            'msg': '游戏开始',
            'data': self.room_model.to_dict(updated_room)
        }

    def update_room_status(self, room_id: int, status: int) -> Dict[str, Any]:
        room = self.room_model.get_by_id(room_id)
        if not room:
            return {
                'code': 1,
                'msg': '房间不存在',
                'data': None
            }

        affected = self.room_model.update_status(room_id, status)
        if affected >= 0:
            updated_room = self.room_model.get_by_id(room_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.room_model.to_dict(updated_room)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def add_score(self, room_id: int, player_num: int, score: int) -> Dict[str, Any]:
        room = self.room_model.get_by_id(room_id)
        if not room:
            return {
                'code': 1,
                'msg': '房间不存在',
                'data': None
            }

        affected = self.room_model.add_score(room_id, player_num, score)
        if affected >= 0:
            updated_room = self.room_model.get_by_id(room_id)
            return {
                'code': 0,
                'msg': '加分成功',
                'data': self.room_model.to_dict(updated_room)
            }

        return {
            'code': 1,
            'msg': '加分失败',
            'data': None
        }

    def next_round(self, room_id: int, level: int = None) -> Dict[str, Any]:
        room = self.room_model.get_by_id(room_id)
        if not room:
            return {
                'code': 1,
                'msg': '房间不存在',
                'data': None
            }

        current_round = room.get('round', 1)
        max_rounds = room.get('max_rounds', 5)

        if current_round >= max_rounds * 2:
            self.room_model.update_status(room_id, RoomModel.STATUS_FINISHED)
            updated_room = self.room_model.get_by_id(room_id)
            return {
                'code': 0,
                'msg': '游戏结束',
                'data': self.room_model.to_dict(updated_room)
            }

        self.room_model.next_round(room_id)

        exclude_ids = []
        animal = self.animal_model.get_random_by_level(level, exclude_ids) if level else self.animal_model.get_random(exclude_ids)
        if animal:
            self.room_model.update_current_animal(room_id, animal.get('id'), animal.get('name'))

        updated_room = self.room_model.get_by_id(room_id)
        return {
            'code': 0,
            'msg': '进入下一轮',
            'data': self.room_model.to_dict(updated_room)
        }

    def delete_room(self, room_id: int) -> Dict[str, Any]:
        room = self.room_model.get_by_id(room_id)
        if not room:
            return {
                'code': 1,
                'msg': '房间不存在',
                'data': None
            }

        affected = self.room_model.delete(room_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '删除成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '删除失败',
            'data': None
        }

    def get_waiting_rooms(self) -> Dict[str, Any]:
        rooms = self.room_model.get_waiting_rooms()
        return {
            'code': 0,
            'msg': 'success',
            'data': [self.room_model.to_dict(r) for r in rooms]
        }

    def get_room_list(self, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        result = self.room_model.get_list(page, page_size, status)
        items = [self.room_model.to_dict(item) for item in result.get('items', [])]

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
