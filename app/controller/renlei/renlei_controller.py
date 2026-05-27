from typing import Optional
from fastapi import Request, Query
from pydantic import BaseModel
from app.business.renlei import (
    UserBusiness, CharacterBusiness, LevelBusiness,
    ProgressBusiness, SessionBusiness
)


class LoginRequest(BaseModel):
    username: str
    password: str
    token: Optional[str] = None


class RegisterRequest(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    nickname: Optional[str] = None
    token: Optional[str] = None


class UpdateUserRequest(BaseModel):
    nickname: Optional[str] = None
    email: Optional[str] = None
    avatar: Optional[str] = None
    token: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
    token: Optional[str] = None


class SetCharacterRequest(BaseModel):
    character_id: int
    token: Optional[str] = None


class SetLevelRequest(BaseModel):
    level_id: int
    token: Optional[str] = None


class CreateSessionRequest(BaseModel):
    level_id: int
    character_id: int
    token: Optional[str] = None


class UpdateSessionRequest(BaseModel):
    session_token: str
    game_state: Optional[dict] = None
    player_position: Optional[dict] = None
    token: Optional[str] = None


class EndSessionRequest(BaseModel):
    session_token: str
    token: Optional[str] = None


class CompleteLevelRequest(BaseModel):
    level_id: int
    completion_time: Optional[float] = None
    token: Optional[str] = None


class IncrementAttemptsRequest(BaseModel):
    level_id: int
    token: Optional[str] = None


class RenleiController:
    def __init__(self):
        self.user_business = UserBusiness()
        self.character_business = CharacterBusiness()
        self.level_business = LevelBusiness()
        self.progress_business = ProgressBusiness()
        self.session_business = SessionBusiness()

    def _get_user_from_token(self, token: str):
        if not token:
            return None
        return self.user_business.verify_token(token)

    def ActionRenleiLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录
        POST /api/renlei/login
        """
        return self.user_business.login(body.username, body.password)

    def ActionRenleiRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册
        POST /api/renlei/register
        """
        return self.user_business.register(body.username, body.password, body.email, body.nickname)

    def ActionRenleiGetuserinfo(self, request: Request, token: str = Query(...)):
        """
        获取用户信息
        GET /api/renlei/getuserinfo
        """
        user = self._get_user_from_token(token)
        if not user:
            return {'code': 1, 'message': '无效的token', 'data': None}
        return self.user_business.get_user_info(user['id'])

    def ActionRenleiUpdateuserPost(self, request: Request, body: UpdateUserRequest):
        """
        更新用户信息
        POST /api/renlei/updateuser
        """
        user = self._get_user_from_token(body.token)
        if not user:
            return {'code': 1, 'message': '无效的token', 'data': None}
        return self.user_business.update_user(user['id'], nickname=body.nickname, email=body.email, avatar=body.avatar)

    def ActionRenleiChangepasswordPost(self, request: Request, body: ChangePasswordRequest):
        """
        修改密码
        POST /api/renlei/changepassword
        """
        user = self._get_user_from_token(body.token)
        if not user:
            return {'code': 1, 'message': '无效的token', 'data': None}
        return self.user_business.change_password(user['id'], body.old_password, body.new_password)

    def ActionRenleiSetcharacterPost(self, request: Request, body: SetCharacterRequest):
        """
        设置当前角色
        POST /api/renlei/setcharacter
        """
        user = self._get_user_from_token(body.token)
        if not user:
            return {'code': 1, 'message': '无效的token', 'data': None}
        return self.user_business.set_current_character(user['id'], body.character_id)

    def ActionRenleiSetlevelPost(self, request: Request, body: SetLevelRequest):
        """
        设置当前关卡
        POST /api/renlei/setlevel
        """
        user = self._get_user_from_token(body.token)
        if not user:
            return {'code': 1, 'message': '无效的token', 'data': None}
        return self.user_business.set_current_level(user['id'], body.level_id)

    def ActionRenleiGetcharacters(self, request: Request, token: str = Query(...)):
        """
        获取角色列表
        GET /api/renlei/getcharacters
        """
        user = self._get_user_from_token(token)
        if not user:
            return {'code': 1, 'message': '无效的token', 'data': None}
        return self.character_business.list_characters()

    def ActionRenleiGetlevels(self, request: Request, token: str = Query(...), only_active: bool = Query(True)):
        """
        获取关卡列表
        GET /api/renlei/getlevels
        """
        user = self._get_user_from_token(token)
        if not user:
            return {'code': 1, 'message': '无效的token', 'data': None}
        return self.level_business.list_levels(only_active)

    def ActionRenleiGetlevel(self, request: Request, token: str = Query(...), level_id: int = Query(...)):
        """
        获取单个关卡详情
        GET /api/renlei/getlevel
        """
        user = self._get_user_from_token(token)
        if not user:
            return {'code': 1, 'message': '无效的token', 'data': None}
        return self.level_business.get_level(level_id)

    def ActionRenleiGetmyprogress(self, request: Request, token: str = Query(...)):
        """
        获取我的游戏进度
        GET /api/renlei/getmyprogress
        """
        user = self._get_user_from_token(token)
        if not user:
            return {'code': 1, 'message': '无效的token', 'data': None}
        return self.progress_business.get_my_progress(user['id'])

    def ActionRenleiGetcompletedlevels(self, request: Request, token: str = Query(...)):
        """
        获取已通关的关卡
        GET /api/renlei/getcompletedlevels
        """
        user = self._get_user_from_token(token)
        if not user:
            return {'code': 1, 'message': '无效的token', 'data': None}
        return self.progress_business.get_completed_levels(user['id'])

    def ActionRenleiIncrementattemptsPost(self, request: Request, body: IncrementAttemptsRequest):
        """
        增加关卡尝试次数
        POST /api/renlei/incrementattempts
        """
        user = self._get_user_from_token(body.token)
        if not user:
            return {'code': 1, 'message': '无效的token', 'data': None}
        return self.progress_business.increment_attempts(user['id'], body.level_id)

    def ActionRenleiCompletelevelPost(self, request: Request, body: CompleteLevelRequest):
        """
        标记关卡通关
        POST /api/renlei/completelevel
        """
        user = self._get_user_from_token(body.token)
        if not user:
            return {'code': 1, 'message': '无效的token', 'data': None}
        return self.progress_business.complete_level(user['id'], body.level_id, body.completion_time)

    def ActionRenleiCreatesessionPost(self, request: Request, body: CreateSessionRequest):
        """
        创建游戏会话
        POST /api/renlei/createsession
        """
        user = self._get_user_from_token(body.token)
        if not user:
            return {'code': 1, 'message': '无效的token', 'data': None}
        return self.session_business.create_session(user['id'], body.level_id, body.character_id)

    def ActionRenleiGetactivesession(self, request: Request, token: str = Query(...)):
        """
        获取活跃游戏会话
        GET /api/renlei/getactivesession
        """
        user = self._get_user_from_token(token)
        if not user:
            return {'code': 1, 'message': '无效的token', 'data': None}
        return self.session_business.get_active_session(user['id'])

    def ActionRenleiUpdatesessionPost(self, request: Request, body: UpdateSessionRequest):
        """
        更新游戏会话状态
        POST /api/renlei/updatesession
        """
        user = self._get_user_from_token(body.token)
        if not user:
            return {'code': 1, 'message': '无效的token', 'data': None}
        return self.session_business.update_session(body.session_token, body.game_state, body.player_position)

    def ActionRenleiEndsessionPost(self, request: Request, body: EndSessionRequest):
        """
        结束游戏会话
        POST /api/renlei/endsession
        """
        user = self._get_user_from_token(body.token)
        if not user:
            return {'code': 1, 'message': '无效的token', 'data': None}
        return self.session_business.end_session(body.session_token)
