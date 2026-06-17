from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel, Field
from app.business.farm import FarmerBusiness, ProductBusiness, OrderBusiness, ConsumerBusiness, StatsBusiness


class FarmerRegisterRequest(BaseModel):
    name: str = Field(..., description="姓名")
    phone: str = Field(..., description="手机号")
    password: str = Field(default='', description="密码")
    address: str = Field(..., description="地址")
    categories: str = Field(default='', description="种植品类，逗号分隔")
    certification: str = Field(default='none', description="认证信息: organic/green/pollution_free/none")
    certification_desc: str = Field(default='', description="认证说明")


class FarmerLoginRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(default='', description="密码")


class FarmerShopUpdateRequest(BaseModel):
    farmer_id: int = Field(..., ge=1, description="农户ID")
    shop_name: Optional[str] = Field(default=None, description="店铺名称")
    shop_description: Optional[str] = Field(default=None, description="店铺描述")


class ChangePasswordRequest(BaseModel):
    user_id: int = Field(..., ge=1, description="用户ID")
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., min_length=4, description="新密码（至少4位）")


class ConsumerRegisterRequest(BaseModel):
    name: str = Field(..., description="姓名")
    phone: str = Field(..., description="手机号")
    password: str = Field(default='', description="密码")
    address: str = Field(default='', description="配送地址")


class ConsumerLoginRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(default='', description="密码")


class ProductCreateRequest(BaseModel):
    farmer_id: int = Field(..., ge=1, description="农户ID")
    name: str = Field(..., description="产品名称")
    category: str = Field(..., description="产品品类")
    price: float = Field(..., gt=0, description="单价")
    unit: str = Field(default='jin', description="计价单位: jin/portion")
    stock: int = Field(default=0, ge=0, description="库存量")
    harvest_date: str = Field(default='', description="采摘日期")
    delivery_range: str = Field(default='', description="配送范围，逗号分隔")
    expected_delivery: str = Field(default='', description="预计送达时间")
    description: str = Field(default='', description="产品描述")
    image_url: str = Field(default='', description="产品图片")


class ProductUpdateRequest(BaseModel):
    product_id: int = Field(..., ge=1, description="产品ID")
    name: Optional[str] = Field(default=None, description="产品名称")
    category: Optional[str] = Field(default=None, description="产品品类")
    price: Optional[float] = Field(default=None, gt=0, description="单价")
    unit: Optional[str] = Field(default=None, description="计价单位")
    stock: Optional[int] = Field(default=None, ge=0, description="库存量")
    harvest_date: Optional[str] = Field(default=None, description="采摘日期")
    delivery_range: Optional[str] = Field(default=None, description="配送范围")
    expected_delivery: Optional[str] = Field(default=None, description="预计送达时间")
    description: Optional[str] = Field(default=None, description="产品描述")
    image_url: Optional[str] = Field(default=None, description="产品图片")
    is_active: Optional[int] = Field(default=None, description="是否上架")


class OrderCreateRequest(BaseModel):
    consumer_id: int = Field(..., ge=1, description="消费者ID")
    consumer_name: str = Field(..., description="收货人姓名")
    consumer_phone: str = Field(..., description="收货人电话")
    delivery_address: str = Field(..., description="配送地址")
    product_id: int = Field(..., ge=1, description="产品ID")
    quantity: int = Field(..., ge=1, description="购买数量")
    remark: str = Field(default='', description="备注")


