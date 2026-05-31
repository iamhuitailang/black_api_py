from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class VerifyPickupRequest(BaseModel):
    code: str = Field(..., description="取件码")


class KuaidiPickupController:
    def __init__(self):
        from app.business.kuaidi_077.user_business import KuaidiUserBusiness
        from app.business.kuaidi_077.pickup_business import KuaidiPickupBusiness
        self.user_business = KuaidiUserBusiness()
        self.pickup_business = KuaidiPickupBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionKuaidi077PickupCodeGeneratePost(self, request: Request, package_id: int = Query(..., description="快递ID"),
                                                authorization: Optional[str] = Header(None)):
        """
        生成取件码接口
        POST /api/kuaidi077/pickup/code/generate
        用户生成取件码
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.pickup_business.generate_pickup_code(user.get('id'), package_id)

    def ActionKuaidi077PickupCodeDetailGet(self, request: Request, code_id: int = Query(..., description="取件码ID"),
                                             authorization: Optional[str] = Header(None)):
        """
        获取取件码详情接口
        GET /api/kuaidi077/pickup/code/detail/get
        根据ID获取取件码详情
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.pickup_business.get_pickup_code_by_id(code_id)

    def ActionKuaidi077PickupCodeGet(self, request: Request, code: str = Query(..., description="取件码"),
                                      authorization: Optional[str] = Header(None)):
        """
        根据取件码查询接口
        GET /api/kuaidi077/pickup/code/get
        根据取件码查询信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.pickup_business.get_pickup_code_by_code(code)

    def ActionKuaidi077PickupCodeMyGet(self, request: Request, page: int = Query(1, description="页码"),
                                        page_size: int = Query(10, description="每页数量"),
                                        status: Optional[int] = Query(None, description="状态"),
                                        authorization: Optional[str] = Header(None)):
        """
        获取我的取件码接口
        GET /api/kuaidi077/pickup/code/my/get
        用户查看自己的取件码
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.pickup_business.get_user_pickup_codes(user.get('id'), page, page_size, status)

    def ActionKuaidi077PickupVerifyPost(self, request: Request, body: VerifyPickupRequest,
                                         authorization: Optional[str] = Header(None)):
        """
        验证取件码并取件接口
        POST /api/kuaidi077/pickup/verify
        验证取件码并完成取件
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        operator_id = 0
        if user:
            operator_id = user.get('id')

        return self.pickup_business.verify_and_pickup(body.code, operator_id)

    def ActionKuaidi077PickupListGet(self, request: Request, page: int = Query(1, description="页码"),
                                      page_size: int = Query(10, description="每页数量"),
                                      status: Optional[int] = Query(None, description="状态"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取取件记录列表接口
        GET /api/kuaidi077/pickup/list/get
        管理员获取取件记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.pickup_business.get_pickup_list(page, page_size, status)

    def ActionKuaidi077PickupCodeDeletePost(self, request: Request, code_id: int = Query(..., description="取件码ID"),
                                             authorization: Optional[str] = Header(None)):
        """
        删除取件码接口
        POST /api/kuaidi077/pickup/code/delete
        管理员删除取件码
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.pickup_business.delete_pickup_code(code_id)
