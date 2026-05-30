from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel, Field
from app.business.heka_model import HekaBusiness, CardBusiness


class StickerItem(BaseModel):
    id: int = Field(..., description="贴纸ID")
    x: int = Field(..., description="X坐标")
    y: int = Field(..., description="Y坐标")
    scale: float = Field(default=1.0, description="缩放比例")


class CardCreateRequest(BaseModel):
    holiday_id: int = Field(..., ge=1, description="节日ID")
    template_id: int = Field(..., ge=1, description="模板ID")
    background_id: Optional[int] = Field(default=0, description="背景ID")
    title: Optional[str] = Field(default='', description="标题")
    message: Optional[str] = Field(default='', description="祝福语")
    signature: Optional[str] = Field(default='', description="署名")
    date: Optional[str] = Field(default='', description="日期")
    font_family: Optional[str] = Field(default='Arial', description="字体")
    font_size: Optional[int] = Field(default=24, description="字号")
    font_color: Optional[str] = Field(default='#000000', description="字体颜色")
    stickers: Optional[List[StickerItem]] = Field(default=None, description="贴纸列表")
    image_url: Optional[str] = Field(default='', description="贺卡图片URL")


class CardUpdateRequest(BaseModel):
    id: int = Field(..., ge=1, description="贺卡ID")
    holiday_id: Optional[int] = Field(default=None, ge=1, description="节日ID")
    template_id: Optional[int] = Field(default=None, ge=1, description="模板ID")
    background_id: Optional[int] = Field(default=None, description="背景ID")
    title: Optional[str] = Field(default=None, description="标题")
    message: Optional[str] = Field(default=None, description="祝福语")
    signature: Optional[str] = Field(default=None, description="署名")
    date: Optional[str] = Field(default=None, description="日期")
    font_family: Optional[str] = Field(default=None, description="字体")
    font_size: Optional[int] = Field(default=None, description="字号")
    font_color: Optional[str] = Field(default=None, description="字体颜色")
    stickers: Optional[List[StickerItem]] = Field(default=None, description="贴纸列表")
    image_url: Optional[str] = Field(default=None, description="贺卡图片URL")


class HekaController:
    def __init__(self):
        self.heka_business = HekaBusiness()
        self.card_business = CardBusiness()

    def ActionHekaHolidayListGet(self, request: Request):
        """
        获取节日列表接口
        GET /api/heka/holiday/list/get
        返回所有可用的节日类型列表
        """
        return self.heka_business.get_holidays()

    def ActionHekaHolidayDetailGet(self, request: Request, id: int = Query(..., ge=1, description="节日ID")):
        """
        获取单个节日详情接口
        GET /api/heka/holiday/detail/get
        参数: id - 节日ID
        """
        return self.heka_business.get_holiday_by_id(id)

    def ActionHekaTemplateListGet(self, request: Request, holiday_id: int = Query(..., ge=1, description="节日ID")):
        """
        获取节日模板列表接口
        GET /api/heka/template/list/get
        参数: holiday_id - 节日ID
        """
        return self.heka_business.get_templates_by_holiday(holiday_id)

    def ActionHekaStickerListGet(self, request: Request, holiday_id: int = Query(..., ge=1, description="节日ID")):
        """
        获取节日贴纸列表接口
        GET /api/heka/sticker/list/get
        参数: holiday_id - 节日ID
        """
        return self.heka_business.get_stickers_by_holiday(holiday_id)

    def ActionHekaBackgroundListGet(self, request: Request, holiday_id: int = Query(..., ge=1, description="节日ID")):
        """
        获取节日背景列表接口
        GET /api/heka/background/list/get
        参数: holiday_id - 节日ID
        """
        return self.heka_business.get_backgrounds_by_holiday(holiday_id)

    def ActionHekaHolidayAllDataGet(self, request: Request, holiday_id: int = Query(..., ge=1, description="节日ID")):
        """
        获取节日全部数据接口
        GET /api/heka/holiday/all/data/get
        参数: holiday_id - 节日ID
        返回节日详情、模板列表、贴纸列表、背景列表
        """
        return self.heka_business.get_holiday_all_data(holiday_id)

    def ActionHekaCardCreatePost(self, request: Request, body: CardCreateRequest):
        """
        创建贺卡接口
        POST /api/heka/card/create
        创建新的贺卡，保存贺卡配置
        """
        stickers_data = None
        if body.stickers:
            stickers_data = [s.dict() for s in body.stickers]

        return self.card_business.create_card(
            holiday_id=body.holiday_id,
            template_id=body.template_id,
            background_id=body.background_id,
            title=body.title,
            message=body.message,
            signature=body.signature,
            date=body.date,
            font_family=body.font_family,
            font_size=body.font_size,
            font_color=body.font_color,
            stickers=stickers_data,
            image_url=body.image_url
        )

    def ActionHekaCardDetailGet(self, request: Request, id: int = Query(..., ge=1, description="贺卡ID")):
        """
        获取贺卡详情接口
        GET /api/heka/card/detail/get
        参数: id - 贺卡ID
        """
        return self.card_business.get_card_by_id(id)

    def ActionHekaCardShareGet(self, request: Request, share_code: str = Query(..., description="分享码")):
        """
        通过分享码获取贺卡接口
        GET /api/heka/card/share/get
        参数: share_code - 分享码
        """
        return self.card_business.get_card_by_share_code(share_code)

    def ActionHekaCardUpdatePost(self, request: Request, body: CardUpdateRequest):
        """
        更新贺卡接口
        POST /api/heka/card/update
        更新贺卡配置信息
        """
        stickers_data = None
        if body.stickers is not None:
            stickers_data = [s.dict() for s in body.stickers]

        return self.card_business.update_card(
            card_id=body.id,
            holiday_id=body.holiday_id,
            template_id=body.template_id,
            background_id=body.background_id,
            title=body.title,
            message=body.message,
            signature=body.signature,
            date=body.date,
            font_family=body.font_family,
            font_size=body.font_size,
            font_color=body.font_color,
            stickers=stickers_data,
            image_url=body.image_url
        )

    def ActionHekaCardDelete(self, request: Request, id: int = Query(..., ge=1, description="贺卡ID")):
        """
        删除贺卡接口
        DELETE /api/heka/card/delete
        参数: id - 贺卡ID
        """
        return self.card_business.delete_card(id)

    def ActionHekaCardListGet(self, request: Request):
        """
        获取贺卡列表接口
        GET /api/heka/card/list/get
        返回所有贺卡列表
        """
        return self.card_business.get_all_cards()
