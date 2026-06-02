from typing import Optional
from fastapi import Request, Query
from pydantic import BaseModel, Field


class CreateInstrumentRequest(BaseModel):
    name: str = Field(..., description="乐器名称")
    type: str = Field(..., description="乐器类型")
    icon: str = Field("", description="图标URL")
    color: str = Field("#ffffff", description="颜色")
    description: str = Field("", description="描述")
    unlock_level: int = Field(1, description="解锁等级")
    key_count: int = Field(4, description="按键数量")
    status: int = Field(0, description="状态 0/1")


class UpdateInstrumentRequest(BaseModel):
    instrument_id: int = Field(..., description="乐器ID")
    name: Optional[str] = Field(None, description="乐器名称")
    type: Optional[str] = Field(None, description="乐器类型")
    icon: Optional[str] = Field(None, description="图标URL")
    color: Optional[str] = Field(None, description="颜色")
    description: Optional[str] = Field(None, description="描述")
    unlock_level: Optional[int] = Field(None, description="解锁等级")
    key_count: Optional[int] = Field(None, description="按键数量")
    status: Optional[int] = Field(None, description="状态 0/1")


class JinwutuanInstrumentController:
    def __init__(self):
        from app.business.jinwutuan.instrument_business import JinwutuanInstrumentBusiness
        self.instrument_business = JinwutuanInstrumentBusiness()

    def ActionJinwutuanInstrumentCreatePost(self, request: Request, body: CreateInstrumentRequest):
        data = {
            'name': body.name,
            'type': body.type,
            'icon': body.icon,
            'color': body.color,
            'description': body.description,
            'unlock_level': body.unlock_level,
            'key_count': body.key_count,
            'status': body.status
        }
        return self.instrument_business.create_instrument(data=data)

    def ActionJinwutuanInstrumentUpdatePut(self, request: Request, body: UpdateInstrumentRequest):
        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.type is not None:
            data['type'] = body.type
        if body.icon is not None:
            data['icon'] = body.icon
        if body.color is not None:
            data['color'] = body.color
        if body.description is not None:
            data['description'] = body.description
        if body.unlock_level is not None:
            data['unlock_level'] = body.unlock_level
        if body.key_count is not None:
            data['key_count'] = body.key_count
        if body.status is not None:
            data['status'] = body.status

        return self.instrument_business.update_instrument(
            instrument_id=body.instrument_id,
            data=data
        )

    def ActionJinwutuanInstrumentDeleteDelete(self, request: Request, instrument_id: int = Query(..., description="乐器ID")):
        return self.instrument_business.delete_instrument(instrument_id=instrument_id)

    def ActionJinwutuanInstrumentDetailGet(self, request: Request, instrument_id: int = Query(..., description="乐器ID")):
        return self.instrument_business.get_instrument(instrument_id=instrument_id)

    def ActionJinwutuanInstrumentListGet(self, request: Request,
                                          page: int = Query(1, ge=1, description="页码"),
                                          page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                          type: Optional[str] = Query(None, description="乐器类型"),
                                          status: Optional[int] = Query(None, description="状态")):
        return self.instrument_business.get_instrument_list(
            page=page,
            page_size=page_size,
            type=type,
            status=status
        )

    def ActionJinwutuanInstrumentEnabledGet(self, request: Request):
        return self.instrument_business.get_enabled_instruments()
