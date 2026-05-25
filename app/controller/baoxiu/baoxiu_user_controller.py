from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class UpdateProfileRequest(BaseModel):
    real_name: Optional[str] = Field(None, description="真实姓名")
    phone: Optional[str] = Field(None, description="手机号")
    student_no: Optional[str] = Field(None, description="学号")
    dormitory_id: Optional[int] = Field(None, description="宿舍楼ID")
    room_number: Optional[str] = Field(None, description="房间号")
    worker_no: Optional[str] = Field(None, description="工号")
    specialty: Optional[str] = Field(None, description="维修专长")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class UpdateStatusRequest(BaseModel):
    status: int = Field(..., description="状态")


class BaoxiuUserController:
    def __init__(self):
        from app.business.baoxiu.user_business import BaoxiuUserBusiness
        from app.business.baoxiu.auth_business import BaoxiuAuthBusiness
        self.user_business = BaoxiuUserBusiness()
        self.auth_business = BaoxiuAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token if token else ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.auth_business.verify_token(token)

    def ActionBaoxiuUserListGet(self, request: Request,
                                page: int = Query(1, description="页码"),
                                page_size: int = Query(10, description="每页数量"),
                                role: Optional[str] = Query(None, description="角色"),
                                status: Optional[int] = Query(None, description="状态"),
                                keyword: Optional[str] = Query(None, description="搜索关键词"),
                                authorization: Optional[str] = Header(None)):
        """
        获取用户列表接口
        GET /api/baoxiu/user/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        current_user_id = user.get('id') if user else None
        current_user_role = user.get('role') if user else None
        
        return self.user_business.get_user_list(page, page_size, role, status, keyword, 
                                                current_user_id=current_user_id, 
                                                current_user_role=current_user_role)

    def ActionBaoxiuUserDetailGet(self, request: Request,
                                   user_id: int = Query(..., description="用户ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取用户详情接口
        GET /api/baoxiu/user/detail/get
        """
        return self.user_business.get_user_by_id(user_id)

    def ActionBaoxiuUserProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                           authorization: Optional[str] = Header(None)):
        """
        更新个人资料接口
        POST /api/baoxiu/user/profile/update
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        data = {}
        if body.real_name is not None:
            data['real_name'] = body.real_name
        if body.phone is not None:
            data['phone'] = body.phone
        if body.student_no is not None:
            data['student_no'] = body.student_no
        if body.dormitory_id is not None:
            data['dormitory_id'] = body.dormitory_id
        if body.room_number is not None:
            data['room_number'] = body.room_number
        if body.worker_no is not None:
            data['worker_no'] = body.worker_no
        if body.specialty is not None:
            data['specialty'] = body.specialty

        return self.user_business.update_profile(user.get('id'), data)

    def ActionBaoxiuUserPasswordChangePost(self, request: Request, body: ChangePasswordRequest,
                                            authorization: Optional[str] = Header(None)):
        """
        修改密码接口
        POST /api/baoxiu/user/password/change
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.user_business.change_password(
            user_id=user.get('id'),
            old_password=body.old_password,
            new_password=body.new_password
        )

    def ActionBaoxiuUserStatusUpdatePost(self, request: Request, body: UpdateStatusRequest,
                                          user_id: int = Query(..., description="用户ID"),
                                          authorization: Optional[str] = Header(None)):
        """
        更新用户状态接口
        POST /api/baoxiu/user/status/update
        """
        return self.user_business.update_user_status(user_id, body.status)

    def ActionBaoxiuUserDeletePost(self, request: Request,
                                    user_id: int = Query(..., description="用户ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        删除用户接口
        POST /api/baoxiu/user/delete
        """
        return self.user_business.delete_user(user_id)
