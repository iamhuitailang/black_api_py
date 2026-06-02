from typing import Dict, Any, Optional
from app.model.jinwutuan import InstrumentModel


class JinwutuanInstrumentBusiness:
    def __init__(self):
        self.instrument_model = InstrumentModel()

    def create_instrument(self, data: Dict[str, Any]) -> Dict[str, Any]:
        name = data.get('name', '')
        if not name or len(name.strip()) < 1:
            return {
                'code': 1,
                'msg': '乐器名称不能为空',
                'data': None
            }

        instrument_type = data.get('type', '')
        if not instrument_type:
            return {
                'code': 1,
                'msg': '乐器类型不能为空',
                'data': None
            }

        instrument_id = self.instrument_model.create(
            name=name.strip(),
            type=instrument_type,
            icon=data.get('icon', ''),
            color=data.get('color', ''),
            description=data.get('description', ''),
            unlock_level=data.get('unlock_level', 1),
            key_count=data.get('key_count', 4)
        )

        if instrument_id > 0:
            instrument = self.instrument_model.get_by_id(instrument_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.instrument_model.to_dict(instrument)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_instrument(self, instrument_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        instrument = self.instrument_model.get_by_id(instrument_id)
        if not instrument:
            return {
                'code': 1,
                'msg': '乐器不存在',
                'data': None
            }

        affected = self.instrument_model.update(instrument_id, data)
        if affected >= 0:
            updated_instrument = self.instrument_model.get_by_id(instrument_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.instrument_model.to_dict(updated_instrument)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_instrument(self, instrument_id: int) -> Dict[str, Any]:
        instrument = self.instrument_model.get_by_id(instrument_id)
        if not instrument:
            return {
                'code': 1,
                'msg': '乐器不存在',
                'data': None
            }

        affected = self.instrument_model.delete(instrument_id)
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

    def get_instrument(self, instrument_id: int) -> Dict[str, Any]:
        instrument = self.instrument_model.get_by_id(instrument_id)
        if not instrument:
            return {
                'code': 1,
                'msg': '乐器不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.instrument_model.to_dict(instrument)
        }

    def get_instrument_list(self, page: int = 1, page_size: int = 10,
                            type: str = None, status: int = None) -> Dict[str, Any]:
        result = self.instrument_model.get_all(page, page_size, type, status)
        items = [self.instrument_model.to_dict(item) for item in result.get('items', [])]

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

    def get_enabled_instruments(self) -> Dict[str, Any]:
        instruments = self.instrument_model.query.find_all(
            {'status': InstrumentModel.STATUS_ENABLED},
            order_by='unlock_level ASC'
        )
        items = [self.instrument_model.to_dict(inst) for inst in instruments]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }
