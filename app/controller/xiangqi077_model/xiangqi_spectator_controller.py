from typing import Optional
from fastapi import Request, Header, Query


class XiangqiSpectatorController:
    def __init__(self):
        from app.business.xiangqi077_model.spectator_business import XiangqiSpectatorBusiness
        self.spectator_business = XiangqiSpectatorBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.xiangqi077_model.user_business import XiangqiUserBusiness
        return XiangqiUserBusiness().verify_token(token)

    def ActionXiangqiSpectatorJoinPost(self, request: Request, game_id: int = Query(...),
                                        authorization: Optional[str] = Header(None)):
        """加入观战"""
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.spectator_business.join_spectate(
            game_id=game_id,
            user_id=user.get('id'),
            username=user.get('username', ''),
            nickname=user.get('nickname', '')
        )

    def ActionXiangqiSpectatorLeavePost(self, request: Request, game_id: int = Query(...),
                                          authorization: Optional[str] = Header(None)):
        """离开观战"""
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.spectator_business.leave_spectate(game_id=game_id, user_id=user.get('id'))

    def ActionXiangqiSpectatorListGet(self, request: Request, game_id: int):
        """获取对局观战者列表"""
        return self.spectator_business.get_game_spectators(game_id=game_id)

    def ActionXiangqiSpectatorCountGet(self, request: Request, game_id: int):
        """获取对局观战人数"""
        return self.spectator_business.get_spectator_count(game_id=game_id)

    def ActionXiangqiSpectatorGamesGet(self, request: Request):
        """获取可观战的对局列表"""
        return self.spectator_business.get_spectatable_games()

    def ActionXiangqiSpectatorAllGet(self, request: Request,
                                      page: int = Query(1, ge=1),
                                      page_size: int = Query(10, ge=1, le=100),
                                      game_id: Optional[int] = Query(None),
                                      authorization: Optional[str] = Header(None)):
        """管理员获取观战记录"""
        token = self._get_token_from_header(request, authorization)
        from app.business.xiangqi077_model.admin_business import XiangqiAdminBusiness
        admin = XiangqiAdminBusiness().verify_token(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.spectator_business.get_all_spectators(
            page=page, page_size=page_size, game_id=game_id
        )
