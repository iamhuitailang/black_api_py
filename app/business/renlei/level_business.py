from typing import Dict, Any
from app.model.renlei import LevelModel


class LevelBusiness:
    def __init__(self):
        self.model = LevelModel()

    def list_levels(self, only_active: bool = True) -> Dict[str, Any]:
        levels = self.model.get_all(only_active)
        return {
            'code': 0,
            'message': 'success',
            'data': [{
                'id': l['id'],
                'name': l['name'],
                'description': l['description'],
                'level_type': l['level_type'],
                'difficulty': l['difficulty'],
                'theme': l['theme'],
                'start_position': l['start_position'],
                'end_position': l['end_position'],
                'obstacles': l['obstacles'],
                'is_active': l['is_active'],
                'order': l['order_num']
            } for l in levels]
        }

    def get_level(self, level_id: int) -> Dict[str, Any]:
        level = self.model.get_by_id(level_id)
        if not level:
            return {'code': 1, 'message': '关卡不存在', 'data': None}
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'id': level['id'],
                'name': level['name'],
                'description': level['description'],
                'level_type': level['level_type'],
                'difficulty': level['difficulty'],
                'theme': level['theme'],
                'start_position': level['start_position'],
                'end_position': level['end_position'],
                'obstacles': level['obstacles'],
                'is_active': level['is_active'],
                'order': level['order_num']
            }
        }

    def create_level(self, name: str, **kwargs) -> Dict[str, Any]:
        if not name:
            return {'code': 1, 'message': '关卡名称不能为空', 'data': None}
        
        level_id = self.model.create(name, **kwargs)
        return {'code': 0, 'message': '创建成功', 'data': {'id': level_id, 'name': name}}

    def update_level(self, level_id: int, **kwargs) -> Dict[str, Any]:
        existing = self.model.get_by_id(level_id)
        if not existing:
            return {'code': 1, 'message': '关卡不存在', 'data': None}
        
        affected = self.model.update(level_id, **kwargs)
        if affected > 0:
            return {'code': 0, 'message': '更新成功', 'data': {'id': level_id}}
        return {'code': 1, 'message': '更新失败', 'data': None}

    def delete_level(self, level_id: int) -> Dict[str, Any]:
        existing = self.model.get_by_id(level_id)
        if not existing:
            return {'code': 1, 'message': '关卡不存在', 'data': None}
        
        affected = self.model.delete(level_id)
        if affected > 0:
            return {'code': 0, 'message': '删除成功', 'data': None}
        return {'code': 1, 'message': '删除失败', 'data': None}
