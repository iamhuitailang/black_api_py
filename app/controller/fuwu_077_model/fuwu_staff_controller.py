from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateStaffRequest(BaseModel):
    name: str = Field(..., description="姓名")
    phone: str = Field(..., description="手机号")
    id_card: Optional[str] = Field('', description="身份证号")
    skills: Optional[str] = Field('', description="技能")
    experience: Optional[int] = Field(0, description="工作年限")
    avatar: Optional[str] = Field('', description="头像")
    status: Optional[int] = Field(1, description="状态 1在职 0离职")


class UpdateStaffRequest(BaseModel):
    name: Optional[str] = Field(None, description="姓名")
    phone: Optional[str] = Field(None, description="手机号")
    id_card: Optional[str] = Field(None, description="身份证号")
    skills: Optional[str] = Field(None, description="技能")
    experience: Optional[int] = Field(None, description="工作年限")
    avatar: Optional[str] = Field(None, description="头像")
    status: Optional[int] = Field(None, description="状态 1在职 0离职")


class FuwuStaffController:
    def __init__(self):
        from app.business.fuwu_077_model.staff_business import StaffBusiness
        from app.business.fuwu_077_model.admin_auth_business import AdminAuthBusiness
        self.staff_business = StaffBusiness()
        self.admin_auth_business = AdminAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_auth_business.verify_token(token)

    def ActionFuwu077ModelStaffListGet(self, request: Request,
                                page: int = Query(1, description="页码"),
                                page_size: int = Query(10, description="每页数量"),
                                status: Optional[int] = Query(None, description="状态"),
                                keyword: Optional[str] = Query(None, description="关键词"),
                                authorization: Optional[str] = Header(None)):
        """
        获取服务人员列表接口
        GET /api/fuwu_077_model/staff/list/get
        管理员分页获取服务人员列表
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.staff_business.get_staff_list(
            page=page,
            page_size=page_size,
            status=status,
            keyword=keyword
        )

    def ActionFuwu077ModelStaffAvailableGet(self, request: Request):
        """
        获取可用服务人员列表接口
        GET /api/fuwu_077_model/staff/available/get
        获取所有在职的服务人员列表
        """
        return self.staff_business.get_available_staff()

    def ActionFuwu077ModelStaffDetailGet(self, request: Request,
                                  staff_id: int = Query(..., description="服务人员ID")):
        """
        获取服务人员详情接口
        GET /api/fuwu_077_model/staff/detail/get
        根据ID获取服务人员详情
        """
        return self.staff_business.get_staff_detail(staff_id)

    def ActionFuwu077ModelStaffCreatePost(self, request: Request, body: CreateStaffRequest,
                                   authorization: Optional[str] = Header(None)):
        """
        创建服务人员接口
        POST /api/fuwu_077_model/staff/create
        管理员添加服务人员
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.staff_business.create_staff(
            name=body.name,
            phone=body.phone,
            id_card=body.id_card or '',
            skills=body.skills or '',
            experience=body.experience or 0,
            avatar=body.avatar or '',
            status=body.status if body.status is not None else 1
        )

    def ActionFuwu077ModelStaffUpdatePost(self, request: Request, body: UpdateStaffRequest,
                                   staff_id: int = Query(..., description="服务人员ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        更新服务人员接口
        POST /api/fuwu_077_model/staff/update
        管理员更新服务人员信息
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.phone is not None:
            data['phone'] = body.phone
        if body.id_card is not None:
            data['id_card'] = body.id_card
        if body.skills is not None:
            data['skills'] = body.skills
        if body.experience is not None:
            data['experience'] = body.experience
        if body.avatar is not None:
            data['avatar'] = body.avatar
        if body.status is not None:
            data['status'] = body.status

        return self.staff_business.update_staff(staff_id, data)

    def ActionFuwu077ModelStaffStatusTogglePost(self, request: Request,
                                         staff_id: int = Query(..., description="服务人员ID"),
                                         authorization: Optional[str] = Header(None)):
        """
        切换服务人员状态接口
        POST /api/fuwu_077_model/staff/status/toggle
        管理员切换服务人员在职/离职状态
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.staff_business.toggle_status(staff_id)

    def ActionFuwu077ModelStaffDeletePost(self, request: Request,
                                   staff_id: int = Query(..., description="服务人员ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        删除服务人员接口
        POST /api/fuwu_077_model/staff/delete
        管理员删除服务人员
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.staff_business.delete_staff(staff_id)
