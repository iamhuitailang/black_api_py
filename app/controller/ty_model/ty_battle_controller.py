from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateBattleRequest(BaseModel):
    weapon_id: int = Field(..., description="使用的武器ID")


class TyBattleController:
    def __init__(self):
        from app.business.ty_model.battle_business import TyBattleBusiness
        self.battle_business = TyBattleBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.ty_model.auth_business import TyAuthBusiness
        auth_business = TyAuthBusiness()
        return auth_business.verify_token(token)

    def ActionTyBattleCreatePvePost(self, request: Request, body: CreateBattleRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        创建PVE战斗接口
        POST /api/ty/battle/create/pve
        创建人机对战
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.battle_business.create_pve_battle(
            user_id=user.get('id'),
            weapon_id=body.weapon_id
        )

    def ActionTyBattleRoundExecutePost(self, request: Request, battle_id: int = Query(..., description="战斗ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        执行战斗回合接口
        POST /api/ty/battle/round/execute
        执行一个战斗回合
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.battle_business.execute_round(battle_id, user.get('id'))

    def ActionTyBattleDetailGet(self, request: Request, battle_id: int = Query(..., description="战斗ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        获取战斗详情接口
        GET /api/ty/battle/detail
        根据战斗ID获取战斗详情
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.battle_business.get_battle_detail(battle_id, user.get('id'))

    def ActionTyBattleMyListGet(self, request: Request, page: int = Query(1, description="页码"),
                                 page_size: int = Query(10, description="每页数量"),
                                 status: Optional[int] = Query(None, description="战斗状态"),
                                 mode: Optional[str] = Query(None, description="战斗模式"),
                                 authorization: Optional[str] = Header(None)):
        """
        获取我的战斗记录接口
        GET /api/ty/battle/my/list
        分页获取当前用户的战斗记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.battle_business.get_user_battles(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status,
            mode=mode
        )

    def ActionTyBattleCancelPost(self, request: Request, battle_id: int = Query(..., description="战斗ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        取消战斗接口
        POST /api/ty/battle/cancel
        取消未完成的战斗
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.battle_business.cancel_battle(battle_id, user.get('id'))

    def ActionTyBattleAutoPost(self, request: Request, battle_id: int = Query(..., description="战斗ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        自动战斗接口
        POST /api/ty/battle/auto
        自动执行剩余所有回合直到战斗结束
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.battle_business.auto_battle(battle_id, user.get('id'))
