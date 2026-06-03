from typing import Dict, Any, Optional
from app.model.hd_model import LevelModel, UserLevelModel, UserModel


class HdLevelBusiness:
    def __init__(self):
        self.level_model = LevelModel()
        self.user_level_model = UserLevelModel()
        self.user_model = UserModel()

    def get_all_levels(self, difficulty: Optional[int] = None,
                       page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.level_model.get_all(
            page=page,
            page_size=page_size,
            difficulty=difficulty
        )

        items = [self.level_model.to_dict(level) for level in result.get('items', [])]

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

    def get_user_levels(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        levels = self.user_level_model.get_user_levels(user_id)
        items = []
        for level in levels:
            level_data = self.level_model.to_dict(level)
            level_data.update({
                'best_score': level.get('best_score', 0),
                'best_time': level.get('best_time', 0),
                'stars': level.get('stars', 0),
                'is_completed': level.get('is_completed', 0),
                'play_count': level.get('play_count', 0),
                'last_play_at': level.get('last_play_at')
            })
            items.append(level_data)

        progress = self.user_level_model.get_progress(user_id)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'progress': progress
            }
        }

    def start_level(self, user_id: int, level_id: int) -> Dict[str, Any]:
        result = self.user_level_model.start_level(user_id, level_id)
        if not result.get('success'):
            return {
                'code': 1,
                'msg': result.get('message', '开始关卡失败'),
                'data': None
            }

        return {
            'code': 0,
            'msg': result.get('message', '开始游戏'),
            'data': result.get('level')
        }

    def complete_level(self, user_id: int, level_id: int,
                       score: int, time: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        result = self.user_level_model.complete_level(user_id, level_id, score, time)
        if not result.get('success'):
            return {
                'code': 1,
                'msg': result.get('message', '完成关卡失败'),
                'data': None
            }

        reward_exp = result.get('reward_exp', 0)
        reward_gold = result.get('reward_gold', 0)

        if reward_exp > 0 or reward_gold > 0:
            updated_user = self.user_model.get_by_id(user_id)

        return {
            'code': 0,
            'msg': result.get('message', '关卡完成'),
            'data': {
                'stars': result.get('stars', 0),
                'is_new_record': result.get('is_new_record', False),
                'reward_exp': reward_exp,
                'reward_gold': reward_gold,
                'user_level': self.user_level_model.get_user_level(user_id, level_id)
            }
        }

    def get_level_detail(self, level_id: int) -> Dict[str, Any]:
        level = self.level_model.get_by_id(level_id)
        if not level:
            return {
                'code': 1,
                'msg': '关卡不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.level_model.to_dict(level)
        }

    def create_level(self, data: Dict[str, Any]) -> Dict[str, Any]:
        required_fields = ['name', 'description', 'type', 'difficulty',
                           'unlock_level', 'reward_exp', 'reward_gold',
                           'enemy_count', 'time_limit', 'map_data']
        for field in required_fields:
            if field not in data:
                return {
                    'code': 1,
                    'msg': f'缺少必要参数: {field}',
                    'data': None
                }

        level_id = self.level_model.create(
            name=data['name'],
            description=data['description'],
            level_type=data['type'],
            difficulty=data['difficulty'],
            unlock_level=data['unlock_level'],
            reward_exp=data['reward_exp'],
            reward_gold=data['reward_gold'],
            enemy_count=data['enemy_count'],
            time_limit=data['time_limit'],
            map_data=data['map_data']
        )

        if level_id > 0:
            level = self.level_model.get_by_id(level_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.level_model.to_dict(level)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_level(self, level_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        level = self.level_model.get_by_id(level_id)
        if not level:
            return {
                'code': 1,
                'msg': '关卡不存在',
                'data': None
            }

        affected = self.level_model.update(level_id, data)
        if affected >= 0:
            updated_level = self.level_model.get_by_id(level_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.level_model.to_dict(updated_level)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_level(self, level_id: int) -> Dict[str, Any]:
        level = self.level_model.get_by_id(level_id)
        if not level:
            return {
                'code': 1,
                'msg': '关卡不存在',
                'data': None
            }

        affected = self.level_model.delete(level_id)
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
