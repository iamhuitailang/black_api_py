from typing import Dict, Any, List, Optional
from app.model.meng_model import BlockModel, DreamModel, InventoryModel


class MengBlockBusiness:
    def __init__(self):
        self.block_model = BlockModel()
        self.dream_model = DreamModel()
        self.inventory_model = InventoryModel()

    def _check_dream_owner(self, user_id: int, dream_id: int) -> Optional[Dict[str, Any]]:
        dream = self.dream_model.get_by_id(dream_id)
        if not dream:
            return None
        if dream.get('user_id') != user_id:
            return None
        return dream

    def place_block(self, user_id: int, dream_id: int, x: int, y: int, z: int,
                    block_type: str, color: str = '#ffffff',
                    properties: Dict[str, Any] = None) -> Dict[str, Any]:
        try:
            dream = self._check_dream_owner(user_id, dream_id)
            if not dream:
                return {
                    'code': 1,
                    'msg': '梦境不存在或无权限操作',
                    'data': None
                }

            existing_block = self.block_model.get_by_position(dream_id, x, y, z)
            if existing_block:
                return {
                    'code': 1,
                    'msg': '该位置已有方块',
                    'data': None
                }

            block_id = self.block_model.create(
                dream_id=dream_id,
                x=x,
                y=y,
                z=z,
                block_type=block_type,
                color=color,
                properties=properties
            )

            if block_id > 0:
                block = self.block_model.get_by_id(block_id)
                return {
                    'code': 0,
                    'msg': '放置成功',
                    'data': self.block_model.to_dict(block)
                }

            return {
                'code': 1,
                'msg': '放置失败',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'msg': str(e),
                'data': None
            }

    def batch_place_blocks(self, user_id: int, dream_id: int,
                           blocks: List[Dict[str, Any]]) -> Dict[str, Any]:
        try:
            dream = self._check_dream_owner(user_id, dream_id)
            if not dream:
                return {
                    'code': 1,
                    'msg': '梦境不存在或无权限操作',
                    'data': None
                }

            if not blocks:
                return {
                    'code': 1,
                    'msg': '方块列表不能为空',
                    'data': None
                }

            for block in blocks:
                block['dream_id'] = dream_id

            count = self.block_model.batch_create(blocks)

            if count > 0:
                return {
                    'code': 0,
                    'msg': f'成功放置 {count} 个方块',
                    'data': {'count': count}
                }

            return {
                'code': 1,
                'msg': '批量放置失败',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'msg': str(e),
                'data': None
            }

    def remove_block(self, user_id: int, dream_id: int, block_id: int) -> Dict[str, Any]:
        try:
            dream = self._check_dream_owner(user_id, dream_id)
            if not dream:
                return {
                    'code': 1,
                    'msg': '梦境不存在或无权限操作',
                    'data': None
                }

            block = self.block_model.get_by_id(block_id)
            if not block:
                return {
                    'code': 1,
                    'msg': '方块不存在',
                    'data': None
                }

            if block.get('dream_id') != dream_id:
                return {
                    'code': 1,
                    'msg': '方块不属于该梦境',
                    'data': None
                }

            affected = self.block_model.delete(block_id)
            if affected > 0:
                return {
                    'code': 0,
                    'msg': '移除成功',
                    'data': None
                }

            return {
                'code': 1,
                'msg': '移除失败',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'msg': str(e),
                'data': None
            }

    def get_dream_blocks(self, dream_id: int) -> Dict[str, Any]:
        try:
            dream = self.dream_model.get_by_id(dream_id)
            if not dream:
                return {
                    'code': 1,
                    'msg': '梦境不存在',
                    'data': None
                }

            blocks = self.block_model.get_by_dream(dream_id)
            result = [self.block_model.to_dict(block) for block in blocks]

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

    def get_block_at_position(self, dream_id: int, x: int, y: int, z: int) -> Dict[str, Any]:
        try:
            dream = self.dream_model.get_by_id(dream_id)
            if not dream:
                return {
                    'code': 1,
                    'msg': '梦境不存在',
                    'data': None
                }

            block = self.block_model.get_by_position(dream_id, x, y, z)
            if block:
                return {
                    'code': 0,
                    'msg': 'success',
                    'data': self.block_model.to_dict(block)
                }

            return {
                'code': 0,
                'msg': '该位置无方块',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'msg': str(e),
                'data': None
            }

    def update_block(self, user_id: int, dream_id: int, block_id: int,
                     data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            dream = self._check_dream_owner(user_id, dream_id)
            if not dream:
                return {
                    'code': 1,
                    'msg': '梦境不存在或无权限操作',
                    'data': None
                }

            block = self.block_model.get_by_id(block_id)
            if not block:
                return {
                    'code': 1,
                    'msg': '方块不存在',
                    'data': None
                }

            if block.get('dream_id') != dream_id:
                return {
                    'code': 1,
                    'msg': '方块不属于该梦境',
                    'data': None
                }

            affected = self.block_model.update(block_id, data)
            if affected >= 0:
                updated_block = self.block_model.get_by_id(block_id)
                return {
                    'code': 0,
                    'msg': '更新成功',
                    'data': self.block_model.to_dict(updated_block)
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

    def clear_dream_blocks(self, user_id: int, dream_id: int) -> Dict[str, Any]:
        try:
            dream = self._check_dream_owner(user_id, dream_id)
            if not dream:
                return {
                    'code': 1,
                    'msg': '梦境不存在或无权限操作',
                    'data': None
                }

            count = self.block_model.delete_by_dream(dream_id)

            return {
                'code': 0,
                'msg': f'成功清空 {count} 个方块',
                'data': {'count': count}
            }
        except Exception as e:
            return {
                'code': 1,
                'msg': str(e),
                'data': None
            }

    def batch_remove_blocks(self, user_id: int, dream_id: int,
                            block_ids: List[int]) -> Dict[str, Any]:
        try:
            dream = self._check_dream_owner(user_id, dream_id)
            if not dream:
                return {
                    'code': 1,
                    'msg': '梦境不存在或无权限操作',
                    'data': None
                }

            if not block_ids:
                return {
                    'code': 1,
                    'msg': '方块ID列表不能为空',
                    'data': None
                }

            count = self.block_model.batch_delete(block_ids)

            if count > 0:
                return {
                    'code': 0,
                    'msg': f'成功移除 {count} 个方块',
                    'data': {'count': count}
                }

            return {
                'code': 1,
                'msg': '批量移除失败',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'msg': str(e),
                'data': None
            }
