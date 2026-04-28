from typing import Optional, List
from fastapi import APIRouter, Query, Request, Header
from pydantic import BaseModel, Field
from app.business.dj import DjBoothBusiness, DjAuthBusiness


class CreateBoothRequest(BaseModel):
    market_id: int = Field(..., description="所属集市ID")
    vendor_name: Optional[str] = Field(None, description="摊主姓名")
    phone: Optional[str] = Field(None, description="联系电话")
    wechat: Optional[str] = Field(None, description="微信号")
    location_desc: Optional[str] = Field(None, description="摊位位置描述")
    categories: Optional[str] = Field(None, description="主营品类JSON")
    description: Optional[str] = Field(None, description="摊位介绍")
    images: Optional[str] = Field(None, description="摊位照片JSON")
    status: Optional[int] = Field(1, description="状态 1正常/2暂停")


class ApplyVendorRequest(BaseModel):
    market_id: int = Field(..., description="所属集市ID")
    vendor_name: Optional[str] = Field(None, description="摊主姓名")
    phone: Optional[str] = Field(None, description="联系电话")
    wechat: Optional[str] = Field(None, description="微信号")
    location_desc: Optional[str] = Field(None, description="摊位位置描述")
    categories: Optional[str] = Field(None, description="主营品类JSON")
    description: Optional[str] = Field(None, description="摊位介绍")
    images: Optional[str] = Field(None, description="摊位照片JSON")


class UpdateBoothRequest(BaseModel):
    vendor_name: Optional[str] = Field(None, description="摊主姓名")
    phone: Optional[str] = Field(None, description="联系电话")
    wechat: Optional[str] = Field(None, description="微信号")
    location_desc: Optional[str] = Field(None, description="摊位位置描述")
    categories: Optional[str] = Field(None, description="主营品类JSON")
    description: Optional[str] = Field(None, description="摊位介绍")
    images: Optional[str] = Field(None, description="摊位照片JSON")


class UpdateBoothStatusRequest(BaseModel):
    booth_id: int = Field(..., description="摊位ID")
    status: int = Field(..., description="状态 1正常/2暂停")


class VerifyBoothRequest(BaseModel):
    booth_id: int = Field(..., description="摊位ID")
    is_verified: int = Field(..., description="是否认证 1是/0否")


class DjBoothController:
    def __init__(self):
        self.booth_business = DjBoothBusiness()
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

    def ActionDjBoothCreatePost(self, request: Request, body: CreateBoothRequest, authorization: Optional[str] = Header(None)):
        """
        创建摊位接口
        POST /api/dj/booth/create
        创建新摊位（管理端使用）
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
            'vendor_name': body.vendor_name,
            'phone': body.phone,
            'wechat': body.wechat,
            'location_desc': body.location_desc,
            'categories': body.categories,
            'description': body.description,
            'images': body.images,
            'status': body.status,
            'is_verified': 1,
            'apply_status': 1
        }

        return self.booth_business.create_booth(data)

    def ActionDjBoothApplyPost(self, request: Request, body: ApplyVendorRequest, authorization: Optional[str] = Header(None)):
        """
        摊主申请入驻接口
        POST /api/dj/booth/apply
        摊主申请入驻
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
            'vendor_name': body.vendor_name,
            'phone': body.phone,
            'wechat': body.wechat,
            'location_desc': body.location_desc,
            'categories': body.categories,
            'description': body.description,
            'images': body.images
        }

        return self.booth_business.apply_vendor(user.get('id'), data)

    def ActionDjBoothDetailGet(self, request: Request, booth_id: int = Query(..., description="摊位ID"), authorization: Optional[str] = Header(None)):
        """
        获取摊位详情接口
        GET /api/dj/booth/detail
        获取摊位详细信息
        """
        return self.booth_business.get_booth_detail(booth_id)

    def ActionDjBoothListGet(self, request: Request, page: int = Query(1, description="页码"), page_size: int = Query(10, description="每页数量"), market_id: Optional[int] = Query(None, description="集市ID"), status: Optional[int] = Query(None, description="状态"), apply_status: Optional[int] = Query(None, description="申请状态"), authorization: Optional[str] = Header(None)):
        """
        获取摊位列表接口
        GET /api/dj/booth/list
        分页获取摊位列表
        """
        return self.booth_business.get_booth_list(page, page_size, market_id, status, apply_status)

    def ActionDjBoothMyGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取我的摊位接口
        GET /api/dj/booth/my
        获取当前用户的摊位
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.booth_business.get_user_booths(user.get('id'))

    def ActionDjBoothPendingGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取待审核摊位申请接口
        GET /api/dj/booth/pending
        获取待审核的摊位申请列表
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.booth_business.get_pending_applications()

    def ActionDjBoothUpdatePost(self, request: Request, body: UpdateBoothRequest, booth_id: int = Query(..., description="摊位ID"), authorization: Optional[str] = Header(None)):
        """
        更新摊位接口
        POST /api/dj/booth/update
        更新摊位信息
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {}
        if body.vendor_name is not None:
            data['vendor_name'] = body.vendor_name
        if body.phone is not None:
            data['phone'] = body.phone
        if body.wechat is not None:
            data['wechat'] = body.wechat
        if body.location_desc is not None:
            data['location_desc'] = body.location_desc
        if body.categories is not None:
            data['categories'] = body.categories
        if body.description is not None:
            data['description'] = body.description
        if body.images is not None:
            data['images'] = body.images

        return self.booth_business.update_booth(booth_id, data)

    def ActionDjBoothVerifyPost(self, request: Request, body: VerifyBoothRequest, authorization: Optional[str] = Header(None)):
        """
        审核摊位申请接口
        POST /api/dj/booth/verify
        审核摊位入驻申请
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.booth_business.verify_booth(body.booth_id, body.is_verified)

    def ActionDjBoothStatusUpdatePost(self, request: Request, body: UpdateBoothStatusRequest, authorization: Optional[str] = Header(None)):
        """
        更新摊位状态接口
        POST /api/dj/booth/status/update
        更新摊位状态
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.booth_business.update_status(body.booth_id, body.status)

    def ActionDjBoothDeletePost(self, request: Request, booth_id: int = Query(..., description="摊位ID"), authorization: Optional[str] = Header(None)):
        """
        删除摊位接口
        POST /api/dj/booth/delete
        删除摊位
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.booth_business.delete_booth(booth_id)

    def ActionDjBoothStatisticsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取摊位统计接口
        GET /api/dj/booth/statistics
        获取摊位统计数据
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.booth_business.get_statistics()
