from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateItemRequest(BaseModel):
    category_id: int = Field(..., description="分类ID")
    name: str = Field(..., description="物品名称")
    description: Optional[str] = Field('', description="物品描述")
    rules: Optional[str] = Field('', description="借用规则")
    total_quantity: int = Field(0, description="总数量")
    image: Optional[str] = Field('', description="图片URL")
    location: Optional[str] = Field('', description="存放位置")
    max_borrow_days: Optional[int] = Field(7, description="最长借用天数")


class UpdateItemRequest(BaseModel):
    item_id: int = Field(..., description="物品ID")
    category_id: Optional[int] = Field(None, description="分类ID")
    name: Optional[str] = Field(None, description="物品名称")
    description: Optional[str] = Field(None, description="物品描述")
    rules: Optional[str] = Field(None, description="借用规则")
    total_quantity: Optional[int] = Field(None, description="总数量")
    image: Optional[str] = Field(None, description="图片URL")
    location: Optional[str] = Field(None, description="存放位置")
    max_borrow_days: Optional[int] = Field(None, description="最长借用天数")
    status: Optional[int] = Field(None, description="状态")


class JieyongItemController:
    def __init__(self):
        from app.business.jieyong_model.item_business import JieyongItemBusiness
        from app.business.jieyong_model.auth_business import JieyongAuthBusiness
        self.item_business = JieyongItemBusiness()
        self.auth_business = JieyongAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token if token else ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.auth_business.verify_token(token)

    def _require_admin(self, token: str) -> Optional[dict]:
        user = self._get_current_user(token)
        if not user:
            return None
        if not self.auth_business.is_admin(user.get('id')):
            return None
        return user

    def ActionJieyongItemCreatePost(self, request: Request, body: CreateItemRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        创建物品接口（管理员）
        POST /api/jieyong_model/item/create
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._require_admin(token)
        if not admin:
            return {'code': 1, 'msg': '无权限访问', 'data': None}

        return self.item_business.create(
            category_id=body.category_id,
            name=body.name,
            description=body.description or '',
            rules=body.rules or '',
            total_quantity=body.total_quantity,
            image=body.image or '',
            location=body.location or '',
            max_borrow_days=body.max_borrow_days or 7
        )

    def ActionJieyongItemUpdatePost(self, request: Request, body: UpdateItemRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        更新物品接口（管理员）
        POST /api/jieyong_model/item/update
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._require_admin(token)
        if not admin:
            return {'code': 1, 'msg': '无权限访问', 'data': None}

        data = {}
        if body.category_id is not None:
            data['category_id'] = body.category_id
        if body.name is not None:
            data['name'] = body.name
        if body.description is not None:
            data['description'] = body.description
        if body.rules is not None:
            data['rules'] = body.rules
        if body.total_quantity is not None:
            data['total_quantity'] = body.total_quantity
        if body.image is not None:
            data['image'] = body.image
        if body.location is not None:
            data['location'] = body.location
        if body.max_borrow_days is not None:
            data['max_borrow_days'] = body.max_borrow_days
        if body.status is not None:
            data['status'] = body.status

        return self.item_business.update(body.item_id, data)

    def ActionJieyongItemDeletePost(self, request: Request, item_id: int = Query(..., description="物品ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        删除物品接口（管理员）
        POST /api/jieyong_model/item/delete
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._require_admin(token)
        if not admin:
            return {'code': 1, 'msg': '无权限访问', 'data': None}

        return self.item_business.delete(item_id)

    def ActionJieyongItemDetailGet(self, request: Request, item_id: int = Query(..., description="物品ID")):
        """
        获取物品详情接口
        GET /api/jieyong_model/item/detail/get
        """
        return self.item_business.get_by_id(item_id)

    def ActionJieyongItemListGet(self, request: Request,
                                  page: int = Query(1, description="页码"),
                                  page_size: int = Query(10, description="每页数量"),
                                  category_id: Optional[int] = Query(None, description="分类ID"),
                                  status: Optional[int] = Query(None, description="状态"),
                                  keyword: Optional[str] = Query(None, description="关键词"),
                                  only_available: Optional[bool] = Query(False, description="只显示可借"),
                                  authorization: Optional[str] = Header(None)):
        """
        获取物品列表接口
        GET /api/jieyong_model/item/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or not self.auth_business.is_admin(user.get('id')):
            status = 0
            only_available = True

        return self.item_business.get_list(page, page_size, category_id, status, keyword, only_available)

    def ActionJieyongItemHotGet(self, request: Request, limit: int = Query(10, description="数量")):
        """
        获取热门物品接口
        GET /api/jieyong_model/item/hot/get
        """
        return self.item_business.get_hot_items(limit)

    def ActionJieyongItemAvailabilityGet(self, request: Request,
                                          item_id: int = Query(..., description="物品ID"),
                                          quantity: int = Query(1, description="借用数量")):
        """
        检查物品可用性接口
        GET /api/jieyong_model/item/availability/get
        """
        return self.item_business.check_availability(item_id, quantity)
