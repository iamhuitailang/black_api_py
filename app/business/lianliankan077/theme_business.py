from typing import Dict, Any
from app.model.lianliankan077 import LlkThemeModel


class LlkThemeBusiness:
    def __init__(self):
        self.theme_model = LlkThemeModel()

    def get_active_themes(self) -> Dict[str, Any]:
        themes = self.theme_model.get_active_themes()
        items = [self.theme_model.to_dict(t) for t in themes]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_theme_by_id(self, theme_id: int) -> Dict[str, Any]:
        theme = self.theme_model.get_by_id(theme_id)
        if not theme:
            return {
                'code': 1,
                'msg': '主题不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.theme_model.to_dict(theme)
        }

    def get_theme_list(self, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        result = self.theme_model.get_all(page, page_size, status)
        items = [self.theme_model.to_dict(t) for t in result.get('items', [])]

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

    def create_theme(self, name: str, icon: str, items_json: str, description: str = '',
                     rows: int = 4, cols: int = 6, difficulty: int = 1, sort_order: int = 0) -> Dict[str, Any]:
        existing = self.theme_model.get_by_name(name)
        if existing:
            return {
                'code': 1,
                'msg': '主题名称已存在',
                'data': None
            }

        theme_id = self.theme_model.create(name, icon, items_json, description, rows, cols, difficulty, sort_order)
        if theme_id > 0:
            theme = self.theme_model.get_by_id(theme_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.theme_model.to_dict(theme)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_theme(self, theme_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        theme = self.theme_model.get_by_id(theme_id)
        if not theme:
            return {
                'code': 1,
                'msg': '主题不存在',
                'data': None
            }

        if 'name' in data:
            existing = self.theme_model.get_by_name(data['name'])
            if existing and existing.get('id') != theme_id:
                return {
                    'code': 1,
                    'msg': '主题名称已存在',
                    'data': None
                }

        affected = self.theme_model.update(theme_id, data)
        if affected >= 0:
            updated_theme = self.theme_model.get_by_id(theme_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.theme_model.to_dict(updated_theme)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def update_theme_status(self, theme_id: int, status: int) -> Dict[str, Any]:
        theme = self.theme_model.get_by_id(theme_id)
        if not theme:
            return {
                'code': 1,
                'msg': '主题不存在',
                'data': None
            }

        affected = self.theme_model.update_status(theme_id, status)
        if affected > 0:
            updated_theme = self.theme_model.get_by_id(theme_id)
            return {
                'code': 0,
                'msg': '状态更新成功',
                'data': self.theme_model.to_dict(updated_theme)
            }

        return {
            'code': 1,
            'msg': '状态更新失败',
            'data': None
        }

    def delete_theme(self, theme_id: int) -> Dict[str, Any]:
        theme = self.theme_model.get_by_id(theme_id)
        if not theme:
            return {
                'code': 1,
                'msg': '主题不存在',
                'data': None
            }

        affected = self.theme_model.delete(theme_id)
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
