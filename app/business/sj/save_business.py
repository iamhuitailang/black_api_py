from typing import Dict, Any, Optional
from app.model.sj_model import SjSaveModel, SjCharacterModel
import json


class SjSaveBusiness:
    def __init__(self):
        self.save_model = SjSaveModel()
        self.character_model = SjCharacterModel()

    def create_save(self, user_id: int, character_id: int, save_name: str = '') -> Dict[str, Any]:
        character = self.character_model.get_by_id(character_id)
        if not character:
            return {'code': 1, 'msg': '角色不存在', 'data': None}
        if character.get('user_id') != user_id:
            return {'code': 1, 'msg': '无权操作', 'data': None}

        save_data = self.character_model.to_dict(character)

        save_id = self.save_model.create(
            user_id=user_id,
            character_id=character_id,
            save_name=save_name or f'{character.get("name", "")}的存档',
            save_data=save_data,
            current_floor=character.get('current_floor', 0),
            play_time=0,
            ending_type=''
        )

        if save_id > 0:
            save = self.save_model.get_by_id(save_id)
            return {'code': 0, 'msg': '存档成功', 'data': self.save_model.to_dict(save)}
        return {'code': 1, 'msg': '存档失败', 'data': None}

    def get_saves(self, user_id: int) -> Dict[str, Any]:
        saves = self.save_model.get_by_user(user_id)
        result = [self.save_model.to_dict(s) for s in saves]
        return {'code': 0, 'msg': 'success', 'data': result}

    def load_save(self, save_id: int, user_id: int) -> Dict[str, Any]:
        save = self.save_model.get_by_id(save_id)
        if not save:
            return {'code': 1, 'msg': '存档不存在', 'data': None}
        if save.get('user_id') != user_id:
            return {'code': 1, 'msg': '无权操作', 'data': None}

        save_data = save.get('save_data', {})
        character_id = save.get('character_id')

        if character_id and save_data:
            restore_data = {k: v for k, v in save_data.items() if k in [
                'level', 'hp', 'max_hp', 'mp', 'max_mp',
                'attack', 'defense', 'speed', 'luck', 'exp', 'exp_next',
                'gold', 'current_floor', 'max_floor', 'time_energy',
                'time_energy_max', 'status', 'skills'
            ]}
            self.character_model.update(character_id, restore_data)
            character = self.character_model.get_by_id(character_id)
            return {
                'code': 0,
                'msg': '读档成功',
                'data': {
                    'save': self.save_model.to_dict(save),
                    'character': self.character_model.to_dict(character)
                }
            }
        return {'code': 1, 'msg': '存档数据损坏', 'data': None}

    def delete_save(self, save_id: int, user_id: int) -> Dict[str, Any]:
        save = self.save_model.get_by_id(save_id)
        if not save:
            return {'code': 1, 'msg': '存档不存在', 'data': None}
        if save.get('user_id') != user_id:
            return {'code': 1, 'msg': '无权操作', 'data': None}

        self.save_model.delete(save_id)
        return {'code': 0, 'msg': '存档已删除', 'data': None}

    def update_save(self, save_id: int, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        save = self.save_model.get_by_id(save_id)
        if not save:
            return {'code': 1, 'msg': '存档不存在', 'data': None}
        if save.get('user_id') != user_id:
            return {'code': 1, 'msg': '无权操作', 'data': None}

        self.save_model.update(save_id, data)
        updated = self.save_model.get_by_id(save_id)
        return {'code': 0, 'msg': '存档更新成功', 'data': self.save_model.to_dict(updated)}
