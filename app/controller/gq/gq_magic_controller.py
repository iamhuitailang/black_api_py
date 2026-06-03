from typing import Optional
from fastapi import Request, Header, Query


class GqMagicController:
    def __init__(self):
        from app.business.gq.magic_business import GqMagicBusiness
        self.magic_business = GqMagicBusiness()

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

    def ActionGqMagicListGet(self, request: Request, page: int = Query(1), page_size: int = Query(10),
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

        return self.magic_business.get_magic_list(
            page=page,
            page_size=page_size,
            type=type,
            rarity=rarity
        )

    def ActionGqMagicDetailGet(self, request: Request, magic_id: int = Query(..., description="魔法特效ID"),
                                authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.magic_business.get_magic_detail(magic_id)

    def ActionGqMagicUserListGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.magic_business.get_user_magics(user.get('id'))

    def ActionGqMagicUnlockPost(self, request: Request, body: dict, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        magic_id = body.get('magic_id')
        return self.magic_business.unlock_magic(user.get('id'), magic_id)

    def ActionGqMagicEquipPost(self, request: Request, body: dict, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        magic_id = body.get('magic_id')
        return self.magic_business.equip_magic(user.get('id'), magic_id)

    def ActionGqMagicUnequipPost(self, request: Request, body: dict, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        magic_id = body.get('magic_id')
        return self.magic_business.unequip_magic(user.get('id'), magic_id)

    def ActionGqMagicEquippedListGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.magic_business.get_equipped_magics(user.get('id'))
