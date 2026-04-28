from typing import Optional, List
from fastapi import APIRouter, Query, Request, Header
from pydantic import BaseModel, Field
from app.business.dj import DjMarketBusiness, DjAuthBusiness


class CreateMarketRequest(BaseModel):
    name: str = Field(..., description="集市名称")
    location: Optional[str] = Field(None, description="详细地址")
    lunar_dates: Optional[str] = Field(None, description="农历日期")
    solar_dates: Optional[str] = Field(None, description="公历日期")
    open_time: Optional[str] = Field(None, description="开市时间")
    close_time: Optional[str] = Field(None, description="闭市时间")
    scale: Optional[str] = Field(None, description="规模")
    hot: Optional[int] = Field(0, description="热度")
    booth_count: Optional[int] = Field(0, description="摊位数量")
    admin_phone: Optional[str] = Field(None, description="管理办电话")
    description: Optional[str] = Field(None, description="简介")
    images: Optional[str] = Field(None, description="集市图片JSON")
    status: Optional[int] = Field(1, description="状态 1正常/2暂停/3关闭")


class UpdateMarketRequest(BaseModel):
    name: Optional[str] = Field(None, description="集市名称")
    location: Optional[str] = Field(None, description="详细地址")
    lunar_dates: Optional[str] = Field(None, description="农历日期")
    solar_dates: Optional[str] = Field(None, description="公历日期")
    open_time: Optional[str] = Field(None, description="开市时间")
    close_time: Optional[str] = Field(None, description="闭市时间")
    scale: Optional[str] = Field(None, description="规模")
    booth_count: Optional[int] = Field(None, description="摊位数量")
    admin_phone: Optional[str] = Field(None, description="管理办电话")
    description: Optional[str] = Field(None, description="简介")
    images: Optional[str] = Field(None, description="集市图片JSON")


class UpdateMarketStatusRequest(BaseModel):
    market_id: int = Field(..., description="集市ID")
    status: int = Field(..., description="状态 1正常/2暂停/3关闭")


class AddMarketItemRequest(BaseModel):
    market_id: int = Field(..., description="集市ID")
    category_id: Optional[int] = Field(None, description="分类ID")
    category_name: Optional[str] = Field(None, description="分类名称")
    area_desc: Optional[str] = Field(None, description="区域描述")


class DjMarketController:
    def __init__(self):
        self.market_business = DjMarketBusiness()
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

    def ActionDjMarketCreatePost(self, request: Request, body: CreateMarketRequest, authorization: Optional[str] = Header(None)):
        """
        创建集市接口
        POST /api/dj/market/create
        创建新集市
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {
            'name': body.name,
            'location': body.location,
            'lunar_dates': body.lunar_dates,
            'solar_dates': body.solar_dates,
            'open_time': body.open_time,
            'close_time': body.close_time,
            'scale': body.scale,
            'hot': body.hot,
            'booth_count': body.booth_count,
            'admin_phone': body.admin_phone,
            'description': body.description,
            'images': body.images,
            'status': body.status
        }

        return self.market_business.create_market(data)

    def ActionDjMarketUpdatePost(self, request: Request, body: UpdateMarketRequest, market_id: int = Query(..., description="集市ID"), authorization: Optional[str] = Header(None)):
        """
        更新集市接口
        POST /api/dj/market/update
        更新集市信息
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.location is not None:
            data['location'] = body.location
        if body.lunar_dates is not None:
            data['lunar_dates'] = body.lunar_dates
        if body.solar_dates is not None:
            data['solar_dates'] = body.solar_dates
        if body.open_time is not None:
            data['open_time'] = body.open_time
        if body.close_time is not None:
            data['close_time'] = body.close_time
        if body.scale is not None:
            data['scale'] = body.scale
        if body.booth_count is not None:
            data['booth_count'] = body.booth_count
        if body.admin_phone is not None:
            data['admin_phone'] = body.admin_phone
        if body.description is not None:
            data['description'] = body.description
        if body.images is not None:
            data['images'] = body.images

        return self.market_business.update_market(market_id, data)

    def ActionDjMarketDetailGet(self, request: Request, market_id: int = Query(..., description="集市ID"), authorization: Optional[str] = Header(None)):
        """
        获取集市详情接口
        GET /api/dj/market/detail
        获取集市详细信息
        """
        return self.market_business.get_market_detail(market_id, increment_hot=True)

    def ActionDjMarketListGet(self, request: Request, page: int = Query(1, description="页码"), page_size: int = Query(10, description="每页数量"), status: Optional[int] = Query(None, description="状态"), keyword: Optional[str] = Query(None, description="搜索关键词"), authorization: Optional[str] = Header(None)):
        """
        获取集市列表接口
        GET /api/dj/market/list
        分页获取集市列表
        """
        return self.market_business.get_market_list(page, page_size, status, keyword)

    def ActionDjMarketHotGet(self, request: Request, limit: int = Query(10, description="数量")):
        """
        获取热门集市接口
        GET /api/dj/market/hot
        获取热门集市列表
        """
        return self.market_business.get_hot_markets(limit)

    def ActionDjMarketStatusUpdatePost(self, request: Request, body: UpdateMarketStatusRequest, authorization: Optional[str] = Header(None)):
        """
        更新集市状态接口
        POST /api/dj/market/status/update
        更新集市状态
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.market_business.update_status(body.market_id, body.status)

    def ActionDjMarketDeletePost(self, request: Request, market_id: int = Query(..., description="集市ID"), authorization: Optional[str] = Header(None)):
        """
        删除集市接口
        POST /api/dj/market/delete
        删除集市
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.market_business.delete_market(market_id)

    def ActionDjMarketStatisticsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取集市统计接口
        GET /api/dj/market/statistics
        获取集市统计数据
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.market_business.get_statistics()

    def ActionDjMarketItemAddPost(self, request: Request, body: AddMarketItemRequest, authorization: Optional[str] = Header(None)):
        """
        添加集市物品分布接口
        POST /api/dj/market/item/add
        添加集市物品分布
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {
            'category_id': body.category_id,
            'category_name': body.category_name,
            'area_desc': body.area_desc
        }

        return self.market_business.add_market_item(body.market_id, data)

    def ActionDjMarketItemDeletePost(self, request: Request, item_id: int = Query(..., description="物品分布ID"), authorization: Optional[str] = Header(None)):
        """
        删除集市物品分布接口
        POST /api/dj/market/item/delete
        删除集市物品分布
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.market_business.delete_market_item(item_id)
