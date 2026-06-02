from typing import Dict, Any, List, Optional
from app.model.meng_model import LevelModel, DreamModel, UserModel


class MengLevelBusiness:
    def __init__(self):
        self.level_model = LevelModel()
        self.dream_model = DreamModel()
        self.user_model = UserModel()

    def create_level(self, user_id: int, dream_id: int, name: str, description: str,
                     level_type: str, difficulty: int, target_x: float, target_y: float,
                     target_z: float, reward: int = 0, data: Dict[str, Any] = None) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        if user.get('status') == self.user_model.STATUS_BANNED:
            return {
                'code': 1,
                'msg': '账号已被封禁，无法创建关卡',
                'data': None
            }

        dream = self.dream_model.get_by_id(dream_id)
        if not dream:
            return {
                'code': 1,
                'msg': '梦境不存在',
                'data': None
            }

        if dream.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '只能在自己的梦境中创建关卡',
                'data': None
            }

        if not name or len(name.strip()) < 2:
            return {
                'code': 1,
                'msg': '关卡名称至少2个字符',
                'data': None
            }

        valid_types = [
            self.level_model.TYPE_PUZZLE,
            self.level_model.TYPE_CHALLENGE,
            self.level_model.TYPE_EXPLORATION,
            self.level_model.TYPE_STORY,
            self.level_model.TYPE_TUTORIAL
        ]
        if level_type not in valid_types:
            return {
                'code': 1,
                'msg': '关卡类型不正确',
                'data': None
            }

        if difficulty < 1 or difficulty > 5:
            return {
                'code': 1,
                'msg': '难度范围应在1-5之间',
                'data': None
            }

        if reward < 0:
            return {
                'code': 1,
                'msg': '奖励不能为负数',
                'data': None
            }

        level_id = self.level_model.create(
            dream_id=dream_id,
            name=name.strip(),
            description=description.strip() if description else '',
            level_type=level_type,
            difficulty=difficulty,
            target_x=target_x,
            target_y=target_y,
            target_z=target_z,
            reward=reward,
            data=data
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

    def get_dream_levels(self, dream_id: int) -> Dict[str, Any]:
        dream = self.dream_model.get_by_id(dream_id)
        if not dream:
            return {
                'code': 1,
                'msg': '梦境不存在',
                'data': None
            }

        levels = self.level_model.get_by_dream(dream_id)
        items = [self.level_model.to_dict(level) for level in levels]

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': len(items)
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

    def update_level(self, user_id: int, dream_id: int, level_id: int,
                     data: Dict[str, Any]) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        dream = self.dream_model.get_by_id(dream_id)
        if not dream:
            return {
                'code': 1,
                'msg': '梦境不存在',
                'data': None
            }

        if dream.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '只能修改自己梦境中的关卡',
                'data': None
            }

        level = self.level_model.get_by_id(level_id)
        if not level:
            return {
                'code': 1,
                'msg': '关卡不存在',
                'data': None
            }

        if level.get('dream_id') != dream_id:
            return {
                'code': 1,
                'msg': '关卡不属于该梦境',
                'data': None
            }

        if 'name' in data:
            if not data['name'] or len(data['name'].strip()) < 2:
                return {
                    'code': 1,
                    'msg': '关卡名称至少2个字符',
                    'data': None
                }
            data['name'] = data['name'].strip()

        if 'description' in data:
            data['description'] = data['description'].strip() if data['description'] else ''

        if 'level_type' in data:
            valid_types = [
                self.level_model.TYPE_PUZZLE,
                self.level_model.TYPE_CHALLENGE,
                self.level_model.TYPE_EXPLORATION,
                self.level_model.TYPE_STORY
            ]
            if data['level_type'] not in valid_types:
                return {
                    'code': 1,
                    'msg': '关卡类型不正确',
                    'data': None
                }

        if 'difficulty' in data:
            if data['difficulty'] < 1 or data['difficulty'] > 5:
                return {
                    'code': 1,
                    'msg': '难度范围应在1-5之间',
                    'data': None
                }

        if 'reward' in data and data['reward'] < 0:
            return {
                'code': 1,
                'msg': '奖励不能为负数',
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

    def delete_level(self, user_id: int, dream_id: int, level_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        dream = self.dream_model.get_by_id(dream_id)
        if not dream:
            return {
                'code': 1,
                'msg': '梦境不存在',
                'data': None
            }

        if dream.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '只能删除自己梦境中的关卡',
                'data': None
            }

        level = self.level_model.get_by_id(level_id)
        if not level:
            return {
                'code': 1,
                'msg': '关卡不存在',
                'data': None
            }

        if level.get('dream_id') != dream_id:
            return {
                'code': 1,
                'msg': '关卡不属于该梦境',
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

    def complete_level(self, user_id: int, level_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        if user.get('status') == self.user_model.STATUS_BANNED:
            return {
                'code': 1,
                'msg': '账号已被封禁',
                'data': None
            }

        level = self.level_model.get_by_id(level_id)
        if not level:
            return {
                'code': 1,
                'msg': '关卡不存在',
                'data': None
            }

        if level.get('is_completed') == 1:
            return {
                'code': 1,
                'msg': '该关卡已完成',
                'data': None
            }

        dream = self.dream_model.get_by_id(level.get('dream_id'))
        if not dream:
            return {
                'code': 1,
                'msg': '关联梦境不存在',
                'data': None
            }

        affected = self.level_model.mark_completed(level_id)
        if affected <= 0:
            return {
                'code': 1,
                'msg': '关卡完成失败',
                'data': None
            }

        reward_fragments = level.get('reward', 0)
        exp_reward = level.get('difficulty', 1) * 20

        fragments_affected = self.user_model.update_dream_fragments(user_id, reward_fragments)
        exp_result = self.user_model.add_experience(user_id, exp_reward)

        updated_user = self.user_model.get_by_id(user_id)
        updated_level = self.level_model.get_by_id(level_id)

        return {
            'code': 0,
            'msg': '关卡完成',
            'data': {
                'level': self.level_model.to_dict(updated_level),
                'reward': {
                    'dream_fragments': reward_fragments,
                    'experience': exp_reward
                },
                'user': {
                    'dream_fragments': updated_user.get('dream_fragments'),
                    'level': updated_user.get('level'),
                    'experience': updated_user.get('experience')
                },
                'level_up': exp_result.get('level_up', False),
                'new_level': exp_result.get('new_level', updated_user.get('level'))
            }
        }

    def get_user_completed_levels(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        dreams_result = self.dream_model.get_by_user(user_id, page_size=1000)
        dream_ids = [d.get('id') for d in dreams_result.get('items', [])]

        completed_levels = []
        for dream_id in dream_ids:
            levels = self.level_model.get_by_dream(dream_id)
            for level in levels:
                if level.get('is_completed') == 1:
                    level_data = self.level_model.to_dict(level)
                    level_data['dream_name'] = next(
                        (d.get('name') for d in dreams_result.get('items', []) if d.get('id') == dream_id),
                        ''
                    )
                    completed_levels.append(level_data)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': completed_levels,
                'total': len(completed_levels)
            }
        }
