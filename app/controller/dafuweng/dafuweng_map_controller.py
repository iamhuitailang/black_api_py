from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class MapCellCreateRequest(BaseModel):
    name: str = Field(..., description="格子名称")
    position: int = Field(..., description="位置序号")
    cell_type: str = Field(..., description="格子类型")
    price: Optional[int] = Field(None, description="价格")
    rent: Optional[int] = Field(None, description="租金")
    description: Optional[str] = Field(None, description="描述")


class MapCellUpdateRequest(BaseModel):
    cell_id: int = Field(..., description="格子ID")
    name: Optional[str] = Field(None, description="格子名称")
    position: Optional[int] = Field(None, description="位置序号")
    cell_type: Optional[str] = Field(None, description="格子类型")
    price: Optional[int] = Field(None, description="价格")
    rent: Optional[int] = Field(None, description="租金")
    description: Optional[str] = Field(None, description="描述")


class MapCellDeleteRequest(BaseModel):
    cell_id: int = Field(..., description="格子ID")


class DafuwengMapController:
    def __init__(self):
        from app.business.dafuweng.map_business import MapBusiness
        self.map_business = MapBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _verify_admin(self, token):
        from app.business.dafuweng.admin_business import DafuwengAdminBusiness
        business = DafuwengAdminBusiness()
        admin = business.verify_token(token)
        if not admin:
            return {'code': 1, 'msg': '管理员未登录', 'data': None}
        return None

    def ActionDafuwengMapListGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        verify = self._verify_admin(token)
        if verify:
            return verify

        return self.map_business.get_all_cells()

    def ActionDafuwengMapDetailGet(self, request: Request, cell_id: int = Query(..., description="格子ID"),
                                   authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        verify = self._verify_admin(token)
        if verify:
            return verify

        return self.map_business.get_cell_by_id(cell_id=cell_id)

    def ActionDafuwengMapCreatePost(self, request: Request, body: MapCellCreateRequest,
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        verify = self._verify_admin(token)
        if verify:
            return verify

        return self.map_business.create_cell(
            data={'name': body.name, 'position': body.position, 'cell_type': body.cell_type, 'base_price': body.price or 0, 'rent_level1': body.rent or 0, 'description': body.description}
        )

    def ActionDafuwengMapUpdatePost(self, request: Request, body: MapCellUpdateRequest,
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        verify = self._verify_admin(token)
        if verify:
            return verify

        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.position is not None:
            data['position'] = body.position
        if body.cell_type is not None:
            data['cell_type'] = body.cell_type
        if body.price is not None:
            data['price'] = body.price
        if body.rent is not None:
            data['rent'] = body.rent
        if body.description is not None:
            data['description'] = body.description

        return self.map_business.update_cell(
            cell_id=body.cell_id,
            data=data
        )

    def ActionDafuwengMapDeleteDelete(self, request: Request, body: MapCellDeleteRequest,
                                       authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        verify = self._verify_admin(token)
        if verify:
            return verify

        return self.map_business.delete_cell(cell_id=body.cell_id)

    def ActionDafuwengMapResetPost(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        verify = self._verify_admin(token)
        if verify:
            return verify

        return self.map_business.reset_map()
