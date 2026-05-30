from typing import Optional
from fastapi import Header
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

    def ActionZashua02UserRegister(self, username: str, password: str, nickname: str = ""):
        """用户注册"""
        return self.user_biz.register(username, password, nickname)

    def ActionZashua02UserLogin(self, username: str, password: str):
        """用户登录"""
        return self.user_biz.login(username, password)

    def ActionZashua02UserLogout(self, authorization: str = Header(None)):
        """用户退出"""
        token = authorization.replace("Bearer ", "") if authorization and authorization.startswith("Bearer ") else None
        return self.user_biz.logout(token)

    def ActionZashua02UserCurrentGet(self, authorization: str = Header(None)):
        """获取当前用户信息"""
        user_id = self._get_user_id(authorization)
        if not user_id:
            return {"code": 1, "msg": "未登录", "data": None}
        return self.user_biz.get_user(user_id)

    def ActionZashua02UserPasswordSet(self, old_password: str, new_password: str, authorization: str = Header(None)):
        """修改密码"""
        user_id = self._get_user_id(authorization)
        if not user_id:
            return {"code": 1, "msg": "未登录", "data": None}
        return self.user_biz.change_password(user_id, old_password, new_password)

    def ActionZashua02UserUpdate(self, nickname: Optional[str] = None, character_type: Optional[str] = None, authorization: str = Header(None)):
        """更新用户信息"""
        user_id = self._get_user_id(authorization)
        if not user_id:
            return {"code": 1, "msg": "未登录", "data": None}
        kwargs = {}
        if nickname is not None:
            kwargs["nickname"] = nickname
        if character_type is not None:
            kwargs["character_type"] = character_type
        return self.user_biz.update_user(user_id, **kwargs)

    def ActionZashua02GameStateGet(self, authorization: str = Header(None)):
        """获取游戏状态"""
        user_id = self._get_user_id(authorization)
        if not user_id:
            return {"code": 1, "msg": "未登录", "data": None}
        return self.game_biz.get_state(user_id)

    def ActionZashua02GameStateSet(self, level: Optional[int] = None, score: Optional[int] = None,
                                   hp: Optional[int] = None, max_hp: Optional[int] = None,
                                   combo: Optional[int] = None, max_combo: Optional[int] = None,
                                   difficulty: Optional[str] = None, theme: Optional[str] = None,
                                   character_type: Optional[str] = None, props_data: Optional[str] = None,
                                   teammates_data: Optional[str] = None, authorization: str = Header(None)):
        """保存游戏状态"""
        user_id = self._get_user_id(authorization)
        if not user_id:
            return {"code": 1, "msg": "未登录", "data": None}
        kwargs = {}
        if level is not None: kwargs["level"] = level
        if score is not None: kwargs["score"] = score
        if hp is not None: kwargs["hp"] = hp
        if max_hp is not None: kwargs["max_hp"] = max_hp
        if combo is not None: kwargs["combo"] = combo
        if max_combo is not None: kwargs["max_combo"] = max_combo
        if difficulty is not None: kwargs["difficulty"] = difficulty
        if theme is not None: kwargs["theme"] = theme
        if character_type is not None: kwargs["character_type"] = character_type
        if props_data is not None: kwargs["props_data"] = props_data
        if teammates_data is not None: kwargs["teammates_data"] = teammates_data
        return self.game_biz.save_state(user_id, **kwargs)

    def ActionZashua02ThemeListGet(self):
        """获取所有主题"""
        return self.theme_biz.get_all_themes()

    def ActionZashua02ThemeGet(self, type: str):
        """获取指定主题"""
        return self.theme_biz.get_theme(type)

    def ActionZashua02RecordAdd(self, level: int = 1, score: int = 0, combo: int = 0, max_combo: int = 0,
                                character_type: str = "clown", difficulty: str = "normal", passed: int = 0,
                                authorization: str = Header(None)):
        """添加游戏记录"""
        user_id = self._get_user_id(authorization)
        if not user_id:
            return {"code": 1, "msg": "未登录", "data": None}
        return self.record_biz.add_record(user_id, level=level, score=score, combo=combo, max_combo=max_combo,
                                          character_type=character_type, difficulty=difficulty, passed=passed)

    def ActionZashua02RecordMyGet(self, page: int = 1, page_size: int = 20, authorization: str = Header(None)):
        """获取我的游戏记录"""
        user_id = self._get_user_id(authorization)
        if not user_id:
            return {"code": 1, "msg": "未登录", "data": None}
        return self.record_biz.get_user_records(user_id, page, page_size)

    def ActionZashua02RecordRankGet(self, limit: int = 10):
        """获取排行榜"""
        return self.record_biz.get_high_scores(limit)
