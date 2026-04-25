from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel, Field
from app.business.ims import (
    ContactBusiness, VarietyBusiness, PurchaseBusiness,
    SaleBusiness, InventoryBusiness, OperationLogBusiness, StatisticsBusiness
)


class ContactAddRequest(BaseModel):
    name: str = Field(..., description="姓名")
    phone: str = Field(default='', description="电话")
    wechat: str = Field(default='', description="微信")
    address: str = Field(default='', description="地址")
    type: str = Field(default='customer', description="类型: supplier-供应商, customer-客户")
    company: str = Field(default='', description="公司名")
    remark: str = Field(default='', description="备注")


class ContactUpdateRequest(BaseModel):
    id: int = Field(..., ge=1, description="联系人ID")
    name: Optional[str] = Field(default=None, description="姓名")
    phone: Optional[str] = Field(default=None, description="电话")
    wechat: Optional[str] = Field(default=None, description="微信")
    address: Optional[str] = Field(default=None, description="地址")
    type: Optional[str] = Field(default=None, description="类型: supplier-供应商, customer-客户")
    company: Optional[str] = Field(default=None, description="公司名")
    remark: Optional[str] = Field(default=None, description="备注")


class VarietyAddRequest(BaseModel):
    name: str = Field(..., description="品种名称")
    image_url: str = Field(default='', description="图片URL")
    description: str = Field(default='', description="图文介绍")
    flowering_period: str = Field(default='', description="花期")
    care_instructions: str = Field(default='', description="养护说明")


class VarietyUpdateRequest(BaseModel):
    id: int = Field(..., ge=1, description="品种ID")
    name: Optional[str] = Field(default=None, description="品种名称")
    image_url: Optional[str] = Field(default=None, description="图片URL")
    description: Optional[str] = Field(default=None, description="图文介绍")
    flowering_period: Optional[str] = Field(default=None, description="花期")
    care_instructions: Optional[str] = Field(default=None, description="养护说明")


class PurchaseAddRequest(BaseModel):
    variety_id: int = Field(..., ge=1, description="品种ID")
    unit_price: float = Field(..., ge=0, description="单价")
    quantity: int = Field(..., ge=1, description="数量")
    purchase_date: Optional[str] = Field(default=None, description="进货日期，格式: YYYY-MM-DD")
    supplier_id: int = Field(default=0, description="供应商ID")
    remark: str = Field(default='', description="备注")


class PurchaseUpdateRequest(BaseModel):
    id: int = Field(..., ge=1, description="进货记录ID")
    variety_id: Optional[int] = Field(default=None, ge=1, description="品种ID")
    unit_price: Optional[float] = Field(default=None, ge=0, description="单价")
    quantity: Optional[int] = Field(default=None, ge=1, description="数量")
    purchase_date: Optional[str] = Field(default=None, description="进货日期，格式: YYYY-MM-DD")
    supplier_id: Optional[int] = Field(default=None, description="供应商ID")
    remark: Optional[str] = Field(default=None, description="备注")


class SaleAddRequest(BaseModel):
    variety_id: int = Field(..., ge=1, description="品种ID")
    unit_price: float = Field(..., ge=0, description="单价")
    quantity: int = Field(..., ge=1, description="数量")
    sale_location: str = Field(default='', description="销售地")
    customer_id: int = Field(default=0, description="客户ID")
    sale_date: Optional[str] = Field(default=None, description="销售日期，格式: YYYY-MM-DD")
    remark: str = Field(default='', description="备注")


class SaleUpdateRequest(BaseModel):
    id: int = Field(..., ge=1, description="销售记录ID")
    variety_id: Optional[int] = Field(default=None, ge=1, description="品种ID")
    unit_price: Optional[float] = Field(default=None, ge=0, description="单价")
    quantity: Optional[int] = Field(default=None, ge=1, description="数量")
    sale_location: Optional[str] = Field(default=None, description="销售地")
    customer_id: Optional[int] = Field(default=None, description="客户ID")
    sale_date: Optional[str] = Field(default=None, description="销售日期，格式: YYYY-MM-DD")
    remark: Optional[str] = Field(default=None, description="备注")


class InventoryUpdateRequest(BaseModel):
    id: int = Field(..., ge=1, description="库存记录ID")
    current_quantity: Optional[int] = Field(default=None, ge=0, description="当前数量")
    purchase_location: Optional[str] = Field(default=None, description="进货地")
    avg_cost_price: Optional[float] = Field(default=None, ge=0, description="成本均价")
    total_cost: Optional[float] = Field(default=None, ge=0, description="总库存成本")
    warning_threshold: Optional[int] = Field(default=None, ge=0, description="库存预警阈值")


