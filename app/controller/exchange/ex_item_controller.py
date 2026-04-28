from typing import Optional, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class PublishItemRequest(BaseModel):
    title: str = Field(..., description="物品标题")
    category: str = Field(..., description="物品分类")
    condition: int = Field(..., description="新旧程度(1-4)")
    description: str = Field(default='', description="物品描述")
    images: List[str] = Field(default_factory=list, description="图片URL数组")
    expect_categories: List[str] = Field(default_factory=list, description="期望交换品类")
    city: str = Field(default='', description="所在城市")


class UpdateItemRequest(BaseModel):
    title: Optional[str] = Field(None, description="物品标题")
    category: Optional[str] = Field(None, description="物品分类")
    condition: Optional[int] = Field(None, description="新旧程度(1-4)")
    description: Optional[str] = Field(None, description="物品描述")
    images: Optional[List[str]] = Field(None, description="图片URL数组")
    expect_categories: Optional[List[str]] = Field(None, description="期望交换品类")
    city: Optional[str] = Field(None, description="所在城市")


class ExItemController:
    def __init__(self):
        from app.business.exchange import ExItemBusiness
        self.item_business = ExItemBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        
        token = request.query_params.get('token')
        if token:
            return token
        
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.exchange import ExUserBusiness
        user_business = ExUserBusiness()
        return user_business.verify_token(token)

    def ActionExItemPublishPost(self, request: Request, body: PublishItemRequest,
                                 authorization: Optional[str] = Header(None)):
        """
        发布物品接口
        POST /api/ex/item/publish
        用户发布闲置物品
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.item_business.publish(
            user_id=user.get('id'),
            title=body.title,
            category=body.category,
            condition=body.condition,
            description=body.description,
            images=body.images,
            expect_categories=body.expect_categories,
            city=body.city
        )

    def ActionExItemDetailGet(self, request: Request, item_id: int = Query(..., description="物品ID"),
                               authorization: Optional[str] = Header(None)):
        """
        获取物品详情接口
        GET /api/ex/item/detail/get
        获取物品详细信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        viewer_id = user.get('id') if user else None
        
        return self.item_business.get_detail(item_id, viewer_id)

    def ActionExItemSearchGet(self, request: Request,
                                keyword: str = Query(None, description="搜索关键词"),
                                category: str = Query(None, description="分类"),
                                city: str = Query(None, description="城市"),
                                condition: int = Query(None, description="新旧程度"),
                                page: int = Query(1, ge=1, description="页码"),
                                page_size: int = Query(20, ge=1, le=100, description="每页数量")):
        """
        搜索物品接口
        GET /api/ex/item/search/get
        搜索并筛选物品列表
        """
        return self.item_business.search(
            keyword=keyword,
            category=category,
            city=city,
            condition=condition,
            page=page,
            page_size=page_size
        )

    def ActionExItemMyListGet(self, request: Request,
                                status: int = Query(None, description="物品状态"),
                                page: int = Query(1, ge=1, description="页码"),
                                page_size: int = Query(20, ge=1, le=100, description="每页数量"),
                                authorization: Optional[str] = Header(None)):
        """
        获取我的物品列表接口
        GET /api/ex/item/my/list/get
        获取当前用户发布的物品列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.item_business.get_user_items(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionExItemUpdatePost(self, request: Request, body: UpdateItemRequest,
                                item_id: int = Query(..., description="物品ID"),
                                authorization: Optional[str] = Header(None)):
        """
        编辑物品接口
        POST /api/ex/item/update
        编辑已发布的物品信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        data = {}
        if body.title is not None:
            data['title'] = body.title
        if body.category is not None:
            data['category'] = body.category
        if body.condition is not None:
            data['condition'] = body.condition
        if body.description is not None:
            data['description'] = body.description
        if body.images is not None:
            data['images'] = body.images
        if body.expect_categories is not None:
            data['expect_categories'] = body.expect_categories
        if body.city is not None:
            data['city'] = body.city
        
        return self.item_business.update(
            user_id=user.get('id'),
            item_id=item_id,
            data=data
        )

    def ActionExItemOnShelfPost(self, request: Request,
                                  item_id: int = Query(..., description="物品ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        上架物品接口
        POST /api/ex/item/on/shelf
        上架已下架的物品
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        from app.model.exchange import ExItemModel
        return self.item_business.update_status(
            user_id=user.get('id'),
            item_id=item_id,
            status=ExItemModel.STATUS_ON_SHELF
        )

    def ActionExItemOffShelfPost(self, request: Request,
                                   item_id: int = Query(..., description="物品ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        下架物品接口
        POST /api/ex/item/off/shelf
        下架已发布的物品
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        from app.model.exchange import ExItemModel
        return self.item_business.update_status(
            user_id=user.get('id'),
            item_id=item_id,
            status=ExItemModel.STATUS_OFF_SHELF
        )

    def ActionExItemCategoriesGet(self, request: Request):
        """
        获取分类列表接口
        GET /api/ex/item/categories/get
        获取所有物品分类和新旧程度选项
        """
        return self.item_business.get_categories()

    def ActionExItemUserListGet(self, request: Request,
                                  user_id: int = Query(..., description="用户ID"),
                                  status: int = Query(None, description="物品状态"),
                                  page: int = Query(1, ge=1, description="页码"),
                                  page_size: int = Query(20, ge=1, le=100, description="每页数量")):
        """
        获取用户物品列表接口
        GET /api/ex/item/user/list/get
        获取指定用户发布的物品列表
        """
        return self.item_business.get_user_items(
            user_id=user_id,
            page=page,
            page_size=page_size,
            status=status
        )
