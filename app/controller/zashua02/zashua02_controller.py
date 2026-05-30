from typing import Optional
from fastapi import Header, Request
from app.business.zashua02 import (
    Zashua02UserBusiness,
    Zashua02GameBusiness,
    Zashua02ThemeBusiness,
    Zashua02RecordBusiness
)


class Zashua02Controller:
    def __init__(self):
        self.user_biz = Zashua02UserBusiness()
        self.game_biz = Zashua02GameBusiness()
        self.theme_biz = Zashua02ThemeBusiness()
        self.record_biz = Zashua02RecordBusiness()

    def _get_user_id(self, authorization: str = None) -> Optional[int]:
        if not authorization or not authorization.startswith("Bearer "):
            return None
        token = authorization.replace("Bearer ", "")
        return self.user_biz.verify_token(token)

    async def ActionZashua02UserRegisterPost(self, request: Request):
        """用户注册"""
        body = await request.json()
        username = body.get("username", "")
        password = body.get("password", "")
        nickname = body.get("nickname", "")
        return self.user_biz.register(username, password, nickname)

    async def ActionZashua02UserLoginPost(self, request: Request):
        """用户登录"""
        body = await request.json()
        username = body.get("username", "")
        password = body.get("password", "")
        return self.user_biz.login(username, password)

    async def ActionZashua02UserLogoutPost(self, authorization: str = Header(None)):
        """用户退出"""
        token = authorization.replace("Bearer ", "") if authorization and authorization.startswith("Bearer ") else None
        return self.user_biz.logout(token)

    def ActionZashua02UserCurrentGet(self, authorization: str = Header(None)):
        """获取当前用户信息"""
        user_id = self._get_user_id(authorization)
        if not user_id:
            return {"code": 1, "msg": "未登录", "data": None}
        return self.user_biz.get_user(user_id)

    async def ActionZashua02UserPasswordSet(self, request: Request, authorization: str = Header(None)):
        """修改密码"""
        user_id = self._get_user_id(authorization)
        if not user_id:
            return {"code": 1, "msg": "未登录", "data": None}
        body = await request.json()
        old_password = body.get("old_password", "")
        new_password = body.get("new_password", "")
        return self.user_biz.change_password(user_id, old_password, new_password)

    async def ActionZashua02UserUpdatePost(self, request: Request, authorization: str = Header(None)):
        """更新用户信息"""
        user_id = self._get_user_id(authorization)
        if not user_id:
            return {"code": 1, "msg": "未登录", "data": None}
        body = await request.json()
        kwargs = {}
        if "nickname" in body:
            kwargs["nickname"] = body["nickname"]
        if "character_type" in body:
            kwargs["character_type"] = body["character_type"]
        return self.user_biz.update_user(user_id, **kwargs)

    def ActionZashua02GameStateGet(self, authorization: str = Header(None)):
        """获取游戏状态"""
        user_id = self._get_user_id(authorization)
        if not user_id:
            return {"code": 1, "msg": "未登录", "data": None}
        return self.game_biz.get_state(user_id)

    async def ActionZashua02GameStateSet(self, request: Request, authorization: str = Header(None)):
        """保存游戏状态"""
        user_id = self._get_user_id(authorization)
        if not user_id:
            return {"code": 1, "msg": "未登录", "data": None}
        body = await request.json()
        return self.game_biz.save_state(user_id, **body)

    def ActionZashua02ThemeListGet(self):
        """获取所有主题"""
        return self.theme_biz.get_all_themes()

    def ActionZashua02ThemeGet(self, type: str):
        """获取指定主题"""
        return self.theme_biz.get_theme(type)

    async def ActionZashua02RecordAddPost(self, request: Request, authorization: str = Header(None)):
        """添加游戏记录"""
        user_id = self._get_user_id(authorization)
        if not user_id:
            return {"code": 1, "msg": "未登录", "data": None}
        body = await request.json()
        return self.record_biz.add_record(user_id, **body)

    def ActionZashua02RecordMyGet(self, page: int = 1, page_size: int = 20, authorization: str = Header(None)):
        """获取我的游戏记录"""
        user_id = self._get_user_id(authorization)
        if not user_id:
            return {"code": 1, "msg": "未登录", "data": None}
        return self.record_biz.get_user_records(user_id, page, page_size)

    def ActionZashua02RecordRankGet(self, limit: int = 10):
        """获取排行榜"""
        return self.record_biz.get_high_scores(limit)
