from typing import Dict, Any
from app.model.dafeiji_model import DafeijiWaveModel


class DafeijiWaveBusiness:
    def __init__(self):
        self.wave_model = DafeijiWaveModel()

    def get_list(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.wave_model.get_all(page, page_size)
        items = [self.wave_model.to_dict(item) for item in result.get('items', [])]
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

    def get_all(self) -> Dict[str, Any]:
        items = self.wave_model.get_all_list()
        return {'code': 0, 'msg': 'success', 'data': [self.wave_model.to_dict(item) for item in items]}

    def get_by_id(self, wave_id: int) -> Dict[str, Any]:
        wave = self.wave_model.get_by_id(wave_id)
        if not wave:
            return {'code': 1, 'msg': '波次不存在', 'data': None}
        return {'code': 0, 'msg': 'success', 'data': self.wave_model.to_dict(wave)}

    def get_by_wave_number(self, wave_number: int) -> Dict[str, Any]:
        wave = self.wave_model.get_by_wave_number(wave_number)
        if not wave:
            return {'code': 1, 'msg': '波次不存在', 'data': None}
        return {'code': 0, 'msg': 'success', 'data': self.wave_model.to_dict(wave)}

    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        if not data.get('name'):
            return {'code': 1, 'msg': '波次名称不能为空', 'data': None}
        if data.get('wave_number') is None:
            return {'code': 1, 'msg': '波次编号不能为空', 'data': None}
        wave_id = self.wave_model.create(data)
        if wave_id > 0:
            wave = self.wave_model.get_by_id(wave_id)
            return {'code': 0, 'msg': '创建成功', 'data': self.wave_model.to_dict(wave)}
        return {'code': 1, 'msg': '创建失败', 'data': None}

    def update(self, wave_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        wave = self.wave_model.get_by_id(wave_id)
        if not wave:
            return {'code': 1, 'msg': '波次不存在', 'data': None}
        affected = self.wave_model.update(wave_id, data)
        if affected >= 0:
            updated = self.wave_model.get_by_id(wave_id)
            return {'code': 0, 'msg': '更新成功', 'data': self.wave_model.to_dict(updated)}
        return {'code': 1, 'msg': '更新失败', 'data': None}

    def delete(self, wave_id: int) -> Dict[str, Any]:
        wave = self.wave_model.get_by_id(wave_id)
        if not wave:
            return {'code': 1, 'msg': '波次不存在', 'data': None}
        affected = self.wave_model.delete(wave_id)
        if affected > 0:
            return {'code': 0, 'msg': '删除成功', 'data': None}
        return {'code': 1, 'msg': '删除失败', 'data': None}
