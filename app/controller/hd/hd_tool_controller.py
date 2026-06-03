from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class ToolBuyRequest(BaseModel):
    tool_id: int = Field(..., description="忍具ID")
    quantity: int = Field(1, description="购买数量")


class ToolUseRequest(BaseModel):
    tool_id: int = Field(..., description="忍具ID")


class ToolCreateRequest(BaseModel):
    name: str = Field(..., description="忍具名称")
    description: Optional[str] = Field(None, description="忍具描述")
    type: int = Field(..., description="忍具类型")
    effect: Optional[str] = Field(None, description="效果描述")
    damage: Optional[int] = Field(0, description="伤害值")
    heal: Optional[int] = Field(0, description="治疗值")
    duration: Optional[int] = Field(0, description="持续时间")
    price: Optional[int] = Field(0, description="价格")
    icon: Optional[str] = Field(None, description="图标URL")


class ToolUpdateRequest(BaseModel):
    tool_id: int = Field(..., description="忍具ID")
    name: Optional[str] = Field(None, description="忍具名称")
    description: Optional[str] = Field(None, description="忍具描述")
    type: Optional[int] = Field(None, description="忍具类型")
    effect: Optional[str] = Field(None, description="效果描述")
    damage: Optional[int] = Field(None, description="伤害值")
    heal: Optional[int] = Field(None, description="治疗值")
    duration: Optional[int] = Field(None, description="持续时间")
    price: Optional[int] = Field(None, description="价格")
    icon: Optional[str] = Field(None, description="图标URL")


class ToolDeleteRequest(BaseModel):
    tool_id: int = Field(..., description="忍具ID")


class HdToolController:
    def __init__(self):
        from app.business.hd.tool_business import HdToolBusiness
        from app.business.hd.user_business import HdUserBusiness
        self.tool_business = HdToolBusiness()
        self.user_business = HdUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.get_current_user(token).get('data')

    def ActionHdToolListGet(self, request: Request, type: Optional[int] = Query(None, description="忍具类型"),
                             page: int = Query(1, description="页码"),
                             page_size: int = Query(10, description="每页数量")):
        """
        获取所有忍具列表接口
        GET /hd/tool/list/get
        获取所有忍具列表，支持按类型筛选和分页
        """
        return self.tool_business.get_all_tools(
            type=type,
            page=page,
            page_size=page_size
        )

    def ActionHdToolUserGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取用户所有忍具接口
        GET /hd/tool/user/get
        获取当前用户的所有忍具，需要token
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.tool_business.get_user_tools(
            user_id=user.get('id')
        )

    def ActionHdToolBuyPost(self, request: Request, body: ToolBuyRequest,
                             authorization: Optional[str] = Header(None)):
        """
        购买忍具接口
        POST /hd/tool/buy
        购买忍具，消耗金币，需要token
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.tool_business.buy_tool(
            user_id=user.get('id'),
            tool_id=body.tool_id,
            quantity=body.quantity
        )

    def ActionHdToolUsePost(self, request: Request, body: ToolUseRequest,
                             authorization: Optional[str] = Header(None)):
        """
        使用忍具接口
        POST /hd/tool/use
        使用忍具，需要token
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.tool_business.use_tool(
            user_id=user.get('id'),
            tool_id=body.tool_id
        )

    def ActionHdToolDetailGet(self, request: Request, tool_id: int = Query(..., description="忍具ID")):
        """
        获取忍具详情接口
        GET /hd/tool/detail/get
        根据忍具ID获取忍具详情
        """
        return self.tool_business.get_tool_detail(
            tool_id=tool_id
        )

    def ActionHdToolCreatePost(self, request: Request, body: ToolCreateRequest):
        """
        管理员创建忍具接口
        POST /hd/tool/create
        管理员创建新忍具
        """
        data = {
            'name': body.name,
            'description': body.description or '',
            'type': body.type,
            'effect': body.effect or '',
            'damage': body.damage,
            'heal': body.heal,
            'duration': body.duration,
            'price': body.price,
            'icon': body.icon or ''
        }
        return self.tool_business.create_tool(data)

    def ActionHdToolUpdatePost(self, request: Request, body: ToolUpdateRequest):
        """
        管理员更新忍具接口
        POST /hd/tool/update
        管理员更新忍具信息
        """
        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.description is not None:
            data['description'] = body.description
        if body.type is not None:
            data['type'] = body.type
        if body.effect is not None:
            data['effect'] = body.effect
        if body.damage is not None:
            data['damage'] = body.damage
        if body.heal is not None:
            data['heal'] = body.heal
        if body.duration is not None:
            data['duration'] = body.duration
        if body.price is not None:
            data['price'] = body.price
        if body.icon is not None:
            data['icon'] = body.icon

        return self.tool_business.update_tool(
            tool_id=body.tool_id,
            data=data
        )

    def ActionHdToolDeletePost(self, request: Request, body: ToolDeleteRequest):
        """
        管理员删除忍具接口
        POST /hd/tool/delete
        管理员删除忍具
        """
        return self.tool_business.delete_tool(
            tool_id=body.tool_id
        )
