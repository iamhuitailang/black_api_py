from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class AddTrackRequest(BaseModel):
    name: str = Field(..., description="赛道名称")
    description: Optional[str] = Field(None, description="赛道描述")
    difficulty: Optional[int] = Field(1, description="难度等级 1-5")
    track_data: dict = Field(..., description="赛道数据(JSON)")
    image: Optional[str] = Field(None, description="赛道图片")
    reward_coins: Optional[int] = Field(100, description="奖励金币")
    reward_exp: Optional[int] = Field(50, description="奖励经验")
    laps: Optional[int] = Field(3, description="圈数")


class UpdateTrackRequest(BaseModel):
    name: Optional[str] = Field(None, description="赛道名称")
    description: Optional[str] = Field(None, description="赛道描述")
    difficulty: Optional[int] = Field(None, description="难度等级 1-5")
    track_data: Optional[dict] = Field(None, description="赛道数据(JSON)")
    image: Optional[str] = Field(None, description="赛道图片")
    reward_coins: Optional[int] = Field(None, description="奖励金币")
    reward_exp: Optional[int] = Field(None, description="奖励经验")
    laps: Optional[int] = Field(None, description="圈数")
    is_active: Optional[int] = Field(None, description="是否启用")


class SaicheTrackController:
    def __init__(self):
        from app.business.saiche.track_business import SaicheTrackBusiness
        from app.business.saiche.user_business import SaicheUserBusiness
        self.track_business = SaicheTrackBusiness()
        self.user_business = SaicheUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def _get_current_admin(self, token: str) -> Optional[dict]:
        from app.business.saiche.admin_business import SaicheAdminBusiness
        admin_business = SaicheAdminBusiness()
        return admin_business.verify_token(token)

    def ActionSaicheTrackListGet(self, request: Request,
                                  page: int = Query(1, ge=1, description="页码"),
                                  page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                  difficulty: Optional[int] = Query(None, description="难度等级")):
        """
        获取赛道列表接口
        GET /api/saiche/track/list/get
        获取所有赛道列表
        """
        return self.track_business.get_track_list(
            page=page,
            page_size=page_size,
            difficulty=difficulty,
            is_active=1
        )

    def ActionSaicheTrackDetailGet(self, request: Request, track_id: int = Query(..., description="赛道ID")):
        """
        获取赛道详情接口
        GET /api/saiche/track/detail/get
        根据赛道ID获取赛道详情
        """
        return self.track_business.get_track_detail(track_id=track_id)

    def ActionSaicheTrackBestRecordsGet(self, request: Request,
                                         track_id: int = Query(..., description="赛道ID"),
                                         limit: int = Query(10, ge=1, le=100, description="数量")):
        """
        获取赛道最佳记录接口
        GET /api/saiche/track/best/records/get
        获取赛道的最佳记录排行
        """
        return self.track_business.get_best_records(track_id=track_id, limit=limit)

    def ActionSaicheTrackAddPost(self, request: Request, body: AddTrackRequest,
                                   authorization: Optional[str] = Header(None)):
        """
        添加赛道接口（管理员）
        POST /api/saiche/track/add
        管理员添加新赛道
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = body.dict(exclude_unset=True)
        return self.track_business.add_track(data=data)

    def ActionSaicheTrackUpdatePost(self, request: Request, body: UpdateTrackRequest,
                                    track_id: int = Query(..., description="赛道ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        更新赛道接口（管理员）
        POST /api/saiche/track/update
        管理员更新赛道信息
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = body.dict(exclude_unset=True)
        return self.track_business.update_track(track_id=track_id, data=data)

    def ActionSaicheTrackDeletePost(self, request: Request,
                                    track_id: int = Query(..., description="赛道ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        删除赛道接口（管理员）
        POST /api/saiche/track/delete
        管理员删除赛道
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.track_business.delete_track(track_id=track_id)
