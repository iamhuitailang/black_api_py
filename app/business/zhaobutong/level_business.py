from typing import Dict, Any, List, Optional
from app.model.zhaobutong_model import ZbtLevelModel, ZbtDifferenceModel


class ZbtLevelBusiness:
    def __init__(self):
        self.level_model = ZbtLevelModel()
        self.diff_model = ZbtDifferenceModel()

    def get_level_list(self, theme: str = None, difficulty: int = None,
                       status: int = None, keyword: str = None,
                       page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.level_model.get_all(page, page_size, theme, difficulty, status, keyword)
        items = []
        for item in result.get('items', []):
            level_dict = self.level_model.to_dict(item)
            level_dict['difference_count'] = self.diff_model.count_by_level_id(item.get('id'))
            items.append(level_dict)
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

    def get_active_levels(self, theme: str = None, difficulty: int = None) -> Dict[str, Any]:
        levels = self.level_model.get_active_levels(theme, difficulty)
        items = []
        for level in levels:
            level_dict = self.level_model.to_dict(level)
            diffs = self.diff_model.get_by_level_id(level.get('id'))
            level_dict['actual_difference_count'] = len(diffs)
            items.append(level_dict)
        return {'code': 0, 'msg': 'success', 'data': items}

    def get_level_detail(self, level_id: int) -> Dict[str, Any]:
        level = self.level_model.get_by_id(level_id)
        if not level:
            return {'code': 1, 'msg': '关卡不存在', 'data': None}
        level_dict = self.level_model.to_dict(level)
        diffs = self.diff_model.get_by_level_id(level_id)
        level_dict['differences'] = diffs
        return {'code': 0, 'msg': 'success', 'data': level_dict}

    def create_level(self, data: Dict[str, Any]) -> Dict[str, Any]:
        level_id = self.level_model.create(
            name=data.get('name', ''),
            theme=data.get('theme', 'nature'),
            difficulty=data.get('difficulty', 1),
            image_original=data.get('image_original', ''),
            image_modified=data.get('image_modified', ''),
            difference_count=data.get('difference_count', 5),
            time_limit=data.get('time_limit', 120),
            hint_count=data.get('hint_count', 3),
            sort_order=data.get('sort_order', 0)
        )
        if level_id > 0:
            differences = data.get('differences', [])
            if differences:
                self.diff_model.create_batch(level_id, differences)
            return self.get_level_detail(level_id)
        return {'code': 1, 'msg': '创建失败', 'data': None}

    def update_level(self, level_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        level = self.level_model.get_by_id(level_id)
        if not level:
            return {'code': 1, 'msg': '关卡不存在', 'data': None}

        self.level_model.update(level_id, data)

        if 'differences' in data:
            self.diff_model.delete_by_level_id(level_id)
            differences = data.get('differences', [])
            if differences:
                self.diff_model.create_batch(level_id, differences)

        return self.get_level_detail(level_id)

    def delete_level(self, level_id: int) -> Dict[str, Any]:
        level = self.level_model.get_by_id(level_id)
        if not level:
            return {'code': 1, 'msg': '关卡不存在', 'data': None}
        self.diff_model.delete_by_level_id(level_id)
        self.level_model.delete(level_id)
        return {'code': 0, 'msg': '删除成功', 'data': None}

    def update_level_status(self, level_id: int, status: int) -> Dict[str, Any]:
        level = self.level_model.get_by_id(level_id)
        if not level:
            return {'code': 1, 'msg': '关卡不存在', 'data': None}
        self.level_model.update(level_id, {'status': status})
        updated = self.level_model.get_by_id(level_id)
        return {'code': 0, 'msg': '状态更新成功', 'data': self.level_model.to_dict(updated)}

    def get_level_differences(self, level_id: int) -> Dict[str, Any]:
        level = self.level_model.get_by_id(level_id)
        if not level:
            return {'code': 1, 'msg': '关卡不存在', 'data': None}
        diffs = self.diff_model.get_by_level_id(level_id)
        return {'code': 0, 'msg': 'success', 'data': diffs}

    def add_difference(self, level_id: int, x: int, y: int, radius: int = 25,
                       description: str = '') -> Dict[str, Any]:
        level = self.level_model.get_by_id(level_id)
        if not level:
            return {'code': 1, 'msg': '关卡不存在', 'data': None}
        diff_id = self.diff_model.create(level_id, x, y, radius, description)
        return {'code': 0, 'msg': '添加成功', 'data': {'id': diff_id}}

    def delete_difference(self, diff_id: int) -> Dict[str, Any]:
        diff = self.diff_model.get_by_id(diff_id)
        if not diff:
            return {'code': 1, 'msg': '不同点不存在', 'data': None}
        self.diff_model.delete(diff_id)
        return {'code': 0, 'msg': '删除成功', 'data': None}

    def update_difference(self, diff_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        diff = self.diff_model.get_by_id(diff_id)
        if not diff:
            return {'code': 1, 'msg': '不同点不存在', 'data': None}
        self.diff_model.update(diff_id, data)
        updated = self.diff_model.get_by_id(diff_id)
        return {'code': 0, 'msg': '更新成功', 'data': updated}

    def get_themes(self) -> Dict[str, Any]:
        themes = [
            {'value': 'nature', 'label': '自然风光'},
            {'value': 'city', 'label': '城市建筑'},
            {'value': 'food', 'label': '美食甜点'}
        ]
        return {'code': 0, 'msg': 'success', 'data': themes}
