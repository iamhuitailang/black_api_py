from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateServiceRequest(BaseModel):
    name: str = Field(..., description="服务名称")
    category: Optional[str] = Field('', description="服务分类")
    description: Optional[str] = Field('', description="服务描述")
    price: Optional[float] = Field(0, description="服务价格")
    unit: Optional[str] = Field('次', description="计价单位")
    duration: Optional[int] = Field(60, description="服务时长(分钟)")
    image: Optional[str] = Field('', description="服务图片")
    status: Optional[int] = Field(1, description="状态 1上架 0下架")
    sort_order: Optional[int] = Field(0, description="排序")


class UpdateServiceRequest(BaseModel):
    name: Optional[str] = Field(None, description="服务名称")
    category: Optional[str] = Field(None, description="服务分类")
    description: Optional[str] = Field(None, description="服务描述")
    price: Optional[float] = Field(None, description="服务价格")
    unit: Optional[str] = Field(None, description="计价单位")
    duration: Optional[int] = Field(None, description="服务时长(分钟)")
    image: Optional[str] = Field(None, description="服务图片")
    status: Optional[int] = Field(None, description="状态 1上架 0下架")
    sort_order: Optional[int] = Field(None, description="排序")


class FuwuServiceController:
    def __init__(self):
        from app.business.fuwu_077_model.service_business import ServiceBusiness
        from app.business.fuwu_077_model.admin_auth_business import AdminAuthBusiness
        self.service_business = ServiceBusiness()
        self.admin_auth_business = AdminAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_auth_business.verify_token(token)

    def ActionFuwu077ModelServiceListGet(self, request: Request, 
                                  page: int = Query(1, description="页码"),
                                  page_size: int = Query(10, description="每页数量"),
                                  category: Optional[str] = Query(None, description="服务分类"),
                                  keyword: Optional[str] = Query(None, description="关键词")):
        """
        获取服务列表接口
        GET /api/fuwu_077_model/service/list/get
        分页获取服务列表，支持分类和关键词筛选
        """
        return self.service_business.get_service_list(
            page=page,
            page_size=page_size,
            category=category,
            status=1,
            keyword=keyword
        )

    def ActionFuwu077ModelServiceAllGet(self, request: Request,
                                 page: int = Query(1, description="页码"),
                                 page_size: int = Query(10, description="每页数量"),
                                 category: Optional[str] = Query(None, description="服务分类"),
                                 status: Optional[int] = Query(None, description="状态"),
                                 keyword: Optional[str] = Query(None, description="关键词"),
                                 authorization: Optional[str] = Header(None)):
        """
        管理员获取所有服务列表接口
        GET /api/fuwu_077_model/service/all/get
        管理员分页获取所有服务列表
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.service_business.get_service_list(
            page=page,
            page_size=page_size,
            category=category,
            status=status,
            keyword=keyword
        )

    def ActionFuwu077ModelServiceDetailGet(self, request: Request,
                                    service_id: int = Query(..., description="服务ID")):
        """
        获取服务详情接口
        GET /api/fuwu_077_model/service/detail/get
        根据服务ID获取服务详情
        """
        return self.service_business.get_service_detail(service_id)

    def ActionFuwu077ModelServiceCategoriesGet(self, request: Request):
        """
        获取服务分类列表接口
        GET /api/fuwu_077_model/service/categories/get
        获取所有服务分类
        """
        return self.service_business.get_categories()

    def ActionFuwu077ModelServiceCreatePost(self, request: Request, body: CreateServiceRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        创建服务接口
        POST /api/fuwu_077_model/service/create
        管理员创建新服务项目
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.service_business.create_service(
            name=body.name,
            category=body.category or '',
            description=body.description or '',
            price=body.price or 0,
            unit=body.unit or '次',
            duration=body.duration or 60,
            image=body.image or '',
            status=body.status if body.status is not None else 1,
            sort_order=body.sort_order or 0
        )

    def ActionFuwu077ModelServiceUpdatePost(self, request: Request, body: UpdateServiceRequest,
                                     service_id: int = Query(..., description="服务ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        更新服务接口
        POST /api/fuwu_077_model/service/update
        管理员更新服务信息
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.category is not None:
            data['category'] = body.category
        if body.description is not None:
            data['description'] = body.description
        if body.price is not None:
            data['price'] = body.price
        if body.unit is not None:
            data['unit'] = body.unit
        if body.duration is not None:
            data['duration'] = body.duration
        if body.image is not None:
            data['image'] = body.image
        if body.status is not None:
            data['status'] = body.status
        if body.sort_order is not None:
            data['sort_order'] = body.sort_order

        return self.service_business.update_service(service_id, data)

    def ActionFuwu077ModelServiceStatusTogglePost(self, request: Request,
                                           service_id: int = Query(..., description="服务ID"),
                                           authorization: Optional[str] = Header(None)):
        """
        切换服务状态接口
        POST /api/fuwu_077_model/service/status/toggle
        管理员切换服务上架/下架状态
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.service_business.toggle_status(service_id)

    def ActionFuwu077ModelServiceDeletePost(self, request: Request,
                                     service_id: int = Query(..., description="服务ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        删除服务接口
        POST /api/fuwu_077_model/service/delete
        管理员删除服务项目
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.service_business.delete_service(service_id)
