from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreatePetRequest(BaseModel):
    name: str = Field(..., description="宠物名称")
    pet_type: str = Field(..., description="宠物类型")
    breed: Optional[str] = Field('', description="品种")
    age: Optional[str] = Field('', description="年龄")
    weight: Optional[str] = Field('', description="体重")
    gender: Optional[str] = Field('', description="性别")
    photo: Optional[str] = Field('', description="照片")
    health_info: Optional[str] = Field('', description="健康信息")
    vaccine_status: Optional[int] = Field(0, description="疫苗状态 0未接种 1已接种")


class UpdatePetRequest(BaseModel):
    pet_id: int = Field(..., description="宠物ID")
    name: Optional[str] = Field(None, description="宠物名称")
    pet_type: Optional[str] = Field(None, description="宠物类型")
    breed: Optional[str] = Field(None, description="品种")
    age: Optional[str] = Field(None, description="年龄")
    weight: Optional[str] = Field(None, description="体重")
    gender: Optional[str] = Field(None, description="性别")
    photo: Optional[str] = Field(None, description="照片")
    health_info: Optional[str] = Field(None, description="健康信息")
    vaccine_status: Optional[int] = Field(None, description="疫苗状态")


class PetIdRequest(BaseModel):
    pet_id: int = Field(..., description="宠物ID")


class Chongwu09PetController:
    def __init__(self):
        from app.business.chongwu09.pet_business import PetBusiness
        from app.business.chongwu09.user_business import UserBusiness
        from app.business.chongwu09.admin_business import AdminBusiness
        self.pet_business = PetBusiness()
        self.user_business = UserBusiness()
        self.admin_business = AdminBusiness()

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
        return self.admin_business.verify_token(token)

    def ActionChongwu09PetCreatePost(self, request: Request, body: CreatePetRequest,
                                      authorization: Optional[str] = Header(None)):
        """
        添加宠物
        POST /api/chongwu09/pet/create
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.pet_business.create_pet(
            user_id=user.get('id'), name=body.name, pet_type=body.pet_type,
            breed=body.breed or '', age=body.age or '', weight=body.weight or '',
            gender=body.gender or '', photo=body.photo or '',
            health_info=body.health_info or '', vaccine_status=body.vaccine_status or 0
        )

    def ActionChongwu09PetMyListGet(self, request: Request,
                                     authorization: Optional[str] = Header(None)):
        """
        获取我的宠物列表
        GET /api/chongwu09/pet/my/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.pet_business.get_my_pets(user.get('id'))

    def ActionChongwu09PetUpdatePost(self, request: Request, body: UpdatePetRequest,
                                      authorization: Optional[str] = Header(None)):
        """
        更新宠物信息
        POST /api/chongwu09/pet/update
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        pet_id = body.pet_id
        data = {k: v for k, v in body.dict().items() if v is not None and k != 'pet_id'}
        return self.pet_business.update_pet(pet_id, user.get('id'), data)

    def ActionChongwu09PetDeletePost(self, request: Request, body: PetIdRequest,
                                      authorization: Optional[str] = Header(None)):
        """
        删除宠物
        POST /api/chongwu09/pet/delete
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.pet_business.delete_pet(body.pet_id, user.get('id'))

    def ActionChongwu09PetTypesGet(self, request: Request):
        """
        获取宠物类型列表
        GET /api/chongwu09/pet/types/get
        """
        return self.pet_business.get_pet_types()

    def ActionChongwu09PetAdminListGet(self, request: Request,
                                        page: int = Query(1, ge=1),
                                        page_size: int = Query(10, ge=1, le=100),
                                        pet_type: Optional[str] = Query(None),
                                        keyword: Optional[str] = Query(None),
                                        user_id: Optional[int] = Query(None),
                                        authorization: Optional[str] = Header(None)):
        """
        管理员获取宠物列表
        GET /api/chongwu09/pet/admin/list/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.pet_business.get_pet_list(
            page=page, page_size=page_size, pet_type=pet_type, keyword=keyword, user_id=user_id
        )

    def ActionChongwu09PetAdminUpdatePost(self, request: Request, body: UpdatePetRequest,
                                           authorization: Optional[str] = Header(None)):
        """
        管理员更新宠物信息
        POST /api/chongwu09/pet/admin/update
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        pet_id = body.pet_id
        data = {k: v for k, v in body.dict().items() if v is not None and k != 'pet_id'}
        return self.pet_business.admin_update_pet(pet_id, data)

    def ActionChongwu09PetAdminDeletePost(self, request: Request, body: PetIdRequest,
                                           authorization: Optional[str] = Header(None)):
        """
        管理员删除宠物
        POST /api/chongwu09/pet/admin/delete
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.pet_business.admin_delete_pet(body.pet_id)
