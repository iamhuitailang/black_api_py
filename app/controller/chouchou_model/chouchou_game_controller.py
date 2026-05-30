from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateGameRequest(BaseModel):
    name: Optional[str] = Field(None, description="游戏名称")
    theme: Optional[str] = Field('carnival', description="主题：carnival/vintage/dark")
    max_players: Optional[int] = Field(8, description="最大玩家数", ge=3, le=12)
    min_players: Optional[int] = Field(3, description="最小玩家数", ge=2, le=6)
    total_rounds: Optional[int] = Field(5, description="总回合数", ge=1, le=20)
    add_ai: Optional[bool] = Field(True, description="是否添加AI玩家")


class JoinGameRequest(BaseModel):
    room_code: str = Field(..., description="房间号")


class PublishCommandRequest(BaseModel):
    game_id: int = Field(..., description="游戏ID")
    command_type: str = Field(..., description="指令类型")
    custom_content: Optional[str] = Field('', description="自定义内容")
    duration: Optional[int] = Field(None, description="执行时长（秒）")


class SubmitActionRequest(BaseModel):
    game_id: int = Field(..., description="游戏ID")
    command_id: int = Field(..., description="指令ID")
    player_id: int = Field(..., description="玩家ID")
    action: str = Field(..., description="行为：obey/refuse/sabotage")


class ResolveCommandRequest(BaseModel):
    game_id: int = Field(..., description="游戏ID")
    command_id: int = Field(..., description="指令ID")


class ChangeThemeRequest(BaseModel):
    game_id: int = Field(..., description="游戏ID")
    theme: str = Field(..., description="主题：carnival/vintage/dark")


class NextRoundRequest(BaseModel):
    game_id: int = Field(..., description="游戏ID")


class StartGameRequest(BaseModel):
    game_id: int = Field(..., description="游戏ID")


class JoinGameByCodeRequest(BaseModel):
    room_code: str = Field(..., description="房间号")


class LeaveGameRequest(BaseModel):
    game_id: int = Field(..., description="游戏ID")


class ChouchouGameController:
    def __init__(self):
        from app.business.chouchou_model import GameBusiness, UserBusiness
        self.game_business = GameBusiness()
        self.user_business = UserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization:
            if authorization.startswith('Bearer '):
                return authorization[7:]
            return authorization

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionChouchouGameCreatePost(self, request: Request, body: CreateGameRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        创建游戏接口
        POST /api/chouchou_model/game/create
        创建新游戏房间，返回房间信息和玩家列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.create_game(
            host_id=user.get('id'),
            name=body.name or '',
            theme=body.theme or 'carnival',
            max_players=body.max_players or 8,
            min_players=body.min_players or 3,
            total_rounds=body.total_rounds or 5,
            add_ai=body.add_ai if body.add_ai is not None else True
        )

    def ActionChouchouGameJoinPost(self, request: Request, body: JoinGameRequest,
                                    authorization: Optional[str] = Header(None)):
        """
        加入游戏接口
        POST /api/chouchou_model/game/join
        通过房间号加入游戏
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.join_game(
            user_id=user.get('id'),
            room_code=body.room_code
        )

    def ActionChouchouGameStartPost(self, request: Request, body: StartGameRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        开始游戏接口
        POST /api/chouchou_model/game/start
        房主开始游戏，分配身份
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.start_game(
            game_id=body.game_id,
            user_id=user.get('id')
        )

    def ActionChouchouGameInfoGet(self, request: Request, game_id: int = Query(..., description="游戏ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取游戏信息接口
        GET /api/chouchou_model/game/info/get
        获取游戏详细信息、玩家列表、当前指令
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.get_game_info(game_id)

    def ActionChouchouGameCommandPublishPost(self, request: Request, body: PublishCommandRequest,
                                              authorization: Optional[str] = Header(None)):
        """
        发布指令接口
        POST /api/chouchou_model/game/command/publish
        国王发布指令
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.publish_command(
            game_id=body.game_id,
            king_id=user.get('id'),
            command_type=body.command_type,
            custom_content=body.custom_content or '',
            duration=body.duration
        )

    def ActionChouchouGameActionSubmitPost(self, request: Request, body: SubmitActionRequest,
                                            authorization: Optional[str] = Header(None)):
        """
        提交行为接口
        POST /api/chouchou_model/game/action/submit
        玩家选择服从、拒绝或捣乱
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.submit_action(
            game_id=body.game_id,
            command_id=body.command_id,
            player_id=body.player_id,
            action=body.action,
            user_id=user.get('id')
        )

    def ActionChouchouGameCommandResolvePost(self, request: Request, body: ResolveCommandRequest,
                                              authorization: Optional[str] = Header(None)):
        """
        结算指令接口
        POST /api/chouchou_model/game/command/resolve
        结算当前指令，计算积分和惩罚
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.resolve_command(
            game_id=body.game_id,
            command_id=body.command_id
        )

    def ActionChouchouGameRoundNextPost(self, request: Request, body: NextRoundRequest,
                                         authorization: Optional[str] = Header(None)):
        """
        下一轮接口
        POST /api/chouchou_model/game/round/next
        进入下一轮，重新分配身份
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.next_round(
            game_id=body.game_id,
            user_id=user.get('id')
        )

    def ActionChouchouGameThemeChangePost(self, request: Request, body: ChangeThemeRequest,
                                           authorization: Optional[str] = Header(None)):
        """
        切换游戏主题接口
        POST /api/chouchou_model/game/theme/change
        切换游戏主题
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.change_theme(
            game_id=body.game_id,
            theme=body.theme
        )

    def ActionChouchouGameCommandsGet(self, request: Request,
                                       authorization: Optional[str] = Header(None)):
        """
        获取可用指令接口
        GET /api/chouchou_model/game/commands/get
        获取所有可用的基础指令和特殊指令
        """
        return self.game_business.get_available_commands()

    def ActionChouchouGameLeavePost(self, request: Request, body: LeaveGameRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        离开游戏接口
        POST /api/chouchou_model/game/leave
        离开当前游戏房间
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.leave_game(
            game_id=body.game_id,
            user_id=user.get('id')
        )

    def ActionChouchouGameMyGamesGet(self, request: Request, limit: int = Query(10, description="数量"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取我的游戏记录接口
        GET /api/chouchou_model/game/my/games/get
        获取当前用户的游戏历史记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.get_user_games(
            user_id=user.get('id'),
            limit=limit
        )

    def ActionChouchouGameActiveGet(self, request: Request, limit: int = Query(10, description="数量"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取活跃游戏接口
        GET /api/chouchou_model/game/active/get
        获取正在等待或进行中的游戏列表
        """
        return self.game_business.get_active_games(limit=limit)
