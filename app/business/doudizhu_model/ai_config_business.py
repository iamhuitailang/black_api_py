from typing import Dict, Any


class DoudizhuAiConfigBusiness:
    def __init__(self):
        from app.model.doudizhu_model import AiConfigModel
        self.ai_config_model = AiConfigModel()

    def get_ai_config_list(self, page: int = 1, page_size: int = 10, difficulty: int = None) -> Dict[str, Any]:
        result = self.ai_config_model.get_all(page, page_size, difficulty)
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

    def get_ai_config_by_difficulty(self, difficulty: int) -> Dict[str, Any]:
        config = self.ai_config_model.get_by_difficulty(difficulty)
        if not config:
            config = self.ai_config_model.get_by_difficulty(1)

        if config:
            return {
                'code': 0,
                'msg': 'success',
                'data': self.ai_config_model.to_dict(config)
            }

        return {
            'code': 1,
            'msg': 'AI配置不存在',
            'data': None
        }

    def create_ai_config(self, name: str, difficulty: int, description: str = '',
                         think_time: int = 1000, bomb_probability: float = 0.3,
                         single_probability: float = 0.5, is_default: int = 0) -> Dict[str, Any]:
        if not name:
            return {
                'code': 1,
                'msg': '配置名称不能为空',
                'data': None
            }

        if difficulty < 0 or difficulty > 2:
            return {
                'code': 1,
                'msg': '难度参数不正确',
                'data': None
            }

        config_id = self.ai_config_model.create(
            name=name,
            difficulty=difficulty,
            description=description,
            think_time=think_time,
            bomb_probability=bomb_probability,
            single_probability=single_probability,
            is_default=is_default
        )

        if config_id > 0:
            config = self.ai_config_model.get_by_id(config_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.ai_config_model.to_dict(config)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_ai_config(self, config_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        config = self.ai_config_model.get_by_id(config_id)
        if not config:
            return {
                'code': 1,
                'msg': 'AI配置不存在',
                'data': None
            }

        affected = self.ai_config_model.update(config_id, data)
        if affected >= 0:
            updated = self.ai_config_model.get_by_id(config_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.ai_config_model.to_dict(updated)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_ai_config(self, config_id: int) -> Dict[str, Any]:
        config = self.ai_config_model.get_by_id(config_id)
        if not config:
            return {
                'code': 1,
                'msg': 'AI配置不存在',
                'data': None
            }

        if config.get('is_default') == 1:
            return {
                'code': 1,
                'msg': '不能删除默认配置',
                'data': None
            }

        affected = self.ai_config_model.delete(config_id)
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

    def get_ai_config_detail(self, config_id: int) -> Dict[str, Any]:
        config = self.ai_config_model.get_by_id(config_id)
        if not config:
            return {
                'code': 1,
                'msg': 'AI配置不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.ai_config_model.to_dict(config)
        }
