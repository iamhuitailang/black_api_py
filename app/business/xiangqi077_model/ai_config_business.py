from typing import Dict, Any
from app.model.xiangqi077_model import XiangqiAIConfigModel


class XiangqiAIConfigBusiness:
    def __init__(self):
        self.ai_config_model = XiangqiAIConfigModel()

    def get_enabled_configs(self) -> Dict[str, Any]:
        configs = self.ai_config_model.get_enabled_configs()
        items = [self.ai_config_model.to_dict(c) for c in configs]
        return {'code': 0, 'msg': 'success', 'data': items}

    def get_all_configs(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.ai_config_model.get_all(page, page_size)
        items = [self.ai_config_model.to_dict(item) for item in result.get('items', [])]
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

    def get_config(self, config_id: int) -> Dict[str, Any]:
        config = self.ai_config_model.get_by_id(config_id)
        if not config:
            return {'code': 1, 'msg': '配置不存在', 'data': None}
        return {'code': 0, 'msg': 'success', 'data': self.ai_config_model.to_dict(config)}

    def create_config(self, name: str, level: int, description: str = '',
                      search_depth: int = 2, think_time: int = 1000, sort_order: int = 0) -> Dict[str, Any]:
        if not name:
            return {'code': 1, 'msg': '名称不能为空', 'data': None}
        existing = self.ai_config_model.get_by_level(level)
        if existing:
            return {'code': 1, 'msg': '该难度等级已存在', 'data': None}
        config_id = self.ai_config_model.create(name, level, description, search_depth, think_time, sort_order)
        if config_id > 0:
            config = self.ai_config_model.get_by_id(config_id)
            return {'code': 0, 'msg': '创建成功', 'data': self.ai_config_model.to_dict(config)}
        return {'code': 1, 'msg': '创建失败', 'data': None}

    def update_config(self, config_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        config = self.ai_config_model.get_by_id(config_id)
        if not config:
            return {'code': 1, 'msg': '配置不存在', 'data': None}
        affected = self.ai_config_model.update(config_id, data)
        if affected >= 0:
            updated = self.ai_config_model.get_by_id(config_id)
            return {'code': 0, 'msg': '更新成功', 'data': self.ai_config_model.to_dict(updated)}
        return {'code': 1, 'msg': '更新失败', 'data': None}

    def delete_config(self, config_id: int) -> Dict[str, Any]:
        config = self.ai_config_model.get_by_id(config_id)
        if not config:
            return {'code': 1, 'msg': '配置不存在', 'data': None}
        self.ai_config_model.delete(config_id)
        return {'code': 0, 'msg': '删除成功', 'data': None}

    def enable_config(self, config_id: int) -> Dict[str, Any]:
        return self.update_config(config_id, {'status': XiangqiAIConfigModel.STATUS_ENABLED})

    def disable_config(self, config_id: int) -> Dict[str, Any]:
        return self.update_config(config_id, {'status': XiangqiAIConfigModel.STATUS_DISABLED})
