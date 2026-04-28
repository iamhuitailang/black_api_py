from typing import Optional
from fastapi import APIRouter, Query, Request, Header
from pydantic import BaseModel, Field
from app.business.dj import DjPriceBusiness, DjAuthBusiness


class ReportPriceRequest(BaseModel):
    market_id: int = Field(..., description="集市ID")
    item_name: str = Field(..., description="物品名称")
    category_id: Optional[int] = Field(None, description="分类ID")
    category_name: Optional[str] = Field(None, description="分类名称")
    min_price: float = Field(..., description="最低价")
    max_price: float = Field(..., description="最高价")
    unit: Optional[str] = Field('斤', description="单位")


class AuditPriceRequest(BaseModel):
    price_id: int = Field(..., description="价格记录ID")
    report_status: int = Field(..., description="审核状态 1通过/2拒绝")


class DjPriceController:
    def __init__(self):
        self.price_business = DjPriceBusiness()
        self.auth_business = DjAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _verify_auth(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self.auth_business.verify_token(token)
        if not user:
            return None
        return user

    def ActionDjPriceReportPost(self, request: Request, body: ReportPriceRequest, authorization: Optional[str] = Header(None)):
        """
        上报价格接口
        POST /api/dj/price/report
        用户上报价格
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {
            'market_id': body.market_id,
            'item_name': body.item_name,
            'category_id': body.category_id,
            'category_name': body.category_name,
            'min_price': body.min_price,
            'max_price': body.max_price,
            'unit': body.unit
        }

        return self.price_business.report_price(user.get('id'), data)

    def ActionDjPriceDetailGet(self, request: Request, price_id: int = Query(..., description="价格记录ID"), authorization: Optional[str] = Header(None)):
        """
        获取价格详情接口
        GET /api/dj/price/detail
        获取价格记录详情
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.price_business.get_price_detail(price_id)

    def ActionDjPriceListGet(self, request: Request, page: int = Query(1, description="页码"), page_size: int = Query(10, description="每页数量"), market_id: Optional[int] = Query(None, description="集市ID"), report_status: Optional[int] = Query(None, description="审核状态"), authorization: Optional[str] = Header(None)):
        """
        获取价格列表接口
        GET /api/dj/price/list
        分页获取价格列表
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.price_business.get_price_list(page, page_size, market_id, report_status)

    def ActionDjPricePendingGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取待审核价格接口
        GET /api/dj/price/pending
        获取待审核的价格上报列表
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.price_business.get_pending_reports()

    def ActionDjPriceMarketGet(self, request: Request, market_id: int = Query(..., description="集市ID")):
        """
        获取集市价格列表接口
        GET /api/dj/price/market
        获取集市已审核通过的价格列表
        """
        return self.price_business.get_market_prices(market_id)

    def ActionDjPriceTrendGet(self, request: Request, market_id: int = Query(..., description="集市ID"), item_name: str = Query(..., description="物品名称")):
        """
        获取价格趋势接口
        GET /api/dj/price/trend
        获取某物品的价格趋势
        """
        return self.price_business.get_price_trend(market_id, item_name)

    def ActionDjPriceAuditPost(self, request: Request, body: AuditPriceRequest, authorization: Optional[str] = Header(None)):
        """
        审核价格接口
        POST /api/dj/price/audit
        审核价格上报
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.price_business.audit_price(body.price_id, user.get('id'), body.report_status)

    def ActionDjPriceDeletePost(self, request: Request, price_id: int = Query(..., description="价格记录ID"), authorization: Optional[str] = Header(None)):
        """
        删除价格接口
        POST /api/dj/price/delete
        删除价格记录
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.price_business.delete_price(price_id)

    def ActionDjPriceStatisticsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取价格统计接口
        GET /api/dj/price/statistics
        获取价格统计数据
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.price_business.get_statistics()
