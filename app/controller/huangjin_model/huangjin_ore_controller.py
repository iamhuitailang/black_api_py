from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateOreRequest(BaseModel):
    name: str = Field(..., description="矿石名称")
    value: int = Field(..., description="矿石价值")
    weight: float = Field(..., description="矿石重量")
    color: Optional[str] = Field('#FFD700', description="矿石颜色")
    icon: Optional[str] = Field('', description="矿石图标")
    rarity: Optional[int] = Field(0, description="稀有度")
    description: Optional[str] = Field('', description="矿石描述")
    sort_order: Optional[int] = Field(0, description="排序")


class UpdateOreRequest(BaseModel):
    name: Optional[str] = Field(None, description="矿石名称")
    value: Optional[int] = Field(None, description="矿石价值")
    weight: Optional[float] = Field(None, description="矿石重量")
    color: Optional[str] = Field(None, description="矿石颜色")
    icon: Optional[str] = Field(None, description="矿石图标")
    rarity: Optional[int] = Field(None, description="稀有度")
    description: Optional[str] = Field(None, description="矿石描述")
    sort_order: Optional[int] = Field(None, description="排序")


class HuangjinOreController:
    def __init__(self):
        from app.business.huangjin_model.ore_business import OreBusiness
        self.ore_business = OreBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.huangjin_model.auth_business import HuangjinAuthBusiness
        return HuangjinAuthBusiness().verify_token(token)

    def ActionHuangjinOreListGet(self, request: Request,
                                  page: int = Query(1, ge=1, description="页码"),
                                  page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                  status: Optional[int] = Query(None, description="状态"),
                                  rarity: Optional[int] = Query(None, description="稀有度"),
                                  authorization: Optional[str] = Header(None)):
        """
        获取矿石列表接口
        GET /api/huangjin/ore/list/get
        管理员获取所有矿石列表
        """
        return self.ore_business.get_ore_list(page, page_size, status, rarity)

    def ActionHuangjinOreEnabledGet(self, request: Request):
        """
        获取启用的矿石列表接口
        GET /api/huangjin/ore/enabled/get
        获取所有启用的矿石（用于游戏）
        """
        return self.ore_business.get_enabled_ores()

    def ActionHuangjinOreDetailGet(self, request: Request, ore_id: int = Query(..., description="矿石ID")):
        """
        获取矿石详情接口
        GET /api/huangjin/ore/detail/get
        根据ID获取矿石详情
        """
        return self.ore_business.get_ore_detail(ore_id)

    def ActionHuangjinOreCreatePost(self, request: Request, body: CreateOreRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        创建矿石接口
        POST /api/huangjin/ore/create
        管理员创建新矿石
        """
        return self.ore_business.create_ore(
            name=body.name,
            value=body.value,
            weight=body.weight,
            color=body.color or '#FFD700',
            icon=body.icon or '',
            rarity=body.rarity or 0,
            description=body.description or '',
            sort_order=body.sort_order or 0
        )

    def ActionHuangjinOreUpdatePost(self, request: Request, body: UpdateOreRequest,
                                     ore_id: int = Query(..., description="矿石ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        更新矿石接口
        POST /api/huangjin/ore/update
        管理员更新矿石信息
        """
        data = {k: v for k, v in body.model_dump().items() if v is not None}
        return self.ore_business.update_ore(ore_id, data)

    def ActionHuangjinOreDeletePost(self, request: Request, ore_id: int = Query(..., description="矿石ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        删除矿石接口
        POST /api/huangjin/ore/delete
        管理员删除矿石
        """
        return self.ore_business.delete_ore(ore_id)

    def ActionHuangjinOreToggleStatusPost(self, request: Request, ore_id: int = Query(..., description="矿石ID"),
                                           authorization: Optional[str] = Header(None)):
        """
        切换矿石状态接口
        POST /api/huangjin/ore/toggle/status
        管理员切换矿石启用/禁用状态
        """
        return self.ore_business.toggle_ore_status(ore_id)