class FarmController:
    def __init__(self):
        self.farmer_business = FarmerBusiness()
        self.product_business = ProductBusiness()
        self.order_business = OrderBusiness()
        self.consumer_business = ConsumerBusiness()
        self.stats_business = StatsBusiness()

    def ActionFarmFarmerRegisterPost(self, request: Request, body: FarmerRegisterRequest):
        """
        农户注册接口
        POST /api/farm/farmer/register
        填写姓名、地址、种植品类、认证信息，注册后等待管理员审核
        """
        return self.farmer_business.register(
            name=body.name, phone=body.phone, password=body.password,
            address=body.address, categories=body.categories,
            certification=body.certification, certification_desc=body.certification_desc
        )

    def ActionFarmFarmerLoginPost(self, request: Request, body: FarmerLoginRequest):
        """
        农户登录接口
        POST /api/farm/farmer/login
        """
        return self.farmer_business.login(phone=body.phone, password=body.password)

    def ActionFarmFarmerGet(self, request: Request, farmer_id: int = Query(..., ge=1, description="农户ID")):
        """
        获取农户详情接口
        GET /api/farm/farmer/get
        """
        return self.farmer_business.get_farmer(farmer_id)

    def ActionFarmFarmerPasswordChangePost(self, request: Request, body: ChangePasswordRequest):
        """
        农户修改密码接口
        POST /api/farm/farmer/password/change
        需要原密码和新密码（至少4位）
        """
        return self.farmer_business.change_password(
            farmer_id=body.user_id,
            old_password=body.old_password,
            new_password=body.new_password
        )

    def ActionFarmFarmerShopUpdatePost(self, request: Request, body: FarmerShopUpdateRequest):
        """
        更新农户店铺信息接口
        POST /api/farm/farmer/shop/update
        """
        return self.farmer_business.update_shop(
            farmer_id=body.farmer_id,
            shop_name=body.shop_name,
            shop_description=body.shop_description
        )

    def ActionFarmFarmerListGet(self, request: Request, status: str = Query(default=None, description="状态筛选")):
        """
        获取农户列表接口
        GET /api/farm/farmer/list/get
        """
        return self.farmer_business.list_all(status=status)

    def ActionFarmFarmerApprovePost(self, request: Request, farmer_id: int = Query(..., ge=1, description="农户ID")):
        """
        管理员审核通过农户接口
        POST /api/farm/farmer/approve
        """
        return self.farmer_business.approve(farmer_id)

    def ActionFarmFarmerRejectPost(self, request: Request, farmer_id: int = Query(..., ge=1, description="农户ID")):
        """
        管理员拒绝农户接口
        POST /api/farm/farmer/reject
        """
        return self.farmer_business.reject(farmer_id)

    def ActionFarmConsumerRegisterPost(self, request: Request, body: ConsumerRegisterRequest):
        """
        消费者注册接口
        POST /api/farm/consumer/register
        """
        return self.consumer_business.register(
            name=body.name, phone=body.phone, password=body.password, address=body.address
        )

    def ActionFarmConsumerLoginPost(self, request: Request, body: ConsumerLoginRequest):
        """
        消费者登录接口
        POST /api/farm/consumer/login
        """
        return self.consumer_business.login(phone=body.phone, password=body.password)

    def ActionFarmConsumerGet(self, request: Request, consumer_id: int = Query(..., ge=1, description="消费者ID")):
        """
        获取消费者信息接口
        GET /api/farm/consumer/get
        """
        return self.consumer_business.get_consumer(consumer_id)

    def ActionFarmConsumerPasswordChangePost(self, request: Request, body: ChangePasswordRequest):
        """
        消费者修改密码接口
        POST /api/farm/consumer/password/change
        需要原密码和新密码（至少4位）
        """
        return self.consumer_business.change_password(
            consumer_id=body.user_id,
            old_password=body.old_password,
            new_password=body.new_password
        )

    def ActionFarmProductAddPost(self, request: Request, body: ProductCreateRequest):
        """
        农户发布产品接口
        POST /api/farm/product/add
        品名、品类、单价、库存量、采摘日期、配送范围、预计送达时间
        """
        return self.product_business.create(
            farmer_id=body.farmer_id, name=body.name, category=body.category,
            price=body.price, unit=body.unit, stock=body.stock,
            harvest_date=body.harvest_date, delivery_range=body.delivery_range,
            expected_delivery=body.expected_delivery, description=body.description,
            image_url=body.image_url
        )

    def ActionFarmProductUpdatePost(self, request: Request, body: ProductUpdateRequest):
        """
        更新产品信息接口
        POST /api/farm/product/update
        """
        update_fields = {}
        if body.name is not None:
            update_fields['name'] = body.name
        if body.category is not None:
            update_fields['category'] = body.category
        if body.price is not None:
            update_fields['price'] = body.price
        if body.unit is not None:
            update_fields['unit'] = body.unit
        if body.stock is not None:
            update_fields['stock'] = body.stock
        if body.harvest_date is not None:
            update_fields['harvest_date'] = body.harvest_date
        if body.delivery_range is not None:
            update_fields['delivery_range'] = body.delivery_range
        if body.expected_delivery is not None:
            update_fields['expected_delivery'] = body.expected_delivery
        if body.description is not None:
            update_fields['description'] = body.description
        if body.image_url is not None:
            update_fields['image_url'] = body.image_url
        if body.is_active is not None:
            update_fields['is_active'] = body.is_active
        return self.product_business.update(body.product_id, **update_fields)

    def ActionFarmProductDelete(self, request: Request, product_id: int = Query(..., ge=1, description="产品ID")):
        """
        删除产品接口
        DELETE /api/farm/product/delete
        """
        return self.product_business.delete(product_id)

    def ActionFarmProductGet(self, request: Request, product_id: int = Query(..., ge=1, description="产品ID")):
        """
        获取产品详情接口
        GET /api/farm/product/get
        """
        return self.product_business.get_by_id(product_id)

    def ActionFarmProductFarmerGet(self, request: Request, farmer_id: int = Query(..., ge=1, description="农户ID")):
        """
        获取农户产品列表接口
        GET /api/farm/product/farmer/get
        """
        return self.product_business.get_by_farmer(farmer_id)

    def ActionFarmProductListGet(self, request: Request,
                                 category: str = Query(default=None, description="品类筛选"),
                                 delivery_range: str = Query(default=None, description="配送范围筛选")):
        """
        获取所有在售产品列表接口
        GET /api/farm/product/list/get
        消费者可按品类和配送范围筛选
        """
        return self.product_business.list_all(category=category, delivery_range=delivery_range)

    def ActionFarmProductFiltersGet(self, request: Request):
        """
        获取产品筛选条件接口
        GET /api/farm/product/filters/get
        """
        return self.product_business.get_filters()

    def ActionFarmOrderCreatePost(self, request: Request, body: OrderCreateRequest):
        """
        消费者下单接口
        POST /api/farm/order/create
        选择产品、数量、配送地址，在线支付后农户收到订单通知
        """
        return self.order_business.create(
            consumer_id=body.consumer_id, consumer_name=body.consumer_name,
            consumer_phone=body.consumer_phone, delivery_address=body.delivery_address,
            product_id=body.product_id, quantity=body.quantity, remark=body.remark
        )

    def ActionFarmOrderGet(self, request: Request, order_id: int = Query(..., ge=1, description="订单ID")):
        """
        获取订单详情接口
        GET /api/farm/order/get
        """
        return self.order_business.get_by_id(order_id)

    def ActionFarmOrderFarmerGet(self, request: Request,
                                 farmer_id: int = Query(..., ge=1, description="农户ID"),
                                 status: str = Query(default=None, description="订单状态筛选")):
        """
        获取农户订单列表接口
        GET /api/farm/order/farmer/get
        """
        return self.order_business.get_by_farmer(farmer_id, status=status)

    def ActionFarmOrderConsumerGet(self, request: Request,
                                   consumer_id: int = Query(..., ge=1, description="消费者ID"),
                                   status: str = Query(default=None, description="订单状态筛选")):
        """
        获取消费者订单列表接口
        GET /api/farm/order/consumer/get
        """
        return self.order_business.get_by_consumer(consumer_id, status=status)

    def ActionFarmOrderListGet(self, request: Request, status: str = Query(default=None, description="订单状态筛选")):
        """
        获取所有订单列表接口
        GET /api/farm/order/list/get
        """
        return self.order_business.get_all(status=status)

    def ActionFarmOrderAdvancePost(self, request: Request, order_id: int = Query(..., ge=1, description="订单ID")):
        """
        订单状态流转接口
        POST /api/farm/order/advance
        待确认→已接单→采摘中→配送中→已送达，农户手动推进
        """
        return self.order_business.advance_status(order_id)

    def ActionFarmOrderCancelPost(self, request: Request, order_id: int = Query(..., ge=1, description="订单ID")):
        """
        取消订单接口
        POST /api/farm/order/cancel
        """
        return self.order_business.cancel(order_id)

    def ActionFarmStatsOverviewGet(self, request: Request):
        """
        获取数据概览接口
        GET /api/farm/stats/overview/get
        """
        return self.stats_business.overview()

    def ActionFarmStatsCategorySalesGet(self, request: Request):
        """
        获取各品类销量统计接口
        GET /api/farm/stats/category/sales/get
        """
        return self.stats_business.category_sales()

    def ActionFarmStatsFarmerDeliveryGet(self, request: Request):
        """
        获取农户发货及时率排行接口
        GET /api/farm/stats/farmer/delivery/get
        """
        return self.stats_business.farmer_delivery_ranking()
