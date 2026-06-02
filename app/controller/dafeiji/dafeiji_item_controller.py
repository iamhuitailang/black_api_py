from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateItemRequest(BaseModel):
    name: Optional[str] = Field(None, description="道具名称")
    type: Optional[str] = Field(None, description="道具类型")
    effect: Optional[str] = Field(None, description="效果")
    value: Optional[int] = Field(None, description="数值")
    duration: Optional[int] = Field(None, description="持续时间")
    description: Optional[str] = Field(None, description="描述")


class UpdateItemRequest(BaseModel):
    name: Optional[str] = Field(None, description="道具名称")
    type: Optional[str] = Field(None, description="道具类型")
    effect: Optional[str] = Field(None, description="效果")
    value: Optional[int] = Field(None, description="数值")
    duration: Optional[int] = Field(None, description="持续时间")
    description: Optional[str] = Field(None, description="描述")


class DafeijiItemController:
    def __init__(self):
        from app.business.dafeiji.item_business import DafeijiItemBusiness
        from app.business.dafeiji.user_business import DafeijiUserBusiness
        self.item_business = DafeijiItemBusiness()
        self.user_business = DafeijiUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionDafeijiItemListGet(self, request: Request,
                                  page: int = Query(1, ge=1, description="页码"),
                                  page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                  type: Optional[str] = Query(None, description="道具类型")):
        return self.item_business.get_list(
            page=page,
            page_size=page_size,
            type_filter=type
        )

    def ActionDafeijiItemAllGet(self, request: Request,
                                 type: Optional[str] = Query(None, description="道具类型")):
        return self.item_business.get_all(type_filter=type)

    def ActionDafeijiItemDetailGet(self, request: Request,
                                    item_id: int = Query(..., description="道具ID")):
        return self.item_business.get_item_by_id(item_id=item_id)

    def ActionDafeijiItemCreatePost(self, request: Request, body: CreateItemRequest,
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        data = {k: v for k, v in body.__dict__.items() if not k.startswith('_') and v is not None}
        return self.item_business.create(data=data)

    def ActionDafeijiItemUpdatePost(self, request: Request,
                                     item_id: int = Query(..., description="道具ID"),
                                     body: UpdateItemRequest = None,
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        data = {k: v for k, v in body.__dict__.items() if not k.startswith('_') and v is not None}
        return self.item_business.update(
            item_id=item_id,
            data=data
        )

    def ActionDafeijiItemDeletePost(self, request: Request,
                                     item_id: int = Query(..., description="道具ID"),
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        return self.item_business.delete(item_id=item_id)
