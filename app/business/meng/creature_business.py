from typing import Dict, Any, List, Optional
from app.model.meng_model import CreatureModel, DreamModel


class MengCreatureBusiness:
    def __init__(self):
        self.creature_model = CreatureModel()
        self.dream_model = DreamModel()

    def _check_dream_owner(self, user_id: int, dream_id: int) -> Optional[Dict[str, Any]]:
        dream = self.dream_model.get_by_id(dream_id)
        if not dream:
            return None
        if dream.get('user_id') != user_id:
            return None
        return dream

    def create_creature(self, user_id: int, dream_id: int, name: str, creature_type: str,
                        x: float, y: float, z: float, behavior: str = 'wander',
                        script: Dict[str, Any] = None, properties: Dict[str, Any] = None) -> Dict[str, Any]:
        try:
            dream = self._check_dream_owner(user_id, dream_id)
            if not dream:
                return {
                    'code': 1,
                    'msg': '梦境不存在或无权限操作',
                    'data': None
                }

            creature_id = self.creature_model.create(
                dream_id=dream_id,
                name=name,
                creature_type=creature_type,
                x=x,
                y=y,
                z=z,
                behavior=behavior,
                script=script,
                properties=properties
            )

            if creature_id > 0:
                creature = self.creature_model.get_by_id(creature_id)
                return {
                    'code': 0,
                    'msg': '创建成功',
                    'data': self.creature_model.to_dict(creature)
                }

            return {
                'code': 1,
                'msg': '创建失败',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'msg': str(e),
                'data': None
            }

    def get_dream_creatures(self, dream_id: int) -> Dict[str, Any]:
        try:
            dream = self.dream_model.get_by_id(dream_id)
            if not dream:
                return {
                    'code': 1,
                    'msg': '梦境不存在',
                    'data': None
                }

            creatures = self.creature_model.get_by_dream(dream_id)
            result = [self.creature_model.to_dict(creature) for creature in creatures]

            return {
                'code': 0,
                'msg': 'success',
                'data': result
            }
        except Exception as e:
            return {
                'code': 1,
                'msg': str(e),
                'data': None
            }

    def get_creature_detail(self, creature_id: int) -> Dict[str, Any]:
        try:
            creature = self.creature_model.get_by_id(creature_id)
            if not creature:
                return {
                    'code': 1,
                    'msg': '生物不存在',
                    'data': None
                }

            return {
                'code': 0,
                'msg': 'success',
                'data': self.creature_model.to_dict(creature)
            }
        except Exception as e:
            return {
                'code': 1,
                'msg': str(e),
                'data': None
            }

    def update_creature(self, user_id: int, dream_id: int, creature_id: int,
                        data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            dream = self._check_dream_owner(user_id, dream_id)
            if not dream:
                return {
                    'code': 1,
                    'msg': '梦境不存在或无权限操作',
                    'data': None
                }

            creature = self.creature_model.get_by_id(creature_id)
            if not creature:
                return {
                    'code': 1,
                    'msg': '生物不存在',
                    'data': None
                }

            if creature.get('dream_id') != dream_id:
                return {
                    'code': 1,
                    'msg': '生物不属于该梦境',
                    'data': None
                }

            affected = self.creature_model.update(creature_id, data)
            if affected >= 0:
                updated_creature = self.creature_model.get_by_id(creature_id)
                return {
                    'code': 0,
                    'msg': '更新成功',
                    'data': self.creature_model.to_dict(updated_creature)
                }

            return {
                'code': 1,
                'msg': '更新失败',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'msg': str(e),
                'data': None
            }

    def delete_creature(self, user_id: int, dream_id: int, creature_id: int) -> Dict[str, Any]:
        try:
            dream = self._check_dream_owner(user_id, dream_id)
            if not dream:
                return {
                    'code': 1,
                    'msg': '梦境不存在或无权限操作',
                    'data': None
                }

            creature = self.creature_model.get_by_id(creature_id)
            if not creature:
                return {
                    'code': 1,
                    'msg': '生物不存在',
                    'data': None
                }

            if creature.get('dream_id') != dream_id:
                return {
                    'code': 1,
                    'msg': '生物不属于该梦境',
                    'data': None
                }

            affected = self.creature_model.delete(creature_id)
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
        except Exception as e:
            return {
                'code': 1,
                'msg': str(e),
                'data': None
            }

    def batch_create_creatures(self, user_id: int, dream_id: int,
                               creatures: List[Dict[str, Any]]) -> Dict[str, Any]:
        try:
            dream = self._check_dream_owner(user_id, dream_id)
            if not dream:
                return {
                    'code': 1,
                    'msg': '梦境不存在或无权限操作',
                    'data': None
                }

            if not creatures:
                return {
                    'code': 1,
                    'msg': '生物列表不能为空',
                    'data': None
                }

            count = 0
            for creature_data in creatures:
                creature_id = self.creature_model.create(
                    dream_id=dream_id,
                    name=creature_data.get('name', ''),
                    creature_type=creature_data.get('creature_type', 'npc'),
                    x=creature_data.get('x', 0),
                    y=creature_data.get('y', 0),
                    z=creature_data.get('z', 0),
                    behavior=creature_data.get('behavior', 'wander'),
                    script=creature_data.get('script'),
                    properties=creature_data.get('properties')
                )
                if creature_id > 0:
                    count += 1

            if count > 0:
                return {
                    'code': 0,
                    'msg': f'成功创建 {count} 个生物',
                    'data': {'count': count}
                }

            return {
                'code': 1,
                'msg': '批量创建失败',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'msg': str(e),
                'data': None
            }

    def clear_dream_creatures(self, user_id: int, dream_id: int) -> Dict[str, Any]:
        try:
            dream = self._check_dream_owner(user_id, dream_id)
            if not dream:
                return {
                    'code': 1,
                    'msg': '梦境不存在或无权限操作',
                    'data': None
                }

            count = self.creature_model.delete_by_dream(dream_id)

            return {
                'code': 0,
                'msg': f'成功清空 {count} 个生物',
                'data': {'count': count}
            }
        except Exception as e:
            return {
                'code': 1,
                'msg': str(e),
                'data': None
            }
