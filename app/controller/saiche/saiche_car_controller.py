from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class AddCarRequest(BaseModel):
    name: str = Field(..., description="赛车名称")
    description: Optional[str] = Field(None, description="赛车描述")
    base_speed: float = Field(..., description="基础速度")
    base_acceleration: float = Field(..., description="基础加速度")
    base_handling: float = Field(..., description="基础操控性")
    base_nitro: float = Field(..., description="基础氮气")
    max_speed: float = Field(..., description="满级速度")
    max_acceleration: float = Field(..., description="满级加速度")
    max_handling: float = Field(..., description="满级操控性")
    max_nitro: float = Field(..., description="满级氮气")
    image: Optional[str] = Field(None, description="赛车图片")
    price: Optional[int] = Field(0, description="价格")
    rarity: Optional[int] = Field(1, description="稀有度")


class UpdateCarRequest(BaseModel):
    name: Optional[str] = Field(None, description="赛车名称")
    description: Optional[str] = Field(None, description="赛车描述")
    base_speed: Optional[float] = Field(None, description="基础速度")
    base_acceleration: Optional[float] = Field(None, description="基础加速度")
    base_handling: Optional[float] = Field(None, description="基础操控性")
    base_nitro: Optional[float] = Field(None, description="基础氮气")
    max_speed: Optional[float] = Field(None, description="满级速度")
    max_acceleration: Optional[float] = Field(None, description="满级加速度")
    max_handling: Optional[float] = Field(None, description="满级操控性")
    max_nitro: Optional[float] = Field(None, description="满级氮气")
    image: Optional[str] = Field(None, description="赛车图片")
    price: Optional[int] = Field(None, description="价格")
    rarity: Optional[int] = Field(None, description="稀有度")
    is_active: Optional[int] = Field(None, description="是否启用")


class SaicheCarController:
    def __init__(self):
        from app.business.saiche.car_business import SaicheCarBusiness
        from app.business.saiche.user_business import SaicheUserBusiness
        self.car_business = SaicheCarBusiness()
        self.user_business = SaicheUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def _get_current_admin(self, token: str) -> Optional[dict]:
        from app.business.saiche.admin_business import SaicheAdminBusiness
        admin_business = SaicheAdminBusiness()
        return admin_business.verify_token(token)

    def ActionSaicheCarListGet(self, request: Request,
                                page: int = Query(1, ge=1, description="页码"),
                                page_size: int = Query(10, ge=1, le=100, description="每页数量")):
        """
        获取赛车列表接口
        GET /api/saiche/car/list/get
        获取所有赛车列表
        """
        return self.car_business.get_car_list(page=page, page_size=page_size)

    def ActionSaicheCarDetailGet(self, request: Request, car_id: int = Query(..., description="赛车ID")):
        """
        获取赛车详情接口
        GET /api/saiche/car/detail/get
        根据赛车ID获取赛车详情
        """
        return self.car_business.get_car_detail(car_id=car_id)

    def ActionSaicheCarUserListGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取用户赛车列表接口
        GET /api/saiche/car/user/list/get
        获取当前登录用户拥有的赛车列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.car_business.get_user_cars(user_id=user.get('id'))

    def ActionSaicheCarActiveGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取用户激活赛车接口
        GET /api/saiche/car/active/get
        获取当前登录用户激活的赛车
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.car_business.get_active_car(user_id=user.get('id'))

    def ActionSaicheCarActiveSetPost(self, request: Request,
                                         user_car_id: int = Query(..., description="用户赛车ID"),
                                         authorization: Optional[str] = Header(None)):
        """
        设置激活赛车接口
        POST /api/saiche/car/active/set
        设置用户激活的赛车
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.car_business.set_active_car(user_id=user.get('id'), user_car_id=user_car_id)

    def ActionSaicheCarUpgradePost(self, request: Request,
                                  user_car_id: int = Query(..., description="用户赛车ID"),
                                  attribute: str = Query(..., description="属性: speed/acceleration/handling/nitro"),
                                  authorization: Optional[str] = Header(None)):
        """
        升级赛车属性接口
        POST /api/saiche/car/upgrade
        升级赛车的指定属性
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.car_business.upgrade_car(
            user_id=user.get('id'),
            user_car_id=user_car_id,
            attribute=attribute
        )

    def ActionSaicheCarAddPost(self, request: Request, body: AddCarRequest,
                                 authorization: Optional[str] = Header(None)):
        """
        添加赛车接口（管理员）
        POST /api/saiche/car/add
        管理员添加新赛车
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = body.dict(exclude_unset=True)
        return self.car_business.add_car(data=data)

    def ActionSaicheCarUpdatePost(self, request: Request, body: UpdateCarRequest,
                                  car_id: int = Query(..., description="赛车ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        更新赛车接口（管理员）
        POST /api/saiche/car/update
        管理员更新赛车信息
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = body.dict(exclude_unset=True)
        return self.car_business.update_car(car_id=car_id, data=data)

    def ActionSaicheCarDeletePost(self, request: Request,
                                  car_id: int = Query(..., description="赛车ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        删除赛车接口（管理员）
        POST /api/saiche/car/delete
        管理员删除赛车
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.car_business.delete_car(car_id=car_id)
