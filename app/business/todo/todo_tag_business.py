from typing import Dict, Any, List, Optional
from app.model.todo import TodoTaskTagModel


class TodoTagBusiness:
    def __init__(self):
        self.tag_model = TodoTaskTagModel()

    def _check_owner(self, tag_id: int, user_id: int) -> bool:
        tag = self.tag_model.get_by_id(tag_id)
        if not tag:
            return False
        return tag.get('user_id') == user_id

    def create(self, user_id: int, name: str, color: str = '#67C23A') -> Dict[str, Any]:
        if not name or len(name) < 1:
            return {
                'code': 1,
                'msg': '标签名称不能为空',
                'data': None
            }

        existing = self.tag_model.get_by_name(user_id, name)
        if existing:
            return {
                'code': 1,
                'msg': '该标签已存在',
                'data': None
            }

        tag_id = self.tag_model.create(user_id, name, color)
        if tag_id > 0:
            tag = self.tag_model.get_by_id(tag_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.tag_model.to_dict(tag)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update(self, tag_id: int, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        if not self._check_owner(tag_id, user_id):
            return {
                'code': 1,
                'msg': '标签不存在或无权限操作',
                'data': None
            }

        affected = self.tag_model.update(tag_id, data)
        if affected >= 0:
            updated_tag = self.tag_model.get_by_id(tag_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.tag_model.to_dict(updated_tag)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete(self, tag_id: int, user_id: int) -> Dict[str, Any]:
        if not self._check_owner(tag_id, user_id):
            return {
                'code': 1,
                'msg': '标签不存在或无权限操作',
                'data': None
            }

        affected = self.tag_model.delete(tag_id)
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

    def get_all(self, user_id: int) -> Dict[str, Any]:
        tags = self.tag_model.get_by_user_id(user_id)
        items = [self.tag_model.to_dict(t) for t in tags]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }
