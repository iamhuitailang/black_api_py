from typing import Dict, Any, List, Optional
from app.model.jianli import SystemSettingsModel


class SystemSettingsBusiness:
    def __init__(self):
        self.settings_model = SystemSettingsModel()

    def create(self, setting_key: str, setting_value: str = '', setting_name: str = '',
               description: str = '', group_name: str = 'default',
               sort_order: int = 0) -> Dict[str, Any]:
        if not setting_key:
            return {
                'code': 1,
                'msg': '配置键不能为空',
                'data': None
            }

        existing = self.settings_model.get_by_key(setting_key)
        if existing:
            return {
                'code': 1,
                'msg': '配置键已存在',
                'data': None
            }

        record_id = self.settings_model.create(
            setting_key, setting_value, setting_name, description, group_name, sort_order
        )
        if record_id > 0:
            record = self.settings_model.get_by_id(record_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.settings_model.to_public_dict(record)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update(self, record_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        record = self.settings_model.get_by_id(record_id)
        if not record:
            return {
                'code': 1,
                'msg': '配置不存在',
                'data': None
            }

        if 'setting_key' in data:
            existing = self.settings_model.get_by_key(data['setting_key'])
            if existing and existing['id'] != record_id:
                return {
                    'code': 1,
                    'msg': '配置键已存在',
                    'data': None
                }

        affected = self.settings_model.update(record_id, data)
        if affected >= 0:
            updated = self.settings_model.get_by_id(record_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.settings_model.to_public_dict(updated)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def update_value(self, setting_key: str, setting_value: str) -> Dict[str, Any]:
        affected = self.settings_model.update_value(setting_key, setting_value)
        if affected > 0:
            return {
                'code': 0,
                'msg': '更新成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete(self, record_id: int) -> Dict[str, Any]:
        record = self.settings_model.get_by_id(record_id)
        if not record:
            return {
                'code': 1,
                'msg': '配置不存在',
                'data': None
            }

        affected = self.settings_model.delete(record_id)
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

    def get_by_id(self, record_id: int) -> Dict[str, Any]:
        record = self.settings_model.get_by_id(record_id)
        if not record:
            return {
                'code': 1,
                'msg': '配置不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.settings_model.to_public_dict(record)
        }

    def get_by_key(self, setting_key: str) -> Dict[str, Any]:
        record = self.settings_model.get_by_key(setting_key)
        if not record:
            return {
                'code': 1,
                'msg': '配置不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.settings_model.to_public_dict(record)
        }

    def get_value(self, setting_key: str, default_value: str = '') -> Dict[str, Any]:
        value = self.settings_model.get_value(setting_key, default_value)
        return {
            'code': 0,
            'msg': 'success',
            'data': value
        }

    def get_list(self, page: int = 1, page_size: int = 100,
                 group_name: str = None) -> Dict[str, Any]:
        result = self.settings_model.get_all(page, page_size, group_name)
        items = [self.settings_model.to_public_dict(item) for item in result.get('items', [])]

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

    def get_all_dict(self) -> Dict[str, Any]:
        settings = self.settings_model.get_all_dict()
        return {
            'code': 0,
            'msg': 'success',
            'data': settings
        }

    def batch_update(self, settings: Dict[str, str]) -> Dict[str, Any]:
        for key, value in settings.items():
            self.settings_model.update_value(key, value)

        return {
            'code': 0,
            'msg': '批量更新成功',
            'data': None
        }
