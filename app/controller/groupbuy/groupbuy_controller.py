from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from app.business.groupbuy import GroupBuyBusiness
import io


class GroupBuyCreateRequest(BaseModel):
    title: str = Field(..., description='商品名称')
    spec: Optional[str] = Field(default='', description='规格')
    price: float = Field(default=0.0, description='单价')
    description: Optional[str] = Field(default='', description='描述')
    image_url: Optional[str] = Field(default='', description='图片链接')
    deadline: str = Field(..., description='截单时间，ISO格式，如 2025-06-11T18:00:00')


class GroupBuyUpdateRequest(BaseModel):
    id: int = Field(..., description='团购ID')
    title: Optional[str] = Field(default=None, description='商品名称')
    spec: Optional[str] = Field(default=None, description='规格')
    price: Optional[float] = Field(default=None, description='单价')
    description: Optional[str] = Field(default=None, description='描述')
    image_url: Optional[str] = Field(default=None, description='图片链接')
    deadline: Optional[str] = Field(default=None, description='截单时间')


class OrderCreateRequest(BaseModel):
    group_buy_id: int = Field(..., description='团购ID')
    building: str = Field(..., description='楼栋号')
    room: Optional[str] = Field(default='', description='房间号')
    phone: str = Field(..., description='手机号')
    quantity: int = Field(default=1, ge=1, description='数量')


class GroupBuyController:
    def __init__(self):
        self.business = GroupBuyBusiness()

    def ActionGroupbuyListGet(self, request: Request):
        """
        获取团购列表
        GET /api/groupbuy/list/get
        返回所有团购列表，包含接龙统计信息
        """
        return self.business.get_group_buy_list(include_closed=True)

    def ActionGroupbuyActiveListGet(self, request: Request):
        """
        获取进行中的团购列表
        GET /api/groupbuy/active/list/get
        只返回未截单的团购
        """
        return self.business.get_group_buy_list(include_closed=False)

    def ActionGroupbuyDetailGet(self, request: Request, id: int = Query(..., ge=1, description='团购ID')):
        """
        获取团购详情
        GET /api/groupbuy/detail/get
        返回团购详情和所有接龙明细
        """
        return self.business.get_group_buy_detail(id)

    def ActionGroupbuyCreatePost(self, request: Request, body: GroupBuyCreateRequest):
        """
        发布团购
        POST /api/groupbuy/create
        团长发布新的团购商品
        """
        return self.business.create_group_buy(
            title=body.title,
            spec=body.spec,
            price=body.price,
            description=body.description,
            image_url=body.image_url,
            deadline=body.deadline
        )

    def ActionGroupbuyUpdatePost(self, request: Request, body: GroupBuyUpdateRequest):
        """
        编辑团购
        POST /api/groupbuy/update
        未截单前可以编辑商品信息
        """
        return self.business.update_group_buy(
            group_buy_id=body.id,
            title=body.title,
            spec=body.spec,
            price=body.price,
            description=body.description,
            image_url=body.image_url,
            deadline=body.deadline
        )

    def ActionGroupbuyClosePost(self, request: Request, id: int = Query(..., ge=1, description='团购ID')):
        """
        截单
        POST /api/groupbuy/close
        团长提前截单，截单后不能再接龙
        """
        return self.business.close_group_buy(id)

    def ActionGroupbuyOrderPost(self, request: Request, body: OrderCreateRequest):
        """
        接龙下单
        POST /api/groupbuy/order
        邻居提交接龙，填写楼栋号、手机号、数量
        """
        return self.business.create_order(
            group_buy_id=body.group_buy_id,
            building=body.building,
            room=body.room,
            phone=body.phone,
            quantity=body.quantity
        )

    def ActionGroupbuyExportGet(self, request: Request, id: int = Query(..., ge=1, description='团购ID')):
        """
        导出接龙明细CSV
        GET /api/groupbuy/export/get
        导出接龙明细为CSV文件，方便团长按楼栋分发
        """
        csv_data = self.business.export_orders_csv(id)
        if csv_data is None:
            return {
                'code': 1,
                'message': '导出失败',
                'data': None
            }

        result = self.business.get_group_buy_detail(id)
        title = '团购明细'
        if result.get('code') == 0:
            title = result.get('data', {}).get('title', '团购明细')

        filename = f"{title}_接龙明细.csv"

        return StreamingResponse(
            io.BytesIO(csv_data),
            media_type='text/csv; charset=utf-8',
            headers={
                'Content-Disposition': f'attachment; filename="{filename.encode("utf-8").decode("latin-1")}"'
            }
        )

    def ActionGroupbuyDelete(self, request: Request, id: int = Query(..., ge=1, description='团购ID')):
        """
        删除团购
        DELETE /api/groupbuy/delete
        删除团购及其所有接龙记录
        """
        return self.business.delete_group_buy(id)
