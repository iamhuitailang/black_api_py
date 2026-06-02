from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreatePveGameRequest(BaseModel):
    ai_level: int = Field(1, ge=1, le=5, description="AI难度等级1-5")
    play_color: Optional[str] = Field('red', description="执棋颜色: red/black")


class MakeMoveRequest(BaseModel):
    piece: str = Field(..., description="棋子名称")
    from_pos: str = Field(..., description="起始位置 如e1")
    to_pos: str = Field(..., description="目标位置 如e5")
    fen_after: str = Field(..., description="走棋后的FEN字符串")


class XiangqiGameController:
    def __init__(self):
        from app.business.xiangqi077_model.game_business import XiangqiGameBusiness
        self.game_business = XiangqiGameBusiness()

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

    def ActionXiangqiGamePveCreatePost(self, request: Request, body: CreatePveGameRequest,
                                        authorization: Optional[str] = Header(None)):
        """创建人机对战"""
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.game_business.create_pve_game(
            user_id=user.get('id'),
            ai_level=body.ai_level,
            play_color=body.play_color or 'red'
        )

    def ActionXiangqiGamePvpCreatePost(self, request: Request,
                                        authorization: Optional[str] = Header(None)):
        """创建在线对战"""
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.game_business.create_pvp_game(user_id=user.get('id'))

    def ActionXiangqiGamePvpJoinPost(self, request: Request, game_id: int = Query(...),
                                      authorization: Optional[str] = Header(None)):
        """加入在线对战"""
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.game_business.join_pvp_game(game_id=game_id, user_id=user.get('id'))

    def ActionXiangqiGameDetailGet(self, request: Request, game_id: int,
                                    authorization: Optional[str] = Header(None)):
        """获取对局详情"""
        return self.game_business.get_game(game_id=game_id)

    def ActionXiangqiGameMovePost(self, request: Request, game_id: int, body: MakeMoveRequest,
                                   authorization: Optional[str] = Header(None)):
        """走棋"""
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.game_business.make_move(
            game_id=game_id,
            user_id=user.get('id'),
            piece=body.piece,
            from_pos=body.from_pos,
            to_pos=body.to_pos,
            fen_after=body.fen_after
        )

    def ActionXiangqiGameUndoRequestPost(self, request: Request, game_id: int,
                                          authorization: Optional[str] = Header(None)):
        """请求悔棋"""
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.game_business.request_undo(game_id=game_id, user_id=user.get('id'))

    def ActionXiangqiGameUndoAcceptPost(self, request: Request, game_id: int,
                                         authorization: Optional[str] = Header(None)):
        """同意悔棋"""
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.game_business.accept_undo(game_id=game_id, user_id=user.get('id'))

    def ActionXiangqiGameUndoRejectPost(self, request: Request, game_id: int,
                                         authorization: Optional[str] = Header(None)):
        """拒绝悔棋"""
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.game_business.reject_undo(game_id=game_id, user_id=user.get('id'))

    def ActionXiangqiGameDrawRequestPost(self, request: Request, game_id: int,
                                          authorization: Optional[str] = Header(None)):
        """请求求和"""
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.game_business.request_draw(game_id=game_id, user_id=user.get('id'))

    def ActionXiangqiGameDrawAcceptPost(self, request: Request, game_id: int,
                                         authorization: Optional[str] = Header(None)):
        """同意求和"""
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.game_business.accept_draw(game_id=game_id, user_id=user.get('id'))

    def ActionXiangqiGameDrawRejectPost(self, request: Request, game_id: int,
                                         authorization: Optional[str] = Header(None)):
        """拒绝求和"""
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.game_business.reject_draw(game_id=game_id, user_id=user.get('id'))

    def ActionXiangqiGameResignPost(self, request: Request, game_id: int,
                                     authorization: Optional[str] = Header(None)):
        """认输"""
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.game_business.resign(game_id=game_id, user_id=user.get('id'))

    def ActionXiangqiGameMovesGet(self, request: Request, game_id: int,
                                   authorization: Optional[str] = Header(None)):
        """获取对局走棋记录"""
        return self.game_business.get_game_moves(game_id=game_id)

    def ActionXiangqiGameStateGet(self, request: Request, game_id: int,
                                   authorization: Optional[str] = Header(None)):
        """获取对局状态（刷新保持）"""
        return self.game_business.get_game_state(game_id=game_id)

    def ActionXiangqiGameWaitingListGet(self, request: Request,
                                         page: int = Query(1, ge=1),
                                         page_size: int = Query(10, ge=1, le=100)):
        """获取等待加入的对局列表"""
        return self.game_business.get_waiting_games(page=page, page_size=page_size)

    def ActionXiangqiGameMyListGet(self, request: Request,
                                    page: int = Query(1, ge=1),
                                    page_size: int = Query(10, ge=1, le=100),
                                    authorization: Optional[str] = Header(None)):
        """获取我的对局列表"""
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.game_business.get_user_games(
            user_id=user.get('id'), page=page, page_size=page_size
        )

    def ActionXiangqiGameActiveListGet(self, request):
        """获取进行中的对局（观战大厅）"""
        return self.game_business.get_active_games()

    def ActionXiangqiGameFinishPost(self, request, game_id: int, result: int = Query(...),
                                     authorization: Optional[str] = Header(None)):
        """设置对局结果（用于前端检测到将军时调用）"""
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.game_business.finish_game_result(game_id, result)
