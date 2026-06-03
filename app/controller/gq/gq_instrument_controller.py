from typing import Optional
from fastapi import Request, Header, Query


class GqInstrumentController:
    def __init__(self):
        from app.business.gq.instrument_business import GqInstrumentBusiness
        self.instrument_business = GqInstrumentBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.gq.user_business import GqUserBusiness
        user_business = GqUserBusiness()
        return user_business.verify_token(token)

    def ActionGqInstrumentListGet(self, request: Request, page: int = Query(1), page_size: int = Query(10),
                                   type: Optional[str] = Query(None), rarity: Optional[int] = Query(None),
                                   authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.instrument_business.get_instrument_list(
            page=page,
            page_size=page_size,
            type=type,
            rarity=rarity
        )

    def ActionGqInstrumentDetailGet(self, request: Request, instrument_id: int = Query(..., description="乐器ID"),
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.instrument_business.get_instrument_detail(instrument_id)

    def ActionGqInstrumentUserListGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.instrument_business.get_user_instruments(user.get('id'))

    def ActionGqInstrumentUnlockPost(self, request: Request, body: dict, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        instrument_id = body.get('instrument_id')
        return self.instrument_business.unlock_instrument(user.get('id'), instrument_id)

    def ActionGqInstrumentEquipPost(self, request: Request, body: dict, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        instrument_id = body.get('instrument_id')
        return self.instrument_business.equip_instrument(user.get('id'), instrument_id)

    def ActionGqInstrumentUnequipPost(self, request: Request, body: dict, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        instrument_id = body.get('instrument_id')
        return self.instrument_business.unequip_instrument(user.get('id'), instrument_id)

    def ActionGqInstrumentEquippedGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.instrument_business.get_equipped_instrument(user.get('id'))
