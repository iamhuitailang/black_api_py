from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateItemRequest(BaseModel):
    name: str = Field(..., description="道具名称")
    type: str = Field(..., description="道具类型")
    description: Optional[str] = Field('', description="道具描述")
    icon: Optional[str] = Field('', description="图标")
    color: Optional[str] = Field('#ff6b6b', description="颜色")
    radius: Optional[float] = Field(25, description="半径")
    score_value: Optional[int] = Field(100, description="分数值")
    combo_bonus: Optional[int] = Field(0, description="连击加成")
    special_effect: Optional[str] = Field('', description="特殊效果")
    status: Optional[int] = Field(0, description="状态")


class UpdateItemRequest(BaseModel):
    name: Optional[str] = Field(None, description="道具名称")
    type: Optional[str] = Field(None, description="道具类型")
    description: Optional[str] = Field(None, description="道具描述")
    icon: Optional[str] = Field(None, description="图标")
    color: Optional[str] = Field(None, description="颜色")
    radius: Optional[float] = Field(None, description="半径")
    score_value: Optional[int] = Field(None, description="分数值")
    combo_bonus: Optional[int] = Field(None, description="连击加成")
    special_effect: Optional[str] = Field(None, description="特殊效果")
    status: Optional[int] = Field(None, description="状态")


class DanzhuItemController:
    def __init__(self):
        from app.business.danzhu import DanzhuItemBusiness
        self.item_business = DanzhuItemBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_admin(self, token: str):
        from app.business.danzhu import DanzhuAuthBusiness
        auth_business = DanzhuAuthBusiness()
        return auth_business.verify_admin_token(token)

    def ActionDanzhuItemListGet(self, request: Request,
                                 page: int = Query(1, description="页码"),
                                 page_size: int = Query(10, description="每页数量"),
                                 type: Optional[str] = Query(None, description="类型"),
                                 status: Optional[int] = Query(None, description="状态"),
                                 keyword: Optional[str] = Query(None, description="关键词"),
                                 authorization: Optional[str] = Header(None)):
        """
        获取道具列表接口
        GET /api/danzhu/item/list/get
        管理员获取所有道具列表
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.item_business.get_item_list(page, page_size, type, status, keyword)

    def ActionDanzhuItemActiveGet(self, request: Request):
        """
        获取激活道具接口
        GET /api/danzhu/item/active/get
        获取所有激活的道具
        """
        return self.item_business.get_active_items()

    def ActionDanzhuItemTypeGet(self, request: Request, type: str = Query(..., description="类型")):
        """
        按类型获取道具接口
        GET /api/danzhu/item/type/get
        按类型获取道具列表
        """
        return self.item_business.get_items_by_type(type)

    def ActionDanzhuItemDetailGet(self, request: Request, item_id: int = Query(..., description="道具ID")):
        """
        获取道具详情接口
        GET /api/danzhu/item/detail/get
        获取指定道具的详细信息
        """
        return self.item_business.get_item_detail(item_id)

    def ActionDanzhuItemCreatePost(self, request: Request, body: CreateItemRequest,
                                    authorization: Optional[str] = Header(None)):
        """
        创建道具接口
        POST /api/danzhu/item/create
        管理员创建新道具
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.item_business.create_item(
            name=body.name,
            type=body.type,
            description=body.description,
            icon=body.icon,
            color=body.color,
            radius=body.radius,
            score_value=body.score_value,
            combo_bonus=body.combo_bonus,
            special_effect=body.special_effect,
            status=body.status
        )

    def ActionDanzhuItemUpdatePost(self, request: Request, body: UpdateItemRequest,
                                    item_id: int = Query(..., description="道具ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        更新道具接口
        POST /api/danzhu/item/update
        管理员更新道具信息
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.type is not None:
            data['type'] = body.type
        if body.description is not None:
            data['description'] = body.description
        if body.icon is not None:
            data['icon'] = body.icon
        if body.color is not None:
            data['color'] = body.color
        if body.radius is not None:
            data['radius'] = body.radius
        if body.score_value is not None:
            data['score_value'] = body.score_value
        if body.combo_bonus is not None:
            data['combo_bonus'] = body.combo_bonus
        if body.special_effect is not None:
            data['special_effect'] = body.special_effect
        if body.status is not None:
            data['status'] = body.status

        return self.item_business.update_item(item_id, data)

    def ActionDanzhuItemDeletePost(self, request: Request,
                                    item_id: int = Query(..., description="道具ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        删除道具接口
        POST /api/danzhu/item/delete
        管理员删除道具
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.item_business.delete_item(item_id)
