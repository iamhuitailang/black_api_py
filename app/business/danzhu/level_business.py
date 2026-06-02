from typing import Dict, Any
from app.model.danzhu_model import LevelModel


class DanzhuLevelBusiness:
    def __init__(self):
        self.level_model = LevelModel()

    def get_level_list(self, page: int = 1, page_size: int = 10,
                       status: int = None, difficulty: str = None,
                       keyword: str = None) -> Dict[str, Any]:
        result = self.level_model.get_all(page, page_size, status, difficulty, keyword)
        items = [self.level_model.to_dict(level) for level in result.get('items', [])]

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

    def get_published_levels(self) -> Dict[str, Any]:
        levels = self.level_model.get_published()
        items = [self.level_model.to_dict(level) for level in levels]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_level_detail(self, level_id: int) -> Dict[str, Any]:
        level = self.level_model.get_by_id(level_id)
        if not level:
            return {
                'code': 1,
                'msg': '关卡不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.level_model.to_dict(level)
        }

    def create_level(self, name: str, description: str = '', difficulty: str = 'normal',
                     background: str = '', layout_data: str = '', item_positions: str = '',
                     ball_count: int = 3, gravity: float = 0.3, friction: float = 0.99,
                     bumper_score: int = 100, target_score: int = 1000,
                     status: int = 0) -> Dict[str, Any]:
        if not name:
            return {
                'code': 1,
                'msg': '关卡名称不能为空',
                'data': None
            }

        level_id = self.level_model.create(
            name=name,
            description=description,
            difficulty=difficulty,
            background=background,
            layout_data=layout_data,
            item_positions=item_positions,
            ball_count=ball_count,
            gravity=gravity,
            friction=friction,
            bumper_score=bumper_score,
            target_score=target_score,
            status=status
        )

        if level_id > 0:
            level = self.level_model.get_by_id(level_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.level_model.to_dict(level)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_level(self, level_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        level = self.level_model.get_by_id(level_id)
        if not level:
            return {
                'code': 1,
                'msg': '关卡不存在',
                'data': None
            }

        affected = self.level_model.update(level_id, data)
        if affected >= 0:
            updated_level = self.level_model.get_by_id(level_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.level_model.to_dict(updated_level)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_level(self, level_id: int) -> Dict[str, Any]:
        level = self.level_model.get_by_id(level_id)
        if not level:
            return {
                'code': 1,
                'msg': '关卡不存在',
                'data': None
            }

        affected = self.level_model.delete(level_id)
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

    def publish_level(self, level_id: int) -> Dict[str, Any]:
        return self.update_level(level_id, {'status': self.level_model.STATUS_PUBLISHED})

    def unpublish_level(self, level_id: int) -> Dict[str, Any]:
        return self.update_level(level_id, {'status': self.level_model.STATUS_DRAFT})
