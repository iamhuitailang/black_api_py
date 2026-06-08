from typing import Dict, Any, List, Optional
from app.model.danzhu import PinballConfigModel


class PinballBusiness:
    def __init__(self):
        self.config_model = PinballConfigModel()

    def get_configs(self, only_active: bool = True) -> Dict[str, Any]:
        if only_active:
            configs = self.config_model.get_all_active()
        else:
            configs = self.config_model.get_all()
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': configs,
                'total': len(configs)
            }
        }

    def get_config_by_id(self, config_id: int) -> Dict[str, Any]:
        config = self.config_model.get_by_id(config_id)
        if not config:
            return {
                'code': 1,
                'message': '配置不存在',
                'data': None
            }
        return {
            'code': 0,
            'message': 'success',
            'data': config
        }

    def add_config(self, name: str, type: str, config_json: str = '{}',
                   position_json: str = '{}', score: int = 0,
                   sort_order: int = 0, is_active: int = 1) -> Dict[str, Any]:
        if not name or not name.strip():
            return {
                'code': 1,
                'message': '名称不能为空',
                'data': None
            }
        if not type or not type.strip():
            return {
                'code': 1,
                'message': '类型不能为空',
                'data': None
            }

        config_id = self.config_model.create(
            name=name.strip(),
            type=type.strip(),
            config_json=config_json,
            position_json=position_json,
            score=score,
            sort_order=sort_order,
            is_active=is_active
        )

        if config_id > 0:
            config = self.config_model.get_by_id(config_id)
            return {
                'code': 0,
                'message': '添加成功',
                'data': config
            }

        return {
            'code': 1,
            'message': '添加失败',
            'data': None
        }

    def update_config(self, config_id: int, **kwargs) -> Dict[str, Any]:
        config = self.config_model.get_by_id(config_id)
        if not config:
            return {
                'code': 1,
                'message': '配置不存在',
                'data': None
            }

        affected = self.config_model.update(config_id, **kwargs)
        if affected > 0:
            updated = self.config_model.get_by_id(config_id)
            return {
                'code': 0,
                'message': '更新成功',
                'data': updated
            }

        return {
            'code': 1,
            'message': '更新失败',
            'data': None
        }

    def delete_config(self, config_id: int) -> Dict[str, Any]:
        config = self.config_model.get_by_id(config_id)
        if not config:
            return {
                'code': 1,
                'message': '配置不存在',
                'data': None
            }

        affected = self.config_model.delete(config_id)
        if affected > 0:
            return {
                'code': 0,
                'message': '删除成功',
                'data': None
            }

        return {
            'code': 1,
            'message': '删除失败',
            'data': None
        }
