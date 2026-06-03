from typing import Dict, Any
from app.model.gq_model import GqInstrumentModel, GqUserInstrumentModel, GqUserModel


class GqInstrumentBusiness:
    def __init__(self):
        self.instrument_model = GqInstrumentModel()
        self.user_instrument_model = GqUserInstrumentModel()
        self.user_model = GqUserModel()

    def get_instrument_list(self, page: int = 1, page_size: int = 10,
                            type: str = None, rarity: int = None) -> Dict[str, Any]:
        result = self.instrument_model.get_all(page, page_size, type, rarity)
        items = result.get('items', [])
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

    def get_instrument_detail(self, instrument_id: int) -> Dict[str, Any]:
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
            'data': instrument
        }

    def get_user_instruments(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }
        user_instruments = self.user_instrument_model.get_user_instruments(user_id)
        result = []
        for ui in user_instruments:
            instrument = self.instrument_model.get_by_id(ui.get('instrument_id'))
            if instrument:
                item = dict(instrument)
                item['is_equipped'] = ui.get('is_equipped')
                item['owned'] = True
                result.append(item)
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': result,
                'total': len(result)
            }
        }

    def unlock_instrument(self, user_id: int, instrument_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }
        instrument = self.instrument_model.get_by_id(instrument_id)
        if not instrument:
            return {
                'code': 1,
                'msg': '乐器不存在',
                'data': None
            }
        if self.user_instrument_model.has_instrument(user_id, instrument_id):
            return {
                'code': 1,
                'msg': '已拥有该乐器',
                'data': None
            }
        if user.get('level', 1) < instrument.get('unlock_level', 1):
            return {
                'code': 1,
                'msg': f'等级不足，需要等级{instrument.get("unlock_level")}',
                'data': None
            }
        unlock_coins = instrument.get('unlock_coins', 0)
        if unlock_coins > 0 and user.get('coins', 0) < unlock_coins:
            return {
                'code': 1,
                'msg': '金币不足',
                'data': None
            }
        if unlock_coins > 0:
            self.user_model.update_currency(user_id, -unlock_coins, 0)
        record_id = self.user_instrument_model.create(user_id, instrument_id)
        if record_id > 0:
            user_instrument = self.user_instrument_model.get_by_id(record_id)
            return {
                'code': 0,
                'msg': '解锁成功',
                'data': user_instrument
            }
        return {
            'code': 1,
            'msg': '解锁失败',
            'data': None
        }

    def equip_instrument(self, user_id: int, instrument_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }
        if not self.user_instrument_model.has_instrument(user_id, instrument_id):
            return {
                'code': 1,
                'msg': '未拥有该乐器',
                'data': None
            }
        self.user_instrument_model.equip_instrument(user_id, instrument_id)
        user_instruments = self.user_instrument_model.get_user_instruments(user_id)
        equipped = None
        for ui in user_instruments:
            if ui.get('instrument_id') == instrument_id:
                equipped = ui
                break
        return {
            'code': 0,
            'msg': '装备成功',
            'data': equipped
        }

    def unequip_instrument(self, user_id: int, instrument_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }
        if not self.user_instrument_model.has_instrument(user_id, instrument_id):
            return {
                'code': 1,
                'msg': '未拥有该乐器',
                'data': None
            }
        self.user_instrument_model.unequip_instrument(user_id, instrument_id)
        return {
            'code': 0,
            'msg': '卸下成功',
            'data': None
        }

    def get_equipped_instrument(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }
        user_instrument = self.user_instrument_model.get_equipped_instrument(user_id)
        if not user_instrument:
            return {
                'code': 0,
                'msg': '未装备乐器',
                'data': None
            }
        instrument = self.instrument_model.get_by_id(user_instrument.get('instrument_id'))
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'user_instrument': user_instrument,
                'instrument': instrument
            }
        }
