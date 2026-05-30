from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class SetThemeRequest(BaseModel):
    theme_code: str = Field(..., description="主题代码：carnival/vintage/dark")


class UnlockThemeRequest(BaseModel):
    theme_code: str = Field(..., description="主题代码")


class ChouchouThemeController:
    def __init__(self):
        from app.business.chouchou_model import ThemeBusiness, UserBusiness
        self.theme_business = ThemeBusiness()
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

    def ActionChouchouThemeMyGet(self, request: Request,
                                  authorization: Optional[str] = Header(None)):
        """
        获取我的主题列表接口
        GET /api/chouchou_model/theme/my/get
        获取当前用户的主题列表及解锁状态
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.theme_business.get_user_themes(user.get('id'))

    def ActionChouchouThemeCurrentGet(self, request: Request,
                                       authorization: Optional[str] = Header(None)):
        """
        获取当前使用的主题接口
        GET /api/chouchou_model/theme/current/get
        获取当前用户正在使用的主题
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.theme_business.get_current_theme(user.get('id'))

    def ActionChouchouThemeSetPost(self, request: Request, body: SetThemeRequest,
                                    authorization: Optional[str] = Header(None)):
        """
        设置当前主题接口
        POST /api/chouchou_model/theme/set
        切换当前使用的主题
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.theme_business.set_current_theme(
            user_id=user.get('id'),
            theme_code=body.theme_code
        )

    def ActionChouchouThemeUnlockPost(self, request: Request, body: UnlockThemeRequest,
                                       authorization: Optional[str] = Header(None)):
        """
        解锁主题接口
        POST /api/chouchou_model/theme/unlock
        解锁指定主题
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.theme_business.unlock_theme(
            user_id=user.get('id'),
            theme_code=body.theme_code
        )

    def ActionChouchouThemeAllGet(self, request: Request,
                                   authorization: Optional[str] = Header(None)):
        """
        获取所有主题接口
        GET /api/chouchou_model/theme/all/get
        获取所有可用主题列表
        """
        return self.theme_business.get_all_themes()
