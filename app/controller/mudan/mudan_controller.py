from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel, Field
from app.business.mudan import BannerBusiness, TabBusiness, TabDetailBusiness, CommercialBusiness


class BannerItem(BaseModel):
    image_url: str = Field(..., description="图片链接")
    jump_url: str = Field(default='', description="跳转链接")


class BannerSetRequest(BaseModel):
    banners: List[BannerItem] = Field(..., description="Banner列表，全量更新")


class BannerConfigSetRequest(BaseModel):
    aspect_ratio: Optional[str] = Field(default=None, description="整体宽高比，如16:9, 4:3, 1:1")
    auto_play: Optional[bool] = Field(default=None, description="是否自动播放")
    interval: Optional[int] = Field(default=None, description="自动播放间隔（毫秒）")


class TabSetRequest(BaseModel):
    tab_id: Optional[int] = Field(default=None, description="Tab ID，不填则为新增")
    tab_name: str = Field(..., description="Tab名称")
    sort_order: Optional[int] = Field(default=0, description="排序顺序")


class TabDetailSetRequest(BaseModel):
    tab_id: int = Field(..., description="Tab ID，1=牡丹简介, 2=城市文旅, 3=牡丹文化故事")
    title: Optional[str] = Field(default='', description="标题")
    content: Optional[str] = Field(default='', description="内容（富文本）")


class ProductItem(BaseModel):
    name: str = Field(..., description="产品名称")
    price: float = Field(default=0.0, description="价格")
    quantity: int = Field(default=0, description="数量")
    description: str = Field(default='', description="描述")
    image_url: str = Field(default='', description="图片链接")


class ProductAddRequest(BaseModel):
    name: str = Field(..., description="产品名称")
    price: float = Field(default=0.0, description="价格")
    quantity: int = Field(default=0, description="数量")
    description: str = Field(default='', description="描述")
    image_url: str = Field(default='', description="图片链接")


class ProductUpdateRequest(BaseModel):
    id: int = Field(..., description="产品ID")
    name: Optional[str] = Field(default=None, description="产品名称")
    price: Optional[float] = Field(default=None, description="价格")
    quantity: Optional[int] = Field(default=None, description="数量")
    description: Optional[str] = Field(default=None, description="描述")
    image_url: Optional[str] = Field(default=None, description="图片链接")


class ContactInfo(BaseModel):
    phone: str = Field(default='', description="电话号码")
    wechat: str = Field(default='', description="微信联系方式")


class CommercialSetRequest(BaseModel):
    contact: Optional[ContactInfo] = Field(default=None, description="联系方式")
    products: Optional[List[ProductItem]] = Field(default=None, description="产品列表，全量更新")


