from typing import Dict, Any
from app.model.dafeiji_model import DafeijiAircraftModel


class DafeijiAircraftBusiness:
    def __init__(self):
        self.aircraft_model = DafeijiAircraftModel()

    def get_list(self, page: int = 1, page_size: int = 10, type_filter: str = None) -> Dict[str, Any]:
        result = self.aircraft_model.get_all(page, page_size, type_filter)
        items = [self.aircraft_model.to_dict(item) for item in result.get('items', [])]
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

    def get_all(self, type_filter: str = None) -> Dict[str, Any]:
        items = self.aircraft_model.get_all_list(type_filter)
        return {
            'code': 0,
            'msg': 'success',
            'data': [self.aircraft_model.to_dict(item) for item in items]
        }

    def get_by_id(self, aircraft_id: int) -> Dict[str, Any]:
        aircraft = self.aircraft_model.get_by_id(aircraft_id)
        if not aircraft:
            return {'code': 1, 'msg': '飞机不存在', 'data': None}
        return {'code': 0, 'msg': 'success', 'data': self.aircraft_model.to_dict(aircraft)}

    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        if not data.get('name'):
            return {'code': 1, 'msg': '飞机名称不能为空', 'data': None}
        if not data.get('type'):
            return {'code': 1, 'msg': '飞机类型不能为空', 'data': None}
        aircraft_id = self.aircraft_model.create(data)
        if aircraft_id > 0:
            aircraft = self.aircraft_model.get_by_id(aircraft_id)
            return {'code': 0, 'msg': '创建成功', 'data': self.aircraft_model.to_dict(aircraft)}
        return {'code': 1, 'msg': '创建失败', 'data': None}

    def update(self, aircraft_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        aircraft = self.aircraft_model.get_by_id(aircraft_id)
        if not aircraft:
            return {'code': 1, 'msg': '飞机不存在', 'data': None}
        affected = self.aircraft_model.update(aircraft_id, data)
        if affected >= 0:
            updated = self.aircraft_model.get_by_id(aircraft_id)
            return {'code': 0, 'msg': '更新成功', 'data': self.aircraft_model.to_dict(updated)}
        return {'code': 1, 'msg': '更新失败', 'data': None}

    def delete(self, aircraft_id: int) -> Dict[str, Any]:
        aircraft = self.aircraft_model.get_by_id(aircraft_id)
        if not aircraft:
            return {'code': 1, 'msg': '飞机不存在', 'data': None}
        affected = self.aircraft_model.delete(aircraft_id)
        if affected > 0:
            return {'code': 0, 'msg': '删除成功', 'data': None}
        return {'code': 1, 'msg': '删除失败', 'data': None}
