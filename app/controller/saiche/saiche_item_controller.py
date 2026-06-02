from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class AddItemRequest(BaseModel):
    name: str = Field(..., description="道具名称")
    type: str = Field(..., description="道具类型: speed/attack/shield")
    description: Optional[str] = Field(None, description="道具描述")
    effect: Optional[dict] = Field(None, description="道具效果(JSON)")
    duration: Optional[float] = Field(0, description="持续时间(秒)")
    icon: Optional[str] = Field(None, description="道具图标")
    rarity: Optional[int] = Field(1, description="稀有度")


class UpdateItemRequest(BaseModel):
    name: Optional[str] = Field(None, description="道具名称")
    type: Optional[str] = Field(None, description="道具类型: speed/attack/shield")
    description: Optional[str] = Field(None, description="道具描述")
    effect: Optional[dict] = Field(None, description="道具效果(JSON)")
    duration: Optional[float] = Field(None, description="持续时间(秒)")
    icon: Optional[str] = Field(None, description="道具图标")
    rarity: Optional[int] = Field(None, description="稀有度")
    is_active: Optional[int] = Field(None, description="是否启用")


class SaicheItemController:
    def __init__(self):
        from app.business.saiche.item_business import SaicheItemBusiness
        from app.business.saiche.user_business import SaicheUserBusiness
        self.item_business = SaicheItemBusiness()
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

    def ActionSaicheItemListGet(self, request: Request,
                                 page: int = Query(1, ge=1, description="页码"),
                                 page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                 item_type: Optional[str] = Query(None, description="道具类型")):
        """
        获取道具列表接口
        GET /api/saiche/item/list/get
        获取所有道具列表
        """
        return self.item_business.get_item_list(
            page=page,
            page_size=page_size,
            item_type=item_type
        )

    def ActionSaicheItemDetailGet(self, request: Request, item_id: int = Query(..., description="道具ID")):
        """
        获取道具详情接口
        GET /api/saiche/item/detail/get
        根据道具ID获取道具详情
        """
        return self.item_business.get_item_detail(item_id=item_id)

    def ActionSaicheItemRandomGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        随机获取道具接口
        GET /api/saiche/item/random/get
        随机获取一个道具
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.item_business.get_random_item()

    def ActionSaicheItemByTypeGet(self, request: Request,
                                   item_type: str = Query(..., description="道具类型")):
        """
        按类型获取道具接口
        GET /api/saiche/item/by/type/get
        根据类型获取道具列表
        """
        return self.item_business.get_items_by_type(item_type=item_type)

    def ActionSaicheItemAddPost(self, request: Request, body: AddItemRequest,
                                 authorization: Optional[str] = Header(None)):
        """
        添加道具接口（管理员）
        POST /api/saiche/item/add
        管理员添加新道具
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
        return self.item_business.add_item(data=data)

    def ActionSaicheItemUpdatePost(self, request: Request, body: UpdateItemRequest,
                                    item_id: int = Query(..., description="道具ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        更新道具接口（管理员）
        POST /api/saiche/item/update
        管理员更新道具信息
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
        return self.item_business.update_item(item_id=item_id, data=data)

    def ActionSaicheItemDeletePost(self, request: Request,
                                    item_id: int = Query(..., description="道具ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        删除道具接口（管理员）
        POST /api/saiche/item/delete
        管理员删除道具
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.item_business.delete_item(item_id=item_id)
