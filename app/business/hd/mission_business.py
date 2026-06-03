from typing import Dict, Any, Optional, List
from app.model.hd_model import MissionModel, UserMissionModel, UserModel


class HdMissionBusiness:
    def __init__(self):
        self.mission_model = MissionModel()
        self.user_mission_model = UserMissionModel()
        self.user_model = UserModel()

    def get_all_missions(self, mission_type: Optional[int] = None,
                         page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.mission_model.get_all(
            page=page,
            page_size=page_size,
            mission_type=mission_type
        )

        items = [self.mission_model.to_dict(mission) for mission in result.get('items', [])]

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

    def get_user_missions(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        self.user_mission_model.init_user_missions(user_id)

        user_missions = self.user_mission_model.get_user_missions(user_id)
        items = []
        for um in user_missions:
            mission_data = self.mission_model.to_dict(um)
            mission_data.update({
                'user_mission_id': um.get('id'),
                'progress': um.get('progress', 0),
                'is_completed': um.get('is_completed', 0),
                'is_claimed': um.get('is_claimed', 0),
                'completed_at': um.get('completed_at')
            })
            items.append(mission_data)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items
            }
        }

    def update_mission_progress(self, user_id: int, mission_type: str, value: int = 1) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        completed_missions = self.user_mission_model.update_progress(user_id, mission_type, value)

        return {
            'code': 0,
            'msg': '进度更新成功',
            'data': {
                'completed_missions': completed_missions
            }
        }

    def claim_reward(self, user_id: int, user_mission_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        user_mission = self.user_mission_model.get_by_id(user_mission_id)
        if not user_mission:
            return {
                'code': 1,
                'msg': '任务记录不存在',
                'data': None
            }

        if user_mission.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '只能领取自己的任务奖励',
                'data': None
            }

        if user_mission.get('is_completed') != 1:
            return {
                'code': 1,
                'msg': '任务尚未完成',
                'data': None
            }

        if user_mission.get('is_claimed') == 1:
            return {
                'code': 1,
                'msg': '奖励已领取',
                'data': None
            }

        result = self.user_mission_model.claim_reward(user_mission_id, user_id)
        if not result:
            return {
                'code': 1,
                'msg': '领取奖励失败',
                'data': None
            }

        reward_exp = result.get('reward_exp', 0)
        reward_gold = result.get('reward_gold', 0)

        if reward_exp > 0:
            self.user_model.add_exp(user_id, reward_exp)
        if reward_gold > 0:
            self.user_model.update_gold(user_id, reward_gold)

        return {
            'code': 0,
            'msg': '奖励领取成功',
            'data': {
                'mission_name': result.get('mission_name'),
                'reward_exp': reward_exp,
                'reward_gold': reward_gold
            }
        }

    def refresh_daily_missions(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        count = self.user_mission_model.refresh_daily(user_id)

        return {
            'code': 0,
            'msg': '每日任务刷新成功',
            'data': {
                'refreshed_count': count
            }
        }

    def create_mission(self, data: Dict[str, Any]) -> Dict[str, Any]:
        required_fields = ['name', 'description', 'type', 'target_type',
                           'target_value', 'reward_exp', 'reward_gold', 'is_daily']
        for field in required_fields:
            if field not in data:
                return {
                    'code': 1,
                    'msg': f'缺少必要参数: {field}',
                    'data': None
                }

        mission_id = self.mission_model.create(
            name=data['name'],
            description=data['description'],
            mission_type=data['type'],
            target_type=data['target_type'],
            target_value=data['target_value'],
            reward_exp=data['reward_exp'],
            reward_gold=data['reward_gold'],
            is_daily=data['is_daily']
        )

        if mission_id > 0:
            mission = self.mission_model.get_by_id(mission_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.mission_model.to_dict(mission)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_mission(self, mission_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        mission = self.mission_model.get_by_id(mission_id)
        if not mission:
            return {
                'code': 1,
                'msg': '任务不存在',
                'data': None
            }

        affected = self.mission_model.update(mission_id, data)
        if affected >= 0:
            updated_mission = self.mission_model.get_by_id(mission_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.mission_model.to_dict(updated_mission)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_mission(self, mission_id: int) -> Dict[str, Any]:
        mission = self.mission_model.get_by_id(mission_id)
        if not mission:
            return {
                'code': 1,
                'msg': '任务不存在',
                'data': None
            }

        affected = self.mission_model.delete(mission_id)
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
