from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateAdRequest(BaseModel):
    title: Optional[str] = Field('', description="广告标题")
    description: Optional[str] = Field('', description="广告描述")
    image_url: str = Field(..., description="广告图片地址")
    link_url: Optional[str] = Field('', description="跳转链接")
    position: Optional[int] = Field(1, description="广告位置")
    sort_order: Optional[int] = Field(0, description="排序")
    start_time: Optional[str] = Field('', description="开始时间")
    end_time: Optional[str] = Field('', description="结束时间")


class UpdateAdRequest(BaseModel):
    title: Optional[str] = Field(None, description="广告标题")
    description: Optional[str] = Field(None, description="广告描述")
    image_url: Optional[str] = Field(None, description="广告图片地址")
    link_url: Optional[str] = Field(None, description="跳转链接")
    position: Optional[int] = Field(None, description="广告位置")
    sort_order: Optional[int] = Field(None, description="排序")
    start_time: Optional[str] = Field(None, description="开始时间")
    end_time: Optional[str] = Field(None, description="结束时间")
    status: Optional[int] = Field(None, description="状态")


class BqAdController:
    def __init__(self):
        from app.business.biaoqing_model.ad_business import BqAdBusiness
        self.ad_business = BqAdBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.biaoqing_model.user_business import BqUserBusiness
        user_business = BqUserBusiness()
        return user_business.verify_token(token)

    def ActionBqAdCreatePost(self, request: Request, body: CreateAdRequest,
                              authorization: Optional[str] = Header(None)):
        """
        创建广告接口（管理员）
        POST /api/bq/ad/create
        创建新的广告
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.ad_business.create(
            title=body.title or '',
            description=body.description or '',
            image_url=body.image_url,
            link_url=body.link_url or '',
            position=body.position or 1,
            sort_order=body.sort_order or 0,
            start_time=body.start_time or '',
            end_time=body.end_time or ''
        )

    def ActionBqAdUpdatePost(self, request: Request, body: UpdateAdRequest,
                              ad_id: int = Query(..., description="广告ID"),
                              authorization: Optional[str] = Header(None)):
        """
        更新广告接口（管理员）
        POST /api/bq/ad/update
        更新广告信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        data = {}
        if body.title is not None:
            data['title'] = body.title
        if body.description is not None:
            data['description'] = body.description
        if body.image_url is not None:
            data['image_url'] = body.image_url
        if body.link_url is not None:
            data['link_url'] = body.link_url
        if body.position is not None:
            data['position'] = body.position
        if body.sort_order is not None:
            data['sort_order'] = body.sort_order
        if body.start_time is not None:
            data['start_time'] = body.start_time
        if body.end_time is not None:
            data['end_time'] = body.end_time
        if body.status is not None:
            data['status'] = body.status

        return self.ad_business.update(
            ad_id=ad_id,
            data=data
        )

    def ActionBqAdDeletePost(self, request: Request, ad_id: int = Query(..., description="广告ID"),
                              authorization: Optional[str] = Header(None)):
        """
        删除广告接口（管理员）
        POST /api/bq/ad/delete
        删除指定广告
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.ad_business.delete(ad_id)

    def ActionBqAdDetailGet(self, request: Request, ad_id: int = Query(..., description="广告ID")):
        """
        获取广告详情接口
        GET /api/bq/ad/detail/get
        根据ID获取广告详情
        """
        return self.ad_business.get_by_id(ad_id, increment_view=True)

    def ActionBqAdPositionGet(self, request: Request, position: int = Query(..., description="广告位置"),
                               limit: int = Query(10, description="数量")):
        """
        根据位置获取广告接口
        GET /api/bq/ad/position/get
        根据位置获取有效的广告列表
        """
        return self.ad_business.get_by_position(position, limit)

    def ActionBqAdListGet(self, request: Request, page: int = Query(1, description="页码"),
                           page_size: int = Query(20, description="每页数量"),
                           status: Optional[int] = Query(None, description="状态"),
                           position: Optional[int] = Query(None, description="广告位置"),
                           authorization: Optional[str] = Header(None)):
        """
        获取广告列表接口（管理员）
        GET /api/bq/ad/list/get
        分页获取广告列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.ad_business.get_list(
            page=page,
            page_size=page_size,
            status=status,
            position=position
        )

    def ActionBqAdClickRecordPost(self, request: Request, ad_id: int = Query(..., description="广告ID")):
        """
        记录广告点击接口
        POST /api/bq/ad/click/record
        记录广告点击次数
        """
        return self.ad_business.record_click(ad_id)
