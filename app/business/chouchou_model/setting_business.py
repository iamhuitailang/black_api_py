from typing import Dict, Any
from app.model.chouchou_model import SettingModel


class SettingBusiness:
    def __init__(self):
        self.setting_model = SettingModel()

    def get_settings(self, user_id: int) -> Dict[str, Any]:
        settings = self.setting_model.get_by_user(user_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': self.setting_model.to_dict(settings)
        }

    def update_settings(self, user_id: int, settings: Dict[str, Any]) -> Dict[str, Any]:
        affected = self.setting_model.update(user_id, settings)
        if affected >= 0:
            updated = self.setting_model.get_by_user(user_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.setting_model.to_dict(updated)
            }
        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def get_value(self, user_id: int, key: str) -> Dict[str, Any]:
        value = self.setting_model.get_value(user_id, key)
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'key': key,
                'value': value
            }
        }

    def set_value(self, user_id: int, key: str, value: Any) -> Dict[str, Any]:
        affected = self.setting_model.set_value(user_id, key, value)
        if affected >= 0:
            return {
                'code': 0,
                'msg': '设置成功',
                'data': {
                    'key': key,
                    'value': value
                }
            }
        return {
            'code': 1,
            'msg': '设置失败',
            'data': None
        }

    def reset_to_default(self, user_id: int) -> Dict[str, Any]:
        affected = self.setting_model.reset_to_default(user_id)
        if affected > 0:
            settings = self.setting_model.get_by_user(user_id)
            return {
                'code': 0,
                'msg': '已重置为默认设置',
                'data': self.setting_model.to_dict(settings)
            }
        return {
            'code': 1,
            'msg': '重置失败',
            'data': None
        }
