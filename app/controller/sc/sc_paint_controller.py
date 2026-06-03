from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreatePaintRequest(BaseModel):
    name: str = Field(..., description="涂料名称")
    paint_type: str = Field(..., description="涂料类型")
    color_hex: str = Field(..., description="颜色十六进制值")
    price: float = Field(..., description="价格")
    is_public: bool = Field(..., description="是否公开")


class UpdatePaintRequest(BaseModel):
    paint_id: int = Field(..., description="涂料ID")
    name: Optional[str] = Field(None, description="涂料名称")
    paint_type: Optional[str] = Field(None, description="涂料类型")
    color_hex: Optional[str] = Field(None, description="颜色十六进制值")
    price: Optional[float] = Field(None, description="价格")
    is_public: Optional[bool] = Field(None, description="是否公开")


class BuyPaintRequest(BaseModel):
    paint_id: int = Field(..., description="涂料ID")


class DeletePaintRequest(BaseModel):
    paint_id: int = Field(..., description="涂料ID")


class ScPaintController:
    def __init__(self):
        from app.business.sc.sc_paint_business import ScPaintBusiness
        self.sc_paint_business = ScPaintBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.sc.sc_user_business import ScUserBusiness
        user_business = ScUserBusiness()
        return user_business.verify_token(token)

    def ActionScPaintCreatePost(self, request: Request, body: CreatePaintRequest,
                                 authorization: Optional[str] = Header(None)):
        """
        创建涂料接口
        POST /api/sc/paint/create
        创建新的涂料设计
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.sc_paint_business.create_paint(
            user_id=user.get('id'),
            name=body.name,
            paint_type=body.paint_type,
            color_hex=body.color_hex,
            price=body.price,
            is_public=body.is_public
        )

    def ActionScPaintUserListGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取用户涂料列表接口
        GET /api/sc/paint/user/list/get
        获取当前用户的所有涂料
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.sc_paint_business.get_user_paints(user_id=user.get('id'))

    def ActionScPaintPublicListGet(self, request: Request, paint_type: Optional[str] = Query(None, description="涂料类型"),
                                    page: int = Query(1, description="页码"),
                                    page_size: int = Query(10, description="每页数量"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取公开涂料列表接口
        GET /api/sc/paint/public/list/get
        获取公开的涂料市场列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.sc_paint_business.get_public_paints(
            user_id=user.get('id'),
            paint_type=paint_type,
            page=page,
            page_size=page_size
        )

    def ActionScPaintUpdatePost(self, request: Request, body: UpdatePaintRequest,
                                 authorization: Optional[str] = Header(None)):
        """
        更新涂料接口
        POST /api/sc/paint/update
        更新涂料的属性
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
        if body.name is not None:
            data['name'] = body.name
        if body.paint_type is not None:
            data['paint_type'] = body.paint_type
        if body.color_hex is not None:
            data['color_hex'] = body.color_hex
        if body.price is not None:
            data['price'] = body.price
        if body.is_public is not None:
            data['is_public'] = body.is_public

        return self.sc_paint_business.update_paint(
            user_id=user.get('id'),
            paint_id=body.paint_id,
            data=data
        )

    def ActionScPaintDeletePost(self, request: Request, body: DeletePaintRequest,
                                 authorization: Optional[str] = Header(None)):
        """
        删除涂料接口
        POST /api/sc/paint/delete
        删除指定的涂料
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.sc_paint_business.delete_paint(
            user_id=user.get('id'),
            paint_id=body.paint_id
        )

    def ActionScPaintBuyPost(self, request: Request, body: BuyPaintRequest,
                              authorization: Optional[str] = Header(None)):
        """
        购买涂料接口
        POST /api/sc/paint/buy
        购买公开市场的涂料
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.sc_paint_business.buy_paint(
            user_id=user.get('id'),
            paint_id=body.paint_id
        )
