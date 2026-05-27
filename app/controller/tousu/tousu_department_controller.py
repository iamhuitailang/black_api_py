from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateDepartmentRequest(BaseModel):
    name: str = Field(..., description="部门名称")
    code: str = Field(..., description="部门编码")
    description: Optional[str] = Field('', description="描述")
    head_user_id: Optional[int] = Field(0, description="负责人ID")
    sort_order: Optional[int] = Field(0, description="排序")


class UpdateDepartmentRequest(BaseModel):
    name: Optional[str] = Field(None, description="部门名称")
    code: Optional[str] = Field(None, description="部门编码")
    description: Optional[str] = Field(None, description="描述")
    head_user_id: Optional[int] = Field(None, description="负责人ID")
    sort_order: Optional[int] = Field(None, description="排序")
    status: Optional[int] = Field(None, description="状态")


class TousuDepartmentController:
    def __init__(self):
        from app.business.tousu.department_business import TousuDepartmentBusiness
        self.department_business = TousuDepartmentBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.tousu.user_business import TousuUserBusiness
        user_business = TousuUserBusiness()
        return user_business.verify_token(token)

    def ActionTousuDepartmentCreatePost(self, request: Request, body: CreateDepartmentRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        创建部门接口
        POST /api/tousu/department/create
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '权限不足',
                'data': None
            }

        return self.department_business.create_department(
            name=body.name,
            code=body.code,
            description=body.description or '',
            head_user_id=body.head_user_id or 0,
            sort_order=body.sort_order or 0
        )

    def ActionTousuDepartmentUpdatePost(self, request: Request, body: UpdateDepartmentRequest,
                                        department_id: int = Query(..., description="部门ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        更新部门接口
        POST /api/tousu/department/update
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '权限不足',
                'data': None
            }

        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.code is not None:
            data['code'] = body.code
        if body.description is not None:
            data['description'] = body.description
        if body.head_user_id is not None:
            data['head_user_id'] = body.head_user_id
        if body.sort_order is not None:
            data['sort_order'] = body.sort_order
        if body.status is not None:
            data['status'] = body.status

        return self.department_business.update_department(department_id, data)

    def ActionTousuDepartmentDeletePost(self, request: Request,
                                        department_id: int = Query(..., description="部门ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        删除部门接口
        POST /api/tousu/department/delete
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '权限不足',
                'data': None
            }

        return self.department_business.delete_department(department_id)

    def ActionTousuDepartmentDetailGet(self, request: Request,
                                       department_id: int = Query(..., description="部门ID"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取部门详情接口
        GET /api/tousu/department/detail/get
        """
        return self.department_business.get_department(department_id)

    def ActionTousuDepartmentListGet(self, request: Request,
                                     status: Optional[int] = Query(None, description="状态"),
                                     keyword: Optional[str] = Query(None, description="关键词"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取部门列表接口
        GET /api/tousu/department/list/get
        """
        return self.department_business.get_all_departments(status, keyword)