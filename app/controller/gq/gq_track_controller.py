from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateTrackRequest(BaseModel):
    title: str = Field(..., description="曲目名称")
    description: Optional[str] = Field(None, description="描述")
    difficulty: Optional[int] = Field(None, description="难度")
    notes: Optional[str] = Field(None, description="音符数据")
    bpm: Optional[int] = Field(None, description="BPM")
    duration: Optional[int] = Field(None, description="时长")
    unlock_level: Optional[int] = Field(None, description="解锁等级")
    unlock_coins: Optional[int] = Field(None, description="解锁金币")
    cover: Optional[str] = Field(None, description="封面")
    category: Optional[str] = Field(None, description="分类")


class GqTrackController:
    def __init__(self):
        from app.business.gq.track_business import GqTrackBusiness
        self.track_business = GqTrackBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.gq.user_business import GqUserBusiness
        user_business = GqUserBusiness()
        return user_business.verify_token(token)

    def ActionGqTrackListGet(self, request: Request, page: int = Query(1), page_size: int = Query(10),
                              difficulty: Optional[int] = Query(None), category: Optional[str] = Query(None),
                              keyword: Optional[str] = Query(None), authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.track_business.get_track_list(
            page=page,
            page_size=page_size,
            difficulty=difficulty,
            category=category,
            keyword=keyword
        )

    def ActionGqTrackDetailGet(self, request: Request, track_id: int = Query(..., description="曲目ID"),
                                authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.track_business.get_track_detail(track_id)

    def ActionGqTrackUserListGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.track_business.get_user_tracks(user.get('id'))

    def ActionGqTrackUnlockPost(self, request: Request, body: dict, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        track_id = body.get('track_id')
        return self.track_business.unlock_track(user.get('id'), track_id)

    def ActionGqTrackCreatePost(self, request: Request, body: CreateTrackRequest,
                                 authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.track_business.create_track(
            title=body.title,
            description=body.description or '',
            difficulty=body.difficulty or 1,
            notes=body.notes or '[]',
            bpm=body.bpm or 120,
            duration=body.duration or 0,
            unlock_level=body.unlock_level or 1,
            unlock_coins=body.unlock_coins or 0,
            cover=body.cover or '',
            category=body.category or 'classic'
        )

    def ActionGqTrackUpdatePost(self, request: Request, body: dict, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        track_id = body.get('track_id')
        data = {k: v for k, v in body.items() if k != 'track_id' and v is not None}
        return self.track_business.update_track(track_id, data)
