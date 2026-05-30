from typing import Optional, Any
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field
from typing import Dict


class UpdateSettingsRequest(BaseModel):
    sound_enabled: Optional[bool] = Field(None, description="是否开启音效")
    music_volume: Optional[int] = Field(None, description="音乐音量", ge=0, le=100)
    effect_volume: Optional[int] = Field(None, description="音效音量", ge=0, le=100)
    animation_enabled: Optional[bool] = Field(None, description="是否开启动画")
    auto_start_ai: Optional[bool] = Field(None, description="是否自动启动AI")
    ai_difficulty: Optional[str] = Field(None, description="AI难度：easy/normal/hard")
    max_players: Optional[int] = Field(None, description="默认最大玩家数", ge=3, le=12)
    min_players: Optional[int] = Field(None, description="默认最小玩家数", ge=2, le=6)
    total_rounds: Optional[int] = Field(None, description="默认总回合数", ge=1, le=20)
    default_theme: Optional[str] = Field(None, description="默认主题")
    show_role_hints: Optional[bool] = Field(None, description="是否显示身份提示")
    confirm_actions: Optional[bool] = Field(None, description="是否确认操作")


class SetValueRequest(BaseModel):
    key: str = Field(..., description="设置键")
    value: Any = Field(..., description="设置值")


class ChouchouSettingController:
    def __init__(self):
        from app.business.chouchou_model import SettingBusiness, UserBusiness
        self.setting_business = SettingBusiness()
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

    def ActionChouchouSettingGet(self, request: Request,
                                  authorization: Optional[str] = Header(None)):
        """
        获取用户设置接口
        GET /api/chouchou_model/setting/get
        获取当前用户的所有设置
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.setting_business.get_settings(user.get('id'))

    def ActionChouchouSettingUpdatePost(self, request: Request, body: UpdateSettingsRequest,
                                         authorization: Optional[str] = Header(None)):
        """
        更新用户设置接口
        POST /api/chouchou_model/setting/update
        批量更新用户设置
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        settings = {}
        if body.sound_enabled is not None:
            settings['sound_enabled'] = body.sound_enabled
        if body.music_volume is not None:
            settings['music_volume'] = body.music_volume
        if body.effect_volume is not None:
            settings['effect_volume'] = body.effect_volume
        if body.animation_enabled is not None:
            settings['animation_enabled'] = body.animation_enabled
        if body.auto_start_ai is not None:
            settings['auto_start_ai'] = body.auto_start_ai
        if body.ai_difficulty is not None:
            settings['ai_difficulty'] = body.ai_difficulty
        if body.max_players is not None:
            settings['max_players'] = body.max_players
        if body.min_players is not None:
            settings['min_players'] = body.min_players
        if body.total_rounds is not None:
            settings['total_rounds'] = body.total_rounds
        if body.default_theme is not None:
            settings['default_theme'] = body.default_theme
        if body.show_role_hints is not None:
            settings['show_role_hints'] = body.show_role_hints
        if body.confirm_actions is not None:
            settings['confirm_actions'] = body.confirm_actions

        return self.setting_business.update_settings(
            user_id=user.get('id'),
            settings=settings
        )

    def ActionChouchouSettingValueGet(self, request: Request, key: str = Query(..., description="设置键"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取单个设置值接口
        GET /api/chouchou_model/setting/value/get
        获取指定键的设置值
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.setting_business.get_value(
            user_id=user.get('id'),
            key=key
        )

    def ActionChouchouSettingValueSetPost(self, request: Request, body: SetValueRequest,
                                           authorization: Optional[str] = Header(None)):
        """
        设置单个设置值接口
        POST /api/chouchou_model/setting/value/set
        设置指定键的设置值
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.setting_business.set_value(
            user_id=user.get('id'),
            key=body.key,
            value=body.value
        )

    def ActionChouchouSettingResetPost(self, request: Request,
                                        authorization: Optional[str] = Header(None)):
        """
        重置设置接口
        POST /api/chouchou_model/setting/reset
        重置所有设置为默认值
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.setting_business.reset_to_default(user.get('id'))
