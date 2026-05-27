from typing import Dict, Any, List
from app.model.renlei import CharacterModel


class CharacterBusiness:
    def __init__(self):
        self.model = CharacterModel()

    def list_characters(self) -> Dict[str, Any]:
        characters = self.model.get_all()
        return {
            'code': 0,
            'message': 'success',
            'data': [{
                'id': c['id'],
                'name': c['name'],
                'description': c['description'],
                'color': c['color'],
                'head_color': c['head_color'],
                'body_color': c['body_color'],
                'unlock_condition': c['unlock_condition'],
                'is_default': c['is_default']
            } for c in characters]
        }

    def get_character(self, character_id: int) -> Dict[str, Any]:
        character = self.model.get_by_id(character_id)
        if not character:
            return {'code': 1, 'message': '角色不存在', 'data': None}
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'id': character['id'],
                'name': character['name'],
                'description': character['description'],
                'color': character['color'],
                'head_color': character['head_color'],
                'body_color': character['body_color'],
                'unlock_condition': character['unlock_condition'],
                'is_default': character['is_default']
            }
        }

    def create_character(self, name: str, **kwargs) -> Dict[str, Any]:
        if not name:
            return {'code': 1, 'message': '角色名称不能为空', 'data': None}
        
        character_id = self.model.create(name, **kwargs)
        return {'code': 0, 'message': '创建成功', 'data': {'id': character_id, 'name': name}}

    def update_character(self, character_id: int, **kwargs) -> Dict[str, Any]:
        existing = self.model.get_by_id(character_id)
        if not existing:
            return {'code': 1, 'message': '角色不存在', 'data': None}
        
        affected = self.model.update(character_id, **kwargs)
        if affected > 0:
            return {'code': 0, 'message': '更新成功', 'data': {'id': character_id}}
        return {'code': 1, 'message': '更新失败', 'data': None}

    def delete_character(self, character_id: int) -> Dict[str, Any]:
        existing = self.model.get_by_id(character_id)
        if not existing:
            return {'code': 1, 'message': '角色不存在', 'data': None}
        
        affected = self.model.delete(character_id)
        if affected > 0:
            return {'code': 0, 'message': '删除成功', 'data': None}
        return {'code': 1, 'message': '删除失败', 'data': None}
