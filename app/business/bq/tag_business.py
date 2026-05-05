from typing import Dict, Any, List, Optional
from app.model.bq import BqTagModel


class BqTagBusiness:
    def __init__(self):
        self.tag_model = BqTagModel()

    def get_list(self, user_id: int, limit: int = 50) -> Dict[str, Any]:
        tags = self.tag_model.get_user_tags(user_id, limit)
        items = [self.tag_model.to_dict(tag) for tag in tags]
        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def search(self, user_id: int, keyword: str, limit: int = 20) -> Dict[str, Any]:
        if not keyword or len(keyword.strip()) == 0:
            return {
                'code': 0,
                'msg': 'success',
                'data': []
            }

        tags = self.tag_model.search_user_tags(user_id, keyword.strip(), limit)
        items = [self.tag_model.to_dict(tag) for tag in tags]
        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def create(self, user_id: int, name: str) -> Dict[str, Any]:
        if not name or len(name.strip()) == 0:
            return {
                'code': 1,
                'msg': '标签名称不能为空',
                'data': None
            }

        name = name.strip()
        existing = self.tag_model.get_by_name_and_user(name, user_id)
        if existing:
            return {
                'code': 0,
                'msg': '标签已存在',
                'data': self.tag_model.to_dict(existing)
            }

        tag_id = self.tag_model.create(user_id, name, 0)
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

    def delete(self, user_id: int, tag_id: int) -> Dict[str, Any]:
        tag = self.tag_model.get_by_id(tag_id)
        if not tag or tag.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '标签不存在',
                'data': None
            }

        if tag.get('count', 0) > 0:
            return {
                'code': 1,
                'msg': '该标签正在使用中，无法删除',
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
