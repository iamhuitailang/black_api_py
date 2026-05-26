from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class UpdateSettingsRequest(BaseModel):
    read_mode: Optional[str] = Field(None, description="阅读模式: single/double/scroll")
    theme: Optional[str] = Field(None, description="主题: dark/light")
    brightness: Optional[int] = Field(None, description="亮度 0-100")
    auto_play: Optional[int] = Field(None, description="自动播放 0/1")
    auto_play_speed: Optional[int] = Field(None, description="自动播放速度 1-5")
    font_size: Optional[int] = Field(None, description="字体大小")
    page_direction: Optional[str] = Field(None, description="翻页方向 ltr/rtl")
    show_page_num: Optional[int] = Field(None, description="显示页码 0/1")
    show_timestamp: Optional[int] = Field(None, description="显示时间戳 0/1")
    extra_settings: Optional[dict] = Field(None, description="额外设置")


class ManhuaSettingsController:
    def __init__(self):
        from app.business.manhua.settings_business import ManhuaSettingsBusiness
        from app.business.manhua.user_business import ManhuaUserBusiness
        self.settings_business = ManhuaSettingsBusiness()
        self.user_business = ManhuaUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionManhuaSettingsGet(self, request: Request,
                                 authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return self.settings_business.get_default_settings()

        return self.settings_business.get_settings(user.get('id'))

    def ActionManhuaSettingsUpdatePost(self, request: Request, body: UpdateSettingsRequest,
                                        authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {}
        if body.read_mode is not None:
            data['read_mode'] = body.read_mode
        if body.theme is not None:
            data['theme'] = body.theme
        if body.brightness is not None:
            data['brightness'] = body.brightness
        if body.auto_play is not None:
            data['auto_play'] = body.auto_play
        if body.auto_play_speed is not None:
            data['auto_play_speed'] = body.auto_play_speed
        if body.font_size is not None:
            data['font_size'] = body.font_size
        if body.page_direction is not None:
            data['page_direction'] = body.page_direction
        if body.show_page_num is not None:
            data['show_page_num'] = body.show_page_num
        if body.show_timestamp is not None:
            data['show_timestamp'] = body.show_timestamp
        if body.extra_settings is not None:
            data['extra_settings'] = body.extra_settings

        return self.settings_business.update_settings(user.get('id'), data)