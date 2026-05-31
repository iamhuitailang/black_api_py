from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreatePropRequest(BaseModel):
    name: str = Field(..., description="道具名称")
    icon: str = Field(..., description="道具图标")
    effect_type: str = Field(..., description="效果类型")
    description: Optional[str] = Field(None, description="道具描述")
    effect_value: Optional[int] = Field(0, description="效果值")
    price: Optional[int] = Field(0, description="价格")
    sort_order: Optional[int] = Field(0, description="排序")


class UpdatePropRequest(BaseModel):
    name: Optional[str] = Field(None, description="道具名称")
    icon: Optional[str] = Field(None, description="道具图标")
    effect_type: Optional[str] = Field(None, description="效果类型")
    description: Optional[str] = Field(None, description="道具描述")
    effect_value: Optional[int] = Field(None, description="效果值")
    price: Optional[int] = Field(None, description="价格")
    sort_order: Optional[int] = Field(None, description="排序")


class BuyPropRequest(BaseModel):
    prop_id: int = Field(..., description="道具ID")
    quantity: Optional[int] = Field(1, description="购买数量")


class UsePropRequest(BaseModel):
    prop_id: int = Field(..., description="道具ID")


class LlkPropController:
    def __init__(self):
        from app.business.lianliankan077.prop_business import LlkPropBusiness
        self.prop_business = LlkPropBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.lianliankan077.user_business import LlkUserBusiness
        return LlkUserBusiness().verify_token(token)

    def _get_current_admin(self, token: str) -> Optional[dict]:
        from app.business.lianliankan077.admin_business import LlkAdminBusiness
        return LlkAdminBusiness().verify_token(token)

    def ActionLlkPropListGet(self, request: Request):
        """
        获取活跃道具列表
        GET /api/lianliankan/prop/list/get
        """
        return self.prop_business.get_active_props()

    def ActionLlkPropUserListGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取用户道具
        GET /api/lianliankan/prop/user/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.prop_business.get_user_props(user.get('id'))

    def ActionLlkPropBuyPost(self, request: Request, body: BuyPropRequest,
                              authorization: Optional[str] = Header(None)):
        """
        购买道具
        POST /api/lianliankan/prop/buy
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.prop_business.buy_prop(
            user_id=user.get('id'),
            prop_id=body.prop_id,
            quantity=body.quantity or 1
        )

    def ActionLlkPropUsePost(self, request: Request, body: UsePropRequest,
                              authorization: Optional[str] = Header(None)):
        """
        使用道具
        POST /api/lianliankan/prop/use
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.prop_business.use_prop(
            user_id=user.get('id'),
            prop_id=body.prop_id
        )

    def ActionLlkPropAllGet(self, request: Request,
                             page: int = Query(1, ge=1, description="页码"),
                             page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                             status: Optional[int] = Query(None, description="状态"),
                             authorization: Optional[str] = Header(None)):
        """
        获取所有道具（管理员）
        GET /api/lianliankan/prop/all/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.prop_business.get_prop_list(page, page_size, status)

    def ActionLlkPropCreatePost(self, request: Request, body: CreatePropRequest,
                                 authorization: Optional[str] = Header(None)):
        """
        创建道具
        POST /api/lianliankan/prop/create
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.prop_business.create_prop(
            name=body.name, icon=body.icon,
            effect_type=body.effect_type,
            description=body.description or '',
            effect_value=body.effect_value or 0,
            price=body.price or 0,
            sort_order=body.sort_order or 0
        )

    def ActionLlkPropUpdatePost(self, request: Request, body: UpdatePropRequest,
                                 prop_id: int = Query(..., description="道具ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        更新道具
        POST /api/lianliankan/prop/update
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        data = {k: v for k, v in body.model_dump().items() if v is not None}
        return self.prop_business.update_prop(prop_id, data)

    def ActionLlkPropStatusUpdatePost(self, request: Request,
                                       prop_id: int = Query(..., description="道具ID"),
                                       status: int = Query(..., description="状态"),
                                       authorization: Optional[str] = Header(None)):
        """
        更新道具状态
        POST /api/lianliankan/prop/status/update
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.prop_business.update_prop_status(prop_id, status)

    def ActionLlkPropDeletePost(self, request: Request, prop_id: int = Query(..., description="道具ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        删除道具
        POST /api/lianliankan/prop/delete
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.prop_business.delete_prop(prop_id)
