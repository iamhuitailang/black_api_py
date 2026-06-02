from typing import Dict, Any, List, Optional
from app.model.majiang_model import AiModel


class MajiangAiBusiness:
    def __init__(self):
        self.ai_model = AiModel()

    def create_ai(self, name: str, difficulty: int, description: str = '',
                  avatar: str = '', think_time: int = 1000,
                  risk_tolerance: float = 0.5) -> Dict[str, Any]:
        if not name:
            return {
                'code': 1,
                'msg': 'AI名称不能为空',
                'data': None
            }

        if difficulty not in [1, 2, 3]:
            return {
                'code': 1,
                'msg': '难度值不正确，只能是1、2、3',
                'data': None
            }

        existing = self.ai_model.get_by_name(name)
        if existing:
            return {
                'code': 1,
                'msg': '该AI名称已存在',
                'data': None
            }

        ai_id = self.ai_model.create(name, difficulty, description, avatar, think_time, risk_tolerance)
        if ai_id > 0:
            ai = self.ai_model.get_by_id(ai_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.ai_model.to_dict(ai)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def get_ai_list(self, page: int = 1, page_size: int = 10,
                    difficulty: int = None, status: int = None) -> Dict[str, Any]:
        result = self.ai_model.get_all(page, page_size, difficulty, status)
        items = [self.ai_model.to_dict(item) for item in result.get('items', [])]

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

    def get_all_active_ai(self) -> Dict[str, Any]:
        ais = self.ai_model.get_all_active()
        items = [self.ai_model.to_dict(ai) for ai in ais]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_ai_by_id(self, ai_id: int) -> Dict[str, Any]:
        ai = self.ai_model.get_by_id(ai_id)
        if not ai:
            return {
                'code': 1,
                'msg': 'AI不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.ai_model.to_dict(ai)
        }

    def get_ai_by_difficulty(self, difficulty: int) -> Dict[str, Any]:
        ais = self.ai_model.get_by_difficulty(difficulty)
        items = [self.ai_model.to_dict(ai) for ai in ais]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def update_ai(self, ai_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        ai = self.ai_model.get_by_id(ai_id)
        if not ai:
            return {
                'code': 1,
                'msg': 'AI不存在',
                'data': None
            }

        if 'name' in data:
            existing = self.ai_model.get_by_name(data['name'])
            if existing and existing.get('id') != ai_id:
                return {
                    'code': 1,
                    'msg': '该AI名称已存在',
                    'data': None
                }

        affected = self.ai_model.update(ai_id, data)
        if affected >= 0:
            updated_ai = self.ai_model.get_by_id(ai_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.ai_model.to_dict(updated_ai)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_ai(self, ai_id: int) -> Dict[str, Any]:
        ai = self.ai_model.get_by_id(ai_id)
        if not ai:
            return {
                'code': 1,
                'msg': 'AI不存在',
                'data': None
            }

        affected = self.ai_model.delete(ai_id)
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

    def enable_ai(self, ai_id: int) -> Dict[str, Any]:
        return self.update_ai(ai_id, {'status': 1})

    def disable_ai(self, ai_id: int) -> Dict[str, Any]:
        return self.update_ai(ai_id, {'status': 0})
