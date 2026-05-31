from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateServiceRequest(BaseModel):
    title: str = Field(..., description="服务名称")
    type: str = Field(..., description="服务类型")
    description: Optional[str] = Field('', description="服务描述")
    price: float = Field(..., description="价格")
    price_unit: Optional[str] = Field('天', description="价格单位")
    cover_image: Optional[str] = Field('', description="封面图片")
    capacity: Optional[int] = Field(10, description="容量")
    address: Optional[str] = Field('', description="地址")


class UpdateServiceRequest(BaseModel):
    service_id: int = Field(..., description="服务ID")
    title: Optional[str] = Field(None, description="服务名称")
    type: Optional[str] = Field(None, description="服务类型")
    description: Optional[str] = Field(None, description="服务描述")
    price: Optional[float] = Field(None, description="价格")
    price_unit: Optional[str] = Field(None, description="价格单位")
    cover_image: Optional[str] = Field(None, description="封面图片")
    capacity: Optional[int] = Field(None, description="容量")
    address: Optional[str] = Field(None, description="地址")
    status: Optional[int] = Field(None, description="状态")


class DeleteServiceRequest(BaseModel):
    service_id: int = Field(..., description="服务ID")


class Chongwu09ServiceController:
    def __init__(self):
        from app.business.chongwu09.service_business import ServiceBusiness
        self.service_business = ServiceBusiness()
        from app.business.chongwu09.admin_business import AdminBusiness
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

    def ActionChongwu09ServiceListGet(self, request: Request,
                                       page: int = Query(1, ge=1),
                                       page_size: int = Query(10, ge=1, le=100),
                                       type: Optional[str] = Query(None, description="服务类型"),
                                       keyword: Optional[str] = Query(None, description="搜索关键词")):
        """
        获取服务列表（用户端）
        GET /api/chongwu09/service/list/get
        """
        return self.service_business.get_service_list(
            page=page, page_size=page_size, service_type=type, keyword=keyword
        )

    def ActionChongwu09ServiceDetailGet(self, request: Request,
                                         service_id: int = Query(..., description="服务ID")):
        """
        获取服务详情
        GET /api/chongwu09/service/detail/get
        """
        return self.service_business.get_service(service_id)

    def ActionChongwu09ServiceTypesGet(self, request: Request):
        """
        获取服务类型列表
        GET /api/chongwu09/service/types/get
        """
        return self.service_business.get_service_types()

    def ActionChongwu09ServiceCreatePost(self, request: Request, body: CreateServiceRequest,
                                          authorization: Optional[str] = Header(None)):
        """
        创建服务（管理员）
        POST /api/chongwu09/service/create
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.service_business.create_service(
            title=body.title, service_type=body.type, description=body.description or '',
            price=body.price, price_unit=body.price_unit or '天',
            cover_image=body.cover_image or '', capacity=body.capacity or 10,
            address=body.address or ''
        )

    def ActionChongwu09ServiceUpdatePost(self, request: Request, body: UpdateServiceRequest,
                                          authorization: Optional[str] = Header(None)):
        """
        更新服务（管理员）
        POST /api/chongwu09/service/update
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        service_id = body.service_id
        data = {k: v for k, v in body.dict().items() if v is not None and k != 'service_id'}
        return self.service_business.update_service(service_id, data)

    def ActionChongwu09ServiceDeletePost(self, request: Request, body: DeleteServiceRequest,
                                          authorization: Optional[str] = Header(None)):
        """
        删除服务（管理员）
        POST /api/chongwu09/service/delete
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.service_business.delete_service(body.service_id)

    def ActionChongwu09ServiceAdminListGet(self, request: Request,
                                            page: int = Query(1, ge=1),
                                            page_size: int = Query(10, ge=1, le=100),
                                            type: Optional[str] = Query(None),
                                            status: Optional[int] = Query(None),
                                            keyword: Optional[str] = Query(None),
                                            authorization: Optional[str] = Header(None)):
        """
        管理员获取服务列表
        GET /api/chongwu09/service/admin/list/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.service_business.get_all_service_list(
            page=page, page_size=page_size, service_type=type, status=status, keyword=keyword
        )
