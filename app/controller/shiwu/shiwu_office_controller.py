from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateOfficeRequest(BaseModel):
    type: str = Field(..., description="类型: official/announcement/summary")
    title: str = Field(..., description="标题")
    content: Optional[str] = Field(None, description="内容")
    location: Optional[str] = Field(None, description="地点")
    location_latitude: Optional[float] = Field(None, description="地点纬度")
    location_longitude: Optional[float] = Field(None, description="地点经度")
    open_hours: Optional[str] = Field(None, description="开放时间")
    contact: Optional[str] = Field(None, description="联系方式")
    images: Optional[str] = Field(None, description="图片URL列表，逗号分隔")
    sort_order: Optional[int] = Field(0, description="排序")


class UpdateOfficeRequest(BaseModel):
    type: Optional[str] = Field(None, description="类型: official/announcement/summary")
    title: Optional[str] = Field(None, description="标题")
    content: Optional[str] = Field(None, description="内容")
    location: Optional[str] = Field(None, description="地点")
    location_latitude: Optional[float] = Field(None, description="地点纬度")
    location_longitude: Optional[float] = Field(None, description="地点经度")
    open_hours: Optional[str] = Field(None, description="开放时间")
    contact: Optional[str] = Field(None, description="联系方式")
    images: Optional[str] = Field(None, description="图片URL列表，逗号分隔")
    sort_order: Optional[int] = Field(None, description="排序")
    status: Optional[int] = Field(None, description="状态")


class ShiwuOfficeController:
    def __init__(self):
        from app.business.shiwu.office_business import OfficeBusiness
        from app.business.shiwu.admin_business import AdminBusiness
        self.office_business = OfficeBusiness()
        self.admin_business = AdminBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_business.verify_token(token)

    def ActionShiwuOfficeListGet(self, request: Request):
        """
        获取官方招领处信息列表接口
        GET /api/shiwu/office/list/get
        获取所有已发布的官方信息（按类型分组）
        """
        return self.office_business.get_office_list()

    def ActionShiwuOfficeAllGet(self, request: Request,
                                 page: int = Query(1, ge=1, description="页码"),
                                 page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                 status: Optional[int] = Query(None, description="状态"),
                                 type: Optional[str] = Query(None, description="类型"),
                                 authorization: Optional[str] = Header(None)):
        """
        管理员获取全部官方信息接口
        GET /api/shiwu/office/all/get
        分页获取所有官方信息（含未发布）
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.office_business.get_all_offices(
            page=page,
            page_size=page_size,
            status=status,
            office_type=type
        )

    def ActionShiwuOfficeDetailGet(self, request: Request,
                                    office_id: int = Query(..., description="信息ID")):
        """
        获取官方信息详情接口
        GET /api/shiwu/office/detail/get
        根据ID获取官方信息详情
        """
        return self.office_business.get_office_by_id(office_id)

    def ActionShiwuOfficeCreatePost(self, request: Request, body: CreateOfficeRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        创建官方信息接口
        POST /api/shiwu/office/create
        管理员创建官方招领处信息
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.office_business.create_office(
            admin_id=admin.get('id'),
            office_type=body.type,
            title=body.title,
            content=body.content or '',
            location=body.location or '',
            location_latitude=body.location_latitude,
            location_longitude=body.location_longitude,
            open_hours=body.open_hours or '',
            contact=body.contact or '',
            images=body.images or '',
            sort_order=body.sort_order or 0
        )

    def ActionShiwuOfficeUpdatePost(self, request: Request,
                                     office_id: int = Query(..., description="信息ID"),
                                     body: UpdateOfficeRequest = None,
                                     authorization: Optional[str] = Header(None)):
        """
        更新官方信息接口
        POST /api/shiwu/office/update
        管理员更新官方信息
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {}
        if body.type is not None:
            data['type'] = body.type
        if body.title is not None:
            data['title'] = body.title
        if body.content is not None:
            data['content'] = body.content
        if body.location is not None:
            data['location'] = body.location
        if body.location_latitude is not None:
            data['location_latitude'] = body.location_latitude
        if body.location_longitude is not None:
            data['location_longitude'] = body.location_longitude
        if body.open_hours is not None:
            data['open_hours'] = body.open_hours
        if body.contact is not None:
            data['contact'] = body.contact
        if body.images is not None:
            data['images'] = body.images
        if body.sort_order is not None:
            data['sort_order'] = body.sort_order
        if body.status is not None:
            data['status'] = body.status

        return self.office_business.update_office(
            admin_id=admin.get('id'),
            office_id=office_id,
            data=data
        )

    def ActionShiwuOfficePublishPost(self, request: Request,
                                      office_id: int = Query(..., description="信息ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        发布官方信息接口
        POST /api/shiwu/office/publish
        管理员发布官方信息
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.office_business.publish_office(
            admin_id=admin.get('id'),
            office_id=office_id
        )

    def ActionShiwuOfficeClosePost(self, request: Request,
                                    office_id: int = Query(..., description="信息ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        关闭官方信息接口
        POST /api/shiwu/office/close
        管理员关闭官方信息
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.office_business.close_office(
            admin_id=admin.get('id'),
            office_id=office_id
        )

    def ActionShiwuOfficeDeletePost(self, request: Request,
                                     office_id: int = Query(..., description="信息ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        删除官方信息接口
        POST /api/shiwu/office/delete
        管理员删除官方信息
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.office_business.delete_office(
            admin_id=admin.get('id'),
            office_id=office_id
        )
