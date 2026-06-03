from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateCarRequest(BaseModel):
    name: str = Field(..., description="赛车名称")
    description: Optional[str] = Field('', description="赛车描述")
    primary_color: str = Field(..., description="主色调")
    secondary_color: str = Field(..., description="次要色调")
    accent_color: str = Field(..., description="强调色")
    body_style: str = Field(..., description="车身风格")


class UpdateCarRequest(BaseModel):
    car_id: int = Field(..., description="赛车ID")
    name: Optional[str] = Field(None, description="赛车名称")
    description: Optional[str] = Field(None, description="赛车描述")
    primary_color: Optional[str] = Field(None, description="主色调")
    secondary_color: Optional[str] = Field(None, description="次要色调")
    accent_color: Optional[str] = Field(None, description="强调色")
    body_style: Optional[str] = Field(None, description="车身风格")


class InstallPartRequest(BaseModel):
    car_id: int = Field(..., description="赛车ID")
    part_id: int = Field(..., description="零件ID")
    slot_type: str = Field(..., description="槽位类型")


class UninstallPartRequest(BaseModel):
    car_id: int = Field(..., description="赛车ID")
    car_part_id: int = Field(..., description="已安装零件ID")


class SetActiveCarRequest(BaseModel):
    car_id: int = Field(..., description="赛车ID")


class DeleteCarRequest(BaseModel):
    car_id: int = Field(..., description="赛车ID")


class ScCarController:
    def __init__(self):
        from app.business.sc.sc_car_business import ScCarBusiness
        self.sc_car_business = ScCarBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.sc.sc_user_business import ScUserBusiness
        user_business = ScUserBusiness()
        return user_business.verify_token(token)

    def ActionScCarCreatePost(self, request: Request, body: CreateCarRequest,
                               authorization: Optional[str] = Header(None)):
        """
        创建赛车接口
        POST /api/sc/car/create
        创建新的赛车设计
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.sc_car_business.create_car(
            user_id=user.get('id'),
            name=body.name,
            description=body.description,
            primary_color=body.primary_color,
            secondary_color=body.secondary_color,
            accent_color=body.accent_color,
            body_style=body.body_style
        )

    def ActionScCarListGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取赛车列表接口
        GET /api/sc/car/list/get
        获取当前用户的所有赛车
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.sc_car_business.get_user_cars(user_id=user.get('id'))

    def ActionScCarDetailGet(self, request: Request, car_id: int = Query(..., description="赛车ID"),
                              authorization: Optional[str] = Header(None)):
        """
        获取赛车详情接口
        GET /api/sc/car/detail/get
        根据赛车ID获取详细信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.sc_car_business.get_car_detail(
            user_id=user.get('id'),
            car_id=car_id
        )

    def ActionScCarUpdatePost(self, request: Request, body: UpdateCarRequest,
                               authorization: Optional[str] = Header(None)):
        """
        更新赛车接口
        POST /api/sc/car/update
        更新赛车的属性
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.description is not None:
            data['description'] = body.description
        if body.primary_color is not None:
            data['primary_color'] = body.primary_color
        if body.secondary_color is not None:
            data['secondary_color'] = body.secondary_color
        if body.accent_color is not None:
            data['accent_color'] = body.accent_color
        if body.body_style is not None:
            data['body_style'] = body.body_style

        return self.sc_car_business.update_car(
            user_id=user.get('id'),
            car_id=body.car_id,
            data=data
        )

    def ActionScCarDeletePost(self, request: Request, body: DeleteCarRequest,
                               authorization: Optional[str] = Header(None)):
        """
        删除赛车接口
        POST /api/sc/car/delete
        删除指定的赛车
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.sc_car_business.delete_car(
            user_id=user.get('id'),
            car_id=body.car_id
        )

    def ActionScCarActiveSetPost(self, request: Request, body: SetActiveCarRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        设置当前使用赛车接口
        POST /api/sc/car/active/set
        设置指定赛车为当前使用的赛车
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.sc_car_business.set_active_car(
            user_id=user.get('id'),
            car_id=body.car_id
        )

    def ActionScCarPartInstallPost(self, request: Request, body: InstallPartRequest,
                                    authorization: Optional[str] = Header(None)):
        """
        安装零件接口
        POST /api/sc/car/part/install
        为赛车安装零件
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.sc_car_business.install_part(
            user_id=user.get('id'),
            car_id=body.car_id,
            part_id=body.part_id,
            slot_type=body.slot_type
        )

    def ActionScCarPartUninstallPost(self, request: Request, body: UninstallPartRequest,
                                      authorization: Optional[str] = Header(None)):
        """
        卸载零件接口
        POST /api/sc/car/part/uninstall
        从赛车上卸载零件
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.sc_car_business.uninstall_part(
            user_id=user.get('id'),
            car_id=body.car_id,
            car_part_id=body.car_part_id
        )
