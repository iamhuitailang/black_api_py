from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class PurchaseEquipmentRequest(BaseModel):
    equipment_id: int = Field(..., description="装备ID")


class WangzheEquipmentController:
    def __init__(self):
        from app.business.wangzhe_model.equipment_business import WangzheEquipmentBusiness
        self.equipment_business = WangzheEquipmentBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.wangzhe_model.user_business import WangzheUserBusiness
        user_business = WangzheUserBusiness()
        return user_business.verify_token(token)

    def ActionWangzheEquipmentListGet(self, request: Request, page: int = Query(1, description="页码"),
                                       page_size: int = Query(50, description="每页数量"),
                                       type: Optional[str] = Query(None, description="类型"),
                                       keyword: Optional[str] = Query(None, description="关键词")):
        """
        获取装备列表接口
        GET /api/wangzhe/equipment/list/get
        分页获取所有装备信息
        """
        return self.equipment_business.get_equipment_list(page, page_size, type, keyword)

    def ActionWangzheEquipmentDetailGet(self, request: Request, equipment_id: int = Query(..., description="装备ID")):
        """
        获取装备详情接口
        GET /api/wangzhe/equipment/detail/get
        根据装备ID获取详情
        """
        return self.equipment_business.get_equipment_detail(equipment_id)
