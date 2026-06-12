from typing import Optional, List
from fastapi import APIRouter, Query, Request, Header
from pydantic import BaseModel, Field
from app.business.rental import RentalBusiness


class ListingCreateRequest(BaseModel):
    title: str = Field(..., description="房源标题")
    district: str = Field(..., description="区域")
    address: str = Field(..., description="详细地址")
    room_type: str = Field(..., description="户型：一居/两居/三居/合租单间")
    area_sqm: float = Field(default=0, description="面积（平方米）")
    price_month: int = Field(default=0, description="月租（元）")
    deposit: str = Field(default='', description="押金方式")
    is_shared: bool = Field(default=False, description="是否合租")
    floor: str = Field(default='', description="楼层")
    has_elevator: bool = Field(default=False, description="有无电梯")
    has_parking: bool = Field(default=False, description="有无车位")
    description: str = Field(default='', description="房源描述")
    images: List[str] = Field(default=[], description="图片URL列表，最多5张")
    contact_name: str = Field(..., description="联系人姓名")
    contact_phone: str = Field(..., description="联系电话")
    password: str = Field(..., description="管理密码（至少4位）")


class ListingStatusUpdateRequest(BaseModel):
    id: int = Field(..., ge=1, description="房源ID")
    status: str = Field(..., description="状态：active/rented/offline")
    password: str = Field(..., description="管理密码")


class ListingDeleteRequest(BaseModel):
    id: int = Field(..., ge=1, description="房源ID")
    password: str = Field(..., description="管理密码")


class ListingRefreshRequest(BaseModel):
    id: int = Field(..., ge=1, description="房源ID")
    password: str = Field(..., description="管理密码")


class FavoriteToggleRequest(BaseModel):
    listing_id: int = Field(..., ge=1, description="房源ID")
    favorited: bool = Field(..., description="true收藏/false取消")


class RentalController:
    def __init__(self):
        self.business = RentalBusiness()

    @staticmethod
    def _get_session_id(x_session_id: Optional[str]) -> str:
        return x_session_id or ''

    def ActionRentalListingListGet(
        self,
        request: Request,
        district: Optional[str] = Query(default=None, description="区域筛选"),
        room_type: Optional[str] = Query(default=None, description="户型筛选"),
        min_price: Optional[int] = Query(default=None, ge=0, description="最低价格"),
        max_price: Optional[int] = Query(default=None, ge=0, description="最高价格"),
        page: int = Query(default=1, ge=1, description="页码"),
        page_size: int = Query(default=20, ge=1, le=100, description="每页数量"),
        x_session_id: Optional[str] = Header(default=None, description="会话ID"),
    ):
        """
        获取房源列表（支持多条件筛选）
        GET /api/rental/listing/list/get
        """
        return self.business.get_listing_list(
            district=district,
            room_type=room_type,
            min_price=min_price,
            max_price=max_price,
            page=page,
            page_size=page_size,
            session_id=self._get_session_id(x_session_id),
        )

    def ActionRentalListingDetailGet(
        self,
        request: Request,
        id: int = Query(..., ge=1, description="房源ID"),
        with_contact: bool = Query(default=True, description="是否包含联系方式"),
        x_session_id: Optional[str] = Header(default=None, description="会话ID"),
    ):
        """
        获取房源详情
        GET /api/rental/listing/detail/get
        """
        return self.business.get_listing_detail(
            listing_id=id,
            with_contact=with_contact,
            session_id=self._get_session_id(x_session_id),
        )

    def ActionRentalListingAddPost(self, request: Request, body: ListingCreateRequest):
        """
        发布房源
        POST /api/rental/listing/add
        """
        return self.business.create_listing(
            title=body.title,
            district=body.district,
            address=body.address,
            room_type=body.room_type,
            area_sqm=body.area_sqm,
            price_month=body.price_month,
            deposit=body.deposit,
            is_shared=body.is_shared,
            floor=body.floor,
            has_elevator=body.has_elevator,
            has_parking=body.has_parking,
            description=body.description,
            images=body.images,
            contact_name=body.contact_name,
            contact_phone=body.contact_phone,
            password=body.password,
        )

    def ActionRentalListingStatusUpdatePost(
        self, request: Request, body: ListingStatusUpdateRequest
    ):
        """
        更新房源状态（需密码验证）
        POST /api/rental/listing/status/update
        status: active=在租, rented=已租出, offline=已下架
        """
        return self.business.update_status(
            listing_id=body.id,
            status=body.status,
            password=body.password,
        )

    def ActionRentalListingRefreshPost(self, request: Request, body: ListingRefreshRequest):
        """
        刷新过期房源（需密码验证）
        POST /api/rental/listing/refresh
        """
        return self.business.refresh_listing(
            listing_id=body.id,
            password=body.password,
        )

    def ActionRentalListingDelete(self, request: Request, body: ListingDeleteRequest):
        """
        删除房源（需密码验证）
        DELETE /api/rental/listing/delete
        """
        return self.business.delete_listing(
            listing_id=body.id,
            password=body.password,
        )

    def ActionRentalFavoriteSetPost(
        self,
        request: Request,
        body: FavoriteToggleRequest,
        x_session_id: Optional[str] = Header(default=None, description="会话ID"),
    ):
        """
        收藏/取消收藏房源
        POST /api/rental/favorite/set
        """
        return self.business.toggle_favorite(
            listing_id=body.listing_id,
            session_id=self._get_session_id(x_session_id),
            favorited=body.favorited,
        )

    def ActionRentalFavoriteListGet(
        self,
        request: Request,
        x_session_id: Optional[str] = Header(default=None, description="会话ID"),
    ):
        """
        获取收藏列表（按收藏时间倒序）
        GET /api/rental/favorite/list/get
        """
        return self.business.get_favorites(
            session_id=self._get_session_id(x_session_id),
        )

    def ActionRentalDistrictListGet(self, request: Request):
        """
        获取所有区域列表
        GET /api/rental/district/list/get
        """
        return self.business.get_districts()
