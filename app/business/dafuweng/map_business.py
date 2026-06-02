from typing import Dict, Any
from app.model.dafuweng import MapCellModel


class MapBusiness:
    def __init__(self):
        self.map_cell_model = MapCellModel()

    def get_all_cells(self) -> Dict[str, Any]:
        cells = self.map_cell_model.get_all_cells()
        return {
            'code': 0,
            'msg': 'success',
            'data': [self.map_cell_model.to_dict(cell) for cell in cells]
        }

    def get_cell_by_id(self, cell_id: int) -> Dict[str, Any]:
        cell = self.map_cell_model.get_by_id(cell_id)
        if not cell:
            return {
                'code': 1,
                'msg': '格子不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.map_cell_model.to_dict(cell)
        }

    def create_cell(self, data: Dict[str, Any]) -> Dict[str, Any]:
        position = data.get('position')
        name = data.get('name')
        cell_type = data.get('cell_type')

        if position is None or not name or cell_type is None:
            return {
                'code': 1,
                'msg': '缺少必要参数',
                'data': None
            }

        existing = self.map_cell_model.get_by_position(position)
        if existing:
            return {
                'code': 1,
                'msg': '该位置已有格子',
                'data': None
            }

        cell_id = self.map_cell_model.create(
            position=position,
            name=name,
            cell_type=cell_type,
            base_price=data.get('base_price', 0),
            rent_level1=data.get('rent_level1', 0),
            rent_level2=data.get('rent_level2', 0),
            rent_level3=data.get('rent_level3', 0),
            color=data.get('color', '#999999'),
            icon=data.get('icon', ''),
            description=data.get('description', '')
        )

        if cell_id > 0:
            cell = self.map_cell_model.get_by_id(cell_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.map_cell_model.to_dict(cell)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_cell(self, cell_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        cell = self.map_cell_model.get_by_id(cell_id)
        if not cell:
            return {
                'code': 1,
                'msg': '格子不存在',
                'data': None
            }

        affected = self.map_cell_model.update(cell_id, data)
        if affected >= 0:
            updated_cell = self.map_cell_model.get_by_id(cell_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.map_cell_model.to_dict(updated_cell)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_cell(self, cell_id: int) -> Dict[str, Any]:
        cell = self.map_cell_model.get_by_id(cell_id)
        if not cell:
            return {
                'code': 1,
                'msg': '格子不存在',
                'data': None
            }

        affected = self.map_cell_model.delete(cell_id)
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

    def reset_map(self) -> Dict[str, Any]:
        cells = self.map_cell_model.get_all_cells()
        for cell in cells:
            self.map_cell_model.delete(cell.get('id'))

        MapCellModel.init_default_map()

        new_cells = self.map_cell_model.get_all_cells()
        return {
            'code': 0,
            'msg': '地图重置成功',
            'data': [self.map_cell_model.to_dict(cell) for cell in new_cells]
        }