class ImsController:
    def __init__(self):
        self.contact_business = ContactBusiness()
        self.variety_business = VarietyBusiness()
        self.purchase_business = PurchaseBusiness()
        self.sale_business = SaleBusiness()
        self.inventory_business = InventoryBusiness()
        self.operation_log_business = OperationLogBusiness()
        self.statistics_business = StatisticsBusiness()

    def ActionImsContactListGet(self, request: Request,
                                  type: str = Query(default=None, description="类型: supplier-供应商, customer-客户"),
                                  page: int = Query(default=1, ge=1, description="页码"),
                                  page_size: int = Query(default=10, ge=1, le=100, description="每页数量"),
                                  keyword: str = Query(default=None, description="搜索关键词")):
        """
        获取联系方式列表接口
        GET /api/ims/contact/list/get
        返回联系方式列表，支持分页、类型过滤和关键词搜索
        """
        return self.contact_business.get_contact_list(
            type=type,
            page=page,
            page_size=page_size,
            keyword=keyword
        )

    def ActionImsContactItemGet(self, request: Request,
                                 id: int = Query(..., ge=1, description="联系人ID")):
        """
        获取单个联系方式接口
        GET /api/ims/contact/item/get
        根据ID获取单个联系人详情
        """
        return self.contact_business.get_contact_by_id(id)

    def ActionImsContactAddPost(self, request: Request, body: ContactAddRequest):
        """
        添加联系方式接口
        POST /api/ims/contact/add
        添加新的联系人（供应商或客户）
        """
        return self.contact_business.add_contact(
            name=body.name,
            phone=body.phone,
            wechat=body.wechat,
            address=body.address,
            type=body.type,
            company=body.company,
            remark=body.remark
        )

    def ActionImsContactUpdatePost(self, request: Request, body: ContactUpdateRequest):
        """
        更新联系方式接口
        POST /api/ims/contact/update
        更新联系人信息
        """
        return self.contact_business.update_contact(
            record_id=body.id,
            name=body.name,
            phone=body.phone,
            wechat=body.wechat,
            address=body.address,
            type=body.type,
            company=body.company,
            remark=body.remark
        )

    def ActionImsContactDelete(self, request: Request,
                                id: int = Query(..., ge=1, description="联系人ID")):
        """
        删除联系方式接口
        DELETE /api/ims/contact/delete
        根据ID删除联系人
        """
        return self.contact_business.delete_contact(id)

    def ActionImsSupplierListGet(self, request: Request,
                                  page: int = Query(default=1, ge=1, description="页码"),
                                  page_size: int = Query(default=10, ge=1, le=100, description="每页数量"),
                                  keyword: str = Query(default=None, description="搜索关键词")):
        """
        获取供应商列表接口
        GET /api/ims/supplier/list/get
        返回供应商列表
        """
        return self.contact_business.get_suppliers(
            page=page,
            page_size=page_size,
            keyword=keyword
        )

    def ActionImsSupplierAllGet(self, request: Request):
        """
        获取所有供应商接口（不分页）
        GET /api/ims/supplier/all/get
        返回所有供应商列表，用于下拉选择等场景
        """
        return self.contact_business.get_all_suppliers()

    def ActionImsCustomerListGet(self, request: Request,
                                  page: int = Query(default=1, ge=1, description="页码"),
                                  page_size: int = Query(default=10, ge=1, le=100, description="每页数量"),
                                  keyword: str = Query(default=None, description="搜索关键词")):
        """
        获取客户列表接口
        GET /api/ims/customer/list/get
        返回客户列表
        """
        return self.contact_business.get_customers(
            page=page,
            page_size=page_size,
            keyword=keyword
        )

    def ActionImsCustomerAllGet(self, request: Request):
        """
        获取所有客户接口（不分页）
        GET /api/ims/customer/all/get
        返回所有客户列表，用于下拉选择等场景
        """
        return self.contact_business.get_all_customers()

    def ActionImsVarietyListGet(self, request: Request,
                                  page: int = Query(default=1, ge=1, description="页码"),
                                  page_size: int = Query(default=10, ge=1, le=100, description="每页数量"),
                                  keyword: str = Query(default=None, description="搜索关键词")):
        """
        获取牡丹品种列表接口
        GET /api/ims/variety/list/get
        返回牡丹品种列表，支持分页和关键词搜索
        """
        return self.variety_business.get_variety_list(
            page=page,
            page_size=page_size,
            keyword=keyword
        )

    def ActionImsVarietyAllGet(self, request: Request):
        """
        获取所有品种接口（不分页）
        GET /api/ims/variety/all/get
        返回所有品种列表，用于下拉选择等场景
        """
        return self.variety_business.get_all_varieties()

    def ActionImsVarietyItemGet(self, request: Request,
                                 id: int = Query(..., ge=1, description="品种ID")):
        """
        获取单个品种接口
        GET /api/ims/variety/item/get
        根据ID获取单个品种详情
        """
        return self.variety_business.get_variety_by_id(id)

    def ActionImsVarietyAddPost(self, request: Request, body: VarietyAddRequest):
        """
        添加品种接口
        POST /api/ims/variety/add
        添加新的牡丹品种
        """
        return self.variety_business.add_variety(
            name=body.name,
            image_url=body.image_url,
            description=body.description,
            flowering_period=body.flowering_period,
            care_instructions=body.care_instructions
        )

    def ActionImsVarietyUpdatePost(self, request: Request, body: VarietyUpdateRequest):
        """
        更新品种接口
        POST /api/ims/variety/update
        更新品种信息
        """
        return self.variety_business.update_variety(
            record_id=body.id,
            name=body.name,
            image_url=body.image_url,
            description=body.description,
            flowering_period=body.flowering_period,
            care_instructions=body.care_instructions
        )

    def ActionImsVarietyDelete(self, request: Request,
                                id: int = Query(..., ge=1, description="品种ID")):
        """
        删除品种接口
        DELETE /api/ims/variety/delete
        根据ID删除品种
        """
        return self.variety_business.delete_variety(id)

    def ActionImsPurchaseListGet(self, request: Request,
                                  page: int = Query(default=1, ge=1, description="页码"),
                                  page_size: int = Query(default=10, ge=1, le=100, description="每页数量"),
                                  variety_id: int = Query(default=None, ge=1, description="品种ID"),
                                  supplier_id: int = Query(default=None, ge=1, description="供应商ID"),
                                  start_date: str = Query(default=None, description="开始日期，格式: YYYY-MM-DD"),
                                  end_date: str = Query(default=None, description="结束日期，格式: YYYY-MM-DD"),
                                  keyword: str = Query(default=None, description="搜索关键词")):
        """
        获取进货列表接口
        GET /api/ims/purchase/list/get
        返回进货记录列表，支持分页、品种筛选、供应商筛选、日期范围和关键词搜索
        """
        return self.purchase_business.get_purchase_list(
            page=page,
            page_size=page_size,
            variety_id=variety_id,
            supplier_id=supplier_id,
            start_date=start_date,
            end_date=end_date,
            keyword=keyword
        )

    def ActionImsPurchaseItemGet(self, request: Request,
                                 id: int = Query(..., ge=1, description="进货记录ID")):
        """
        获取单个进货记录接口
        GET /api/ims/purchase/item/get
        根据ID获取单个进货记录详情
        """
        return self.purchase_business.get_purchase_by_id(id)

    def ActionImsPurchaseAddPost(self, request: Request, body: PurchaseAddRequest):
        """
        添加进货接口
        POST /api/ims/purchase/add
        记录进货，自动更新库存
        """
        return self.purchase_business.add_purchase(
            variety_id=body.variety_id,
            unit_price=body.unit_price,
            quantity=body.quantity,
            purchase_date=body.purchase_date,
            supplier_id=body.supplier_id,
            remark=body.remark
        )

    def ActionImsPurchaseUpdatePost(self, request: Request, body: PurchaseUpdateRequest):
        """
        更新进货记录接口
        POST /api/ims/purchase/update
        更新进货记录信息
        """
        return self.purchase_business.update_purchase(
            record_id=body.id,
            variety_id=body.variety_id,
            unit_price=body.unit_price,
            quantity=body.quantity,
            purchase_date=body.purchase_date,
            supplier_id=body.supplier_id,
            remark=body.remark
        )

    def ActionImsPurchaseDelete(self, request: Request,
                                id: int = Query(..., ge=1, description="进货记录ID")):
        """
        删除进货记录接口
        DELETE /api/ims/purchase/delete
        根据ID删除进货记录
        """
        return self.purchase_business.delete_purchase(id)

    def ActionImsSaleListGet(self, request: Request,
                              page: int = Query(default=1, ge=1, description="页码"),
                              page_size: int = Query(default=10, ge=1, le=100, description="每页数量"),
                              variety_id: int = Query(default=None, ge=1, description="品种ID"),
                              customer_id: int = Query(default=None, ge=1, description="客户ID"),
                              start_date: str = Query(default=None, description="开始日期，格式: YYYY-MM-DD"),
                              end_date: str = Query(default=None, description="结束日期，格式: YYYY-MM-DD"),
                              keyword: str = Query(default=None, description="搜索关键词")):
        """
        获取销售列表接口
        GET /api/ims/sale/list/get
        返回销售记录列表，支持分页、品种筛选、客户筛选、日期范围和关键词搜索
        """
        return self.sale_business.get_sale_list(
            page=page,
            page_size=page_size,
            variety_id=variety_id,
            customer_id=customer_id,
            start_date=start_date,
            end_date=end_date,
            keyword=keyword
        )

    def ActionImsSaleItemGet(self, request: Request,
                             id: int = Query(..., ge=1, description="销售记录ID")):
        """
        获取单个销售记录接口
        GET /api/ims/sale/item/get
        根据ID获取单个销售记录详情
        """
        return self.sale_business.get_sale_by_id(id)

    def ActionImsSaleAddPost(self, request: Request, body: SaleAddRequest):
        """
        添加销售接口
        POST /api/ims/sale/add
        记录销售，自动检查并更新库存
        """
        return self.sale_business.add_sale(
            variety_id=body.variety_id,
            unit_price=body.unit_price,
            quantity=body.quantity,
            sale_location=body.sale_location,
            customer_id=body.customer_id,
            sale_date=body.sale_date,
            remark=body.remark
        )

    def ActionImsSaleUpdatePost(self, request: Request, body: SaleUpdateRequest):
        """
        更新销售记录接口
        POST /api/ims/sale/update
        更新销售记录信息
        """
        return self.sale_business.update_sale(
            record_id=body.id,
            variety_id=body.variety_id,
            unit_price=body.unit_price,
            quantity=body.quantity,
            sale_location=body.sale_location,
            customer_id=body.customer_id,
            sale_date=body.sale_date,
            remark=body.remark
        )

    def ActionImsSaleDelete(self, request: Request,
                            id: int = Query(..., ge=1, description="销售记录ID")):
        """
        删除销售记录接口
        DELETE /api/ims/sale/delete
        根据ID删除销售记录
        """
        return self.sale_business.delete_sale(id)

    def ActionImsInventoryListGet(self, request: Request,
                                   page: int = Query(default=1, ge=1, description="页码"),
                                   page_size: int = Query(default=10, ge=1, le=100, description="每页数量"),
                                   variety_id: int = Query(default=None, ge=1, description="品种ID"),
                                   show_warning: bool = Query(default=False, description="是否只显示库存预警"),
                                   keyword: str = Query(default=None, description="搜索关键词")):
        """
        获取库存列表接口
        GET /api/ims/inventory/list/get
        返回库存列表，支持分页、品种筛选、仅显示预警和关键词搜索
        """
        return self.inventory_business.get_inventory_list(
            page=page,
            page_size=page_size,
            variety_id=variety_id,
            show_warning=show_warning,
            keyword=keyword
        )

    def ActionImsInventoryItemGet(self, request: Request,
                                  id: int = Query(..., ge=1, description="库存记录ID")):
        """
        获取单个库存记录接口
        GET /api/ims/inventory/item/get
        根据ID获取单个库存记录详情
        """
        return self.inventory_business.get_inventory_by_id(id)

    def ActionImsInventoryByVarietyGet(self, request: Request,
                                        variety_id: int = Query(..., ge=1, description="品种ID")):
        """
        根据品种获取库存接口
        GET /api/ims/inventory/by_variety/get
        根据品种ID获取该品种的库存信息
        """
        return self.inventory_business.get_inventory_by_variety(variety_id)

    def ActionImsInventoryUpdatePost(self, request: Request, body: InventoryUpdateRequest):
        """
        更新库存接口
        POST /api/ims/inventory/update
        更新库存信息
        """
        return self.inventory_business.update_inventory(
            record_id=body.id,
            current_quantity=body.current_quantity,
            purchase_location=body.purchase_location,
            avg_cost_price=body.avg_cost_price,
            total_cost=body.total_cost,
            warning_threshold=body.warning_threshold
        )

    def ActionImsInventoryDelete(self, request: Request,
                                  id: int = Query(..., ge=1, description="库存记录ID")):
        """
        删除库存记录接口
        DELETE /api/ims/inventory/delete
        根据ID删除库存记录
        """
        return self.inventory_business.delete_inventory(id)

    def ActionImsInventoryWarningGet(self, request: Request):
        """
        获取库存预警列表接口
        GET /api/ims/inventory/warning/get
        返回所有库存预警的品种列表
        """
        return self.inventory_business.get_warning_items()

    def ActionImsStatisticsTodayGet(self, request: Request):
        """
        获取今日统计数据接口
        GET /api/ims/statistics/today/get
        返回今日进货、今日销售、总库存、总利润等统计数据
        """
        return self.statistics_business.get_today_statistics()

    def ActionImsStatisticsDashboardGet(self, request: Request):
        """
        获取仪表盘统计数据接口
        GET /api/ims/statistics/dashboard/get
        返回仪表盘所需的简化统计数据
        """
        return self.statistics_business.get_dashboard_statistics()

    def ActionImsStatisticsRangeGet(self, request: Request,
                                     start_date: str = Query(..., description="开始日期，格式: YYYY-MM-DD"),
                                     end_date: str = Query(..., description="结束日期，格式: YYYY-MM-DD")):
        """
        获取日期范围统计数据接口
        GET /api/ims/statistics/range/get
        返回指定日期范围内的进货、销售、利润统计
        """
        return self.statistics_business.get_range_statistics(start_date, end_date)

    def ActionImsStatisticsTrendGet(self, request: Request,
                                     start_date: str = Query(..., description="开始日期，格式: YYYY-MM-DD"),
                                     end_date: str = Query(..., description="结束日期，格式: YYYY-MM-DD")):
        """
        获取趋势图表数据接口
        GET /api/ims/statistics/trend/get
        返回每日进货、销售、利润趋势数据，用于折线图展示
        """
        return self.statistics_business.get_trend_chart_data(start_date, end_date)

    def ActionImsStatisticsPurchaseVarietyGet(self, request: Request,
                                                start_date: str = Query(default=None, description="开始日期，格式: YYYY-MM-DD"),
                                                end_date: str = Query(default=None, description="结束日期，格式: YYYY-MM-DD")):
        """
        获取进货品种分布图表数据接口
        GET /api/ims/statistics/purchase_variety/get
        返回各品种进货金额和数量统计，用于柱状图和饼图展示
        """
        return self.statistics_business.get_purchase_variety_chart(start_date, end_date)

    def ActionImsStatisticsSaleVarietyGet(self, request: Request,
                                            start_date: str = Query(default=None, description="开始日期，格式: YYYY-MM-DD"),
                                            end_date: str = Query(default=None, description="结束日期，格式: YYYY-MM-DD")):
        """
        获取销售品种分布图表数据接口
        GET /api/ims/statistics/sale_variety/get
        返回各品种销售金额和数量统计，用于柱状图和饼图展示
        """
        return self.statistics_business.get_sale_variety_chart(start_date, end_date)

    def ActionImsStatisticsInventoryDistributionGet(self, request: Request):
        """
        获取库存品种分布图表数据接口
        GET /api/ims/statistics/inventory_distribution/get
        返回各品种库存数量和成本分布，用于饼图展示
        """
        return self.statistics_business.get_inventory_distribution_chart()

    def ActionImsLogListGet(self, request: Request,
                             page: int = Query(default=1, ge=1, description="页码"),
                             page_size: int = Query(default=10, ge=1, le=100, description="每页数量"),
                             operation_type: str = Query(default=None, description="操作类型: purchase, sale, update, delete, create"),
                             module: str = Query(default=None, description="模块: contact, variety, purchase, sale, inventory"),
                             start_date: str = Query(default=None, description="开始日期，格式: YYYY-MM-DD"),
                             end_date: str = Query(default=None, description="结束日期，格式: YYYY-MM-DD"),
                             keyword: str = Query(default=None, description="搜索关键词")):
        """
        获取操作日志列表接口
        GET /api/ims/log/list/get
        返回操作日志列表，支持分页、类型筛选、模块筛选、日期范围和关键词搜索
        """
        return self.operation_log_business.get_log_list(
            page=page,
            page_size=page_size,
            operation_type=operation_type,
            module=module,
            start_date=start_date,
            end_date=end_date,
            keyword=keyword
        )

    def ActionImsLogItemGet(self, request: Request,
                            id: int = Query(..., ge=1, description="日志ID")):
        """
        获取单个操作日志接口
        GET /api/ims/log/item/get
        根据ID获取单个操作日志详情
        """
        return self.operation_log_business.get_log_by_id(id)