class MudanController:
    def __init__(self):
        self.banner_business = BannerBusiness()
        self.tab_business = TabBusiness()
        self.tab_detail_business = TabDetailBusiness()
        self.commercial_business = CommercialBusiness()

    def ActionMudanHomeGet(self, request: Request):
        """
        获取首页接口
        GET /api/mudan/home/get
        返回首页数据，目前只包含banner数据
        """
        banner_result = self.banner_business.get_banners()
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'banners': banner_result.get('data', [])
            }
        }

    def ActionMudanBannerSet(self, request: Request, body: BannerSetRequest):
        """
        设置banner接口
        POST /api/mudan/banner/set
        参数是个数组，每个元素是个对象，包含图片链接、跳转链接，更新时全量更新
        """
        banners_data = []
        for item in body.banners:
            banners_data.append({
                'image_url': item.image_url,
                'jump_url': item.jump_url
            })
        
        return self.banner_business.set_banners(banners_data)

    def ActionMudanBannerGet(self, request: Request):
        """
        获取banner列表接口
        GET /api/mudan/banner/get
        返回所有banner数据列表
        """
        return self.banner_business.get_banners()

    def ActionMudanTabListGet(self, request: Request):
        """
        获取Tab列表接口
        GET /api/mudan/tab/list/get
        返回所有Tab的列表，包含tab_name和tab_id
        """
        return self.tab_business.get_tabs()

    def ActionMudanTabListSet(self, request: Request, body: TabSetRequest):
        """
        设置Tab接口（新增或更新）
        POST /api/mudan/tab/list/set
        不填tab_id就是新增，填上就是更新
        """
        return self.tab_business.set_tab(
            tab_id=body.tab_id,
            tab_name=body.tab_name,
            sort_order=body.sort_order
        )

    def ActionMudanTabDetailGet(self, request: Request, tab_id: int = Query(..., ge=1, description="Tab ID: 1=牡丹简介, 2=城市文旅, 3=牡丹文化故事")):
        """
        获取Tab详情接口
        GET /api/mudan/tab/detail/get
        参数: tab_id - 1=牡丹简介(富文本), 2=城市文旅, 3=牡丹文化故事(标题可配置，内容富文本)
        """
        return self.tab_detail_business.get_tab_detail(tab_id)

    def ActionMudanTabDetailSet(self, request: Request, body: TabDetailSetRequest):
        """
        设置Tab详情接口
        POST /api/mudan/tab/detail/set
        tab_id=1: 牡丹简介（富文本）
        tab_id=2: 城市文旅（标题和内容可配置）
        tab_id=3: 牡丹文化故事（标题可配置，内容是富文本的）
        """
        return self.tab_detail_business.set_tab_detail(
            tab_id=body.tab_id,
            title=body.title,
            content=body.content
        )

    def ActionMudanCommercialGet(self, request: Request):
        """
        获取商业服务接口
        GET /api/mudan/commercial/get
        tab_id=4的商业服务接口，包含两个模块数据：
        a. 牡丹特色: 牡丹产品动态添加，支持List，列表展示
        b. 与我联系: 电话号码和微信联系方式
        """
        return self.commercial_business.get_commercial()

    def ActionMudanCommercialSet(self, request: Request, body: CommercialSetRequest):
        """
        设置商业服务接口
        POST /api/mudan/commercial/set
        可设置联系方式和产品列表，产品列表全量更新
        """
        contact_data = None
        if body.contact:
            contact_data = {
                'phone': body.contact.phone,
                'wechat': body.contact.wechat
            }
        
        products_data = None
        if body.products is not None:
            products_data = []
            for item in body.products:
                products_data.append({
                    'name': item.name,
                    'price': item.price,
                    'quantity': item.quantity,
                    'description': item.description,
                    'image_url': item.image_url
                })
        
        return self.commercial_business.set_commercial(
            contact=contact_data,
            products=products_data
        )

    def ActionMudanTabListDelete(self, request: Request, tab_id: int = Query(..., ge=1, description="要删除的Tab ID")):
        """
        删除Tab接口
        DELETE /api/mudan/tab/list/delete
        参数: tab_id - 要删除的Tab ID
        """
        return self.tab_business.delete_tab(tab_id)

    def ActionMudanBannerDelete(self, request: Request, id: int = Query(..., ge=1, description="要删除的Banner ID")):
        """
        删除Banner接口
        DELETE /api/mudan/banner/delete
        参数: id - 要删除的Banner ID
        """
        return self.banner_business.delete_banner(id)

    def ActionMudanBannerConfigGet(self, request: Request):
        """
        获取Banner配置接口
        GET /api/mudan/banner/config/get
        返回Banner整体配置，包括宽高比、自动播放设置等
        """
        return self.banner_business.get_banner_config()

    def ActionMudanBannerConfigSet(self, request: Request, body: BannerConfigSetRequest):
        """
        设置Banner配置接口
        POST /api/mudan/banner/config/set
        设置Banner整体配置：
        - aspect_ratio: 整体宽高比（如16:9, 4:3, 1:1）
        - auto_play: 是否自动播放
        - interval: 自动播放间隔（毫秒）
        """
        return self.banner_business.set_banner_config(
            aspect_ratio=body.aspect_ratio,
            auto_play=body.auto_play,
            interval=body.interval
        )

    def ActionMudanCommercialContactGet(self, request: Request):
        """
        获取联系方式接口（tab_id=4商业服务-与我联系）
        GET /api/mudan/commercial/contact/get
        返回电话号码和微信联系方式
        """
        return self.commercial_business.get_contact()

    def ActionMudanCommercialContactSet(self, request: Request, body: ContactInfo):
        """
        设置联系方式接口（tab_id=4商业服务-与我联系）
        POST /api/mudan/commercial/contact/set
        设置电话号码和微信联系方式
        """
        return self.commercial_business.set_contact(
            phone=body.phone,
            wechat=body.wechat
        )

    def ActionMudanCommercialProductsGet(self, request: Request):
        """
        获取产品列表接口（tab_id=4商业服务-牡丹特色）
        GET /api/mudan/commercial/products/get
        返回牡丹产品列表
        """
        return self.commercial_business.get_products()

    def ActionMudanCommercialProductGet(self, request: Request, id: int = Query(..., ge=1, description="产品ID")):
        """
        获取单个产品接口（tab_id=4商业服务-牡丹特色）
        GET /api/mudan/commercial/product/get
        参数: id - 产品ID
        """
        return self.commercial_business.get_product_by_id(id)

    def ActionMudanCommercialProductAdd(self, request: Request, body: ProductAddRequest):
        """
        添加单个产品接口（tab_id=4商业服务-牡丹特色）
        POST /api/mudan/commercial/product/add
        动态添加牡丹产品，支持单个添加
        """
        return self.commercial_business.add_product(
            name=body.name,
            price=body.price,
            quantity=body.quantity,
            description=body.description,
            image_url=body.image_url
        )

    def ActionMudanCommercialProductUpdate(self, request: Request, body: ProductUpdateRequest):
        """
        更新单个产品接口（tab_id=4商业服务-牡丹特色）
        POST /api/mudan/commercial/product/update
        更新单个牡丹产品信息
        """
        return self.commercial_business.update_product(
            record_id=body.id,
            name=body.name,
            price=body.price,
            quantity=body.quantity,
            description=body.description,
            image_url=body.image_url
        )

    def ActionMudanCommercialProductDelete(self, request: Request, id: int = Query(..., ge=1, description="产品ID")):
        """
        删除单个产品接口（tab_id=4商业服务-牡丹特色）
        DELETE /api/mudan/commercial/product/delete
        参数: id - 要删除的产品ID
        """
        return self.commercial_business.delete_product(id)
