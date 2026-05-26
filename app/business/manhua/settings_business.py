from typing import Dict, Any, Optional
from app.model.manhua import ReadingSettingsModel
import json


class ManhuaSettingsBusiness:
    def __init__(self):
        self.settings_model = ReadingSettingsModel()

    def get_settings(self, user_id: int) -> Dict[str, Any]:
        settings = self.settings_model.get_by_user_id(user_id)
        if settings:
            return {
                'code': 0,
                'msg': 'success',
                'data': self.settings_model.to_dict(settings)
            }

        settings_id = self.settings_model.create_default(user_id)
        settings = self.settings_model.get_by_user_id(user_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': self.settings_model.to_dict(settings)
        }

    def update_settings(self, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        if 'extra_settings' in data and isinstance(data['extra_settings'], dict):
            data['extra_settings'] = json.dumps(data['extra_settings'])

        affected = self.settings_model.update(user_id, data)
        if affected >= 0:
            settings = self.settings_model.get_by_user_id(user_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.settings_model.to_dict(settings)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def get_default_settings(self) -> Dict[str, Any]:
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'read_mode': ReadingSettingsModel.MODE_SINGLE,
                'theme': ReadingSettingsModel.THEME_DARK,
                'brightness': 80,
                'auto_play': 0,
                'auto_play_speed': 3,
                'font_size': 16,
                'page_direction': 'ltr',
                'show_page_num': 1,
                'show_timestamp': 0
            }
        }