from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class JnAdminExchangeController:
    def __init__(self):
        from app.business.jn.exchange_business import JnExchangeBusiness
        from app.business.jn.skill_business import JnSkillBusiness
        from app.business.jn.admin_business import JnAdminBusiness
        self.exchange_business = JnExchangeBusiness()
        self.skill_business = JnSkillBusiness()
        self.admin_business = JnAdminBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_business.verify_token(token)

    def ActionJnAdminExchangeListGet(self, request: Request,
                                       page: int = Query(1, description="页码"),
                                       page_size: int = Query(10, description="每页数量"),
                                       status: Optional[str] = Query(None, description="交换状态"),
                                       keyword: Optional[str] = Query(None, description="搜索关键词"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取交换订单列表接口（管理端）
        GET /api/jn/admin/exchange/list/get
        管理员查看交换订单列表
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.exchange_business.get_all_exchanges(
            page=page,
            page_size=page_size,
            status=status,
            keyword=keyword
        )

    def ActionJnAdminExchangeDetailGet(self, request: Request,
                                         exchange_id: int = Query(..., description="交换记录ID"),
                                         authorization: Optional[str] = Header(None)):
        """
        获取交换订单详情接口（管理端）
        GET /api/jn/admin/exchange/detail/get
        管理员查看交换订单详情
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        from app.model.jn import ExchangeModel, UserModel, SkillModel
        
        exchange_model = ExchangeModel()
        exchange = exchange_model.get_by_id(exchange_id)
        
        if not exchange:
            return {
                'code': 1,
                'msg': '交换记录不存在',
                'data': None
            }

        item = exchange_model.to_dict(exchange)
        
        user_model = UserModel()
        skill_model = SkillModel()
        
        from_user = user_model.get_by_id(exchange.get('from_user'))
        to_user = user_model.get_by_id(exchange.get('to_user'))
        offer_skill = skill_model.get_by_id(exchange.get('offer_skill_id'))
        need_skill = skill_model.get_by_id(exchange.get('need_skill_id'))
        
        item['from_user_info'] = user_model.to_public_dict(from_user) if from_user else None
        item['to_user_info'] = user_model.to_public_dict(to_user) if to_user else None
        item['offer_skill_info'] = skill_model.to_dict(offer_skill) if offer_skill else None
        item['need_skill_info'] = skill_model.to_dict(need_skill) if need_skill else None

        return {
            'code': 0,
            'msg': 'success',
            'data': item
        }

    def ActionJnAdminExchangeCancelPost(self, request: Request,
                                          exchange_id: int = Query(..., description="交换记录ID"),
                                          authorization: Optional[str] = Header(None)):
        """
        取消异常订单接口（管理端）
        POST /api/jn/admin/exchange/cancel
        管理员强制取消异常订单
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        from app.model.jn import ExchangeModel
        
        exchange_model = ExchangeModel()
        exchange = exchange_model.get_by_id(exchange_id)
        
        if not exchange:
            return {
                'code': 1,
                'msg': '交换记录不存在',
                'data': None
            }

        affected = exchange_model.cancel(exchange_id)
        if affected > 0:
            updated = exchange_model.get_by_id(exchange_id)
            return {
                'code': 0,
                'msg': '订单已取消',
                'data': exchange_model.to_dict(updated)
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }
