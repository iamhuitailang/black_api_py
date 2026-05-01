from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class UpdateSkinRequest(BaseModel):
    skin_id: int = Field(..., description="外观ID")


class AddExpRequest(BaseModel):
    exp: int = Field(..., description="经验值")


class TankeTankController:
    def __init__(self):
        from app.business.tanke.tank_business import TankeTankBusiness
        self.tank_business = TankeTankBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.tanke.user_business import TankeUserBusiness
        user_business = TankeUserBusiness()
        return user_business.verify_token(token)

    def ActionTankeTankInfoGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取坦克信息接口
        GET /api/tanke/tank/info/get
        获取当前用户的坦克详细信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.tank_business.get_tank_by_user_id(user.get('id'))

    def ActionTankeTankExpAddPost(self, request: Request, body: AddExpRequest,
                                    authorization: Optional[str] = Header(None)):
        """
        添加经验值接口
        POST /api/tanke/tank/exp/add
        为坦克添加经验值，可能触发升级
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.tank_business.add_exp(
            user_id=user.get('id'),
            exp=body.exp
        )

    def ActionTankeTankSkinUpdatePost(self, request: Request, body: UpdateSkinRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        更新坦克外观接口
        POST /api/tanke/tank/skin/update
        切换已解锁的坦克外观
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.tank_business.update_skin(
            user_id=user.get('id'),
            skin_id=body.skin_id
        )

    def ActionTankeTankSkinListGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取坦克外观列表接口
        GET /api/tanke/tank/skin/list/get
        获取所有可解锁的坦克外观及解锁状态
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.tank_business.get_all_skins(user.get('id'))
