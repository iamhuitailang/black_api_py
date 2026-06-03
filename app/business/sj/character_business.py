from typing import Dict, Any, Optional, List
from app.model.sj_model import SjCharacterModel, SjTimeAbilityModel


class SjCharacterBusiness:
    def __init__(self):
        self.character_model = SjCharacterModel()
        self.time_ability_model = SjTimeAbilityModel()

    def create_character(self, user_id: int, name: str, class_type: str) -> Dict[str, Any]:
        if not name or len(name) < 1 or len(name) > 12:
            return {'code': 1, 'msg': '角色名长度需1-12位', 'data': None}
        if class_type not in SjCharacterModel.CLASSES:
            return {'code': 1, 'msg': '无效的职业类型', 'data': None}

        existing = self.character_model.get_by_user(user_id)
        if len(existing) >= 3:
            return {'code': 1, 'msg': '最多创建3个角色', 'data': None}

        character_id = self.character_model.create(user_id, name, class_type)
        if character_id > 0:
            self.time_ability_model.init_abilities_for_character(character_id, 0)
            character = self.character_model.get_by_id(character_id)
            return {
                'code': 0,
                'msg': '角色创建成功',
                'data': self.character_model.to_dict(character)
            }
        return {'code': 1, 'msg': '角色创建失败', 'data': None}

    def get_characters(self, user_id: int) -> Dict[str, Any]:
        characters = self.character_model.get_by_user(user_id)
        result = [self.character_model.to_dict(c) for c in characters]
        return {'code': 0, 'msg': 'success', 'data': result}

    def get_character(self, character_id: int) -> Dict[str, Any]:
        character = self.character_model.get_by_id(character_id)
        if not character:
            return {'code': 1, 'msg': '角色不存在', 'data': None}
        return {'code': 0, 'msg': 'success', 'data': self.character_model.to_dict(character)}

    def delete_character(self, character_id: int, user_id: int) -> Dict[str, Any]:
        character = self.character_model.get_by_id(character_id)
        if not character:
            return {'code': 1, 'msg': '角色不存在', 'data': None}
        if character.get('user_id') != user_id:
            return {'code': 1, 'msg': '无权操作', 'data': None}
        self.character_model.delete(character_id)
        return {'code': 0, 'msg': '角色已删除', 'data': None}

    def get_classes(self) -> Dict[str, Any]:
        classes = []
        for key, info in SjCharacterModel.CLASSES.items():
            classes.append({
                'key': key,
                'name': info['name'],
                'desc': info['desc'],
                'hp': info['hp'],
                'mp': info['mp'],
                'attack': info['attack'],
                'defense': info['defense'],
                'speed': info['speed']
            })
        return {'code': 0, 'msg': 'success', 'data': classes}

    def update_character(self, character_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        character = self.character_model.get_by_id(character_id)
        if not character:
            return {'code': 1, 'msg': '角色不存在', 'data': None}
        self.character_model.update(character_id, data)
        updated = self.character_model.get_by_id(character_id)
        return {'code': 0, 'msg': '更新成功', 'data': self.character_model.to_dict(updated)}

    def add_exp(self, character_id: int, exp: int) -> Dict[str, Any]:
        character = self.character_model.get_by_id(character_id)
        if not character:
            return {'code': 1, 'msg': '角色不存在', 'data': None}

        new_exp = character.get('exp', 0) + exp
        new_level = character.get('level', 1)
        exp_next = character.get('exp_next', 100)
        level_up = False

        while new_exp >= exp_next:
            new_exp -= exp_next
            new_level += 1
            exp_next = int(exp_next * 1.5)
            level_up = True

        update_data = {
            'exp': new_exp,
            'exp_next': exp_next,
            'level': new_level
        }

        if level_up:
            class_info = SjCharacterModel.CLASSES.get(character.get('class_type'), {})
            update_data['max_hp'] = character.get('max_hp', 100) + class_info.get('hp', 10) // 5
            update_data['hp'] = update_data['max_hp']
            update_data['max_mp'] = character.get('max_mp', 30) + class_info.get('mp', 10) // 5
            update_data['mp'] = update_data['max_mp']
            update_data['attack'] = character.get('attack', 10) + 2
            update_data['defense'] = character.get('defense', 5) + 1
            update_data['speed'] = character.get('speed', 8) + 1

        self.character_model.update(character_id, update_data)
        updated = self.character_model.get_by_id(character_id)
        result = self.character_model.to_dict(updated)
        result['level_up'] = level_up
        return {'code': 0, 'msg': '经验增加', 'data': result}

    def get_time_abilities(self, character_id: int) -> Dict[str, Any]:
        abilities = self.time_ability_model.get_by_character(character_id)
        return {'code': 0, 'msg': 'success', 'data': abilities}
