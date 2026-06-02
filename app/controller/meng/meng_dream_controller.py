from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field

from app.business.meng import MengDreamBusiness, MengUserBusiness


class CreateDreamRequest(BaseModel):
    name: str = Field(..., description="梦境名称")
    description: Optional[str] = Field(None, description="梦境描述")


class UpdateDreamRequest(BaseModel):
    name: Optional[str] = Field(None, description="梦境名称")
    description: Optional[str] = Field(None, description="梦境描述")
    thumbnail: Optional[str] = Field(None, description="缩略图")


class UpdateSettingsRequest(BaseModel):
    dream_id: int = Field(..., description="梦境ID")
    gravity: Optional[float] = Field(None, description="重力值 0-10")
    weather: Optional[str] = Field(None, description="天气")
    time_of_day: Optional[str] = Field(None, description="昼夜")


class MengDreamController:
    def __init__(self):
        self.dream_business = MengDreamBusiness()
        self.user_business = MengUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionMengDreamCreatePost(self, request: Request, body: CreateDreamRequest,
                                   authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.dream_business.create_dream(
            user_id=user.get('id'),
            name=body.name,
            description=body.description or ''
        )

    def ActionMengDreamMyGet(self, request: Request,
                              page: int = Query(1, ge=1, description="页码"),
                              page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                              authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.dream_business.get_my_dreams(
            user_id=user.get('id'),
            page=page,
            page_size=page_size
        )

    def ActionMengDreamPublicGet(self, request: Request,
                                  page: int = Query(1, ge=1, description="页码"),
                                  page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                  keyword: Optional[str] = Query(None, description="搜索关键词"),
                                  weather: Optional[str] = Query(None, description="天气筛选"),
                                  time_of_day: Optional[str] = Query(None, description="昼夜筛选")):
        return self.dream_business.get_public_dreams(
            page=page,
            page_size=page_size,
            keyword=keyword or '',
            weather=weather,
            time_of_day=time_of_day
        )

    def ActionMengDreamDetailGet(self, request: Request,
                                  dream_id: int = Query(..., description="梦境ID"),
                                  authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        visitor_user_id = user.get('id') if user else None

        return self.dream_business.get_dream_detail(
            dream_id=dream_id,
            visitor_user_id=visitor_user_id
        )

    def ActionMengDreamUpdatePost(self, request: Request,
                                   dream_id: int = Query(..., description="梦境ID"),
                                   body: UpdateDreamRequest = None,
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
        if body.name is not None:
            data['name'] = body.name
        if body.description is not None:
            data['description'] = body.description
        if body.thumbnail is not None:
            data['thumbnail'] = body.thumbnail

        return self.dream_business.update_dream(
            user_id=user.get('id'),
            dream_id=dream_id,
            data=data
        )

    def ActionMengDreamDeletePost(self, request: Request,
                                   dream_id: int = Query(..., description="梦境ID"),
                                   authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.dream_business.delete_dream(
            user_id=user.get('id'),
            dream_id=dream_id
        )

    def ActionMengDreamPublicTogglePost(self, request: Request,
                                         dream_id: int = Query(..., description="梦境ID"),
                                         authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.dream_business.toggle_public(
            user_id=user.get('id'),
            dream_id=dream_id
        )

    def ActionMengDreamLikePost(self, request: Request,
                                 dream_id: int = Query(..., description="梦境ID"),
                                 authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.dream_business.like_dream(
            user_id=user.get('id'),
            dream_id=dream_id
        )

    def ActionMengDreamSettingsUpdatePost(self, request: Request,
                                           body: UpdateSettingsRequest,
                                           authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        detail_result = self.dream_business.get_dream_detail(
            dream_id=body.dream_id,
            visitor_user_id=user.get('id')
        )

        if detail_result.get('code') != 0:
            return detail_result

        current_dream = detail_result.get('data', {})
        gravity = body.gravity if body.gravity is not None else current_dream.get('gravity', 1.0)
        weather = body.weather if body.weather is not None else current_dream.get('weather', 'sunny')
        time_of_day = body.time_of_day if body.time_of_day is not None else current_dream.get('time_of_day', 'day')

        return self.dream_business.update_settings(
            user_id=user.get('id'),
            dream_id=body.dream_id,
            gravity=gravity,
            weather=weather,
            time_of_day=time_of_day
        )

    def ActionMengDreamStatisticsGet(self, request: Request,
                                      authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.dream_business.get_dream_statistics(
            user_id=user.get('id')
        )
