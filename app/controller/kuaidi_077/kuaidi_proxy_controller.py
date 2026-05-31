from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateProxyRequest(BaseModel):
    package_id: int = Field(..., description="快递ID")
    remark: str = Field('', description="备注")


class KuaidiProxyController:
    def __init__(self):
        from app.business.kuaidi_077.user_business import KuaidiUserBusiness
        from app.business.kuaidi_077.proxy_business import KuaidiProxyBusiness
        self.user_business = KuaidiUserBusiness()
        self.proxy_business = KuaidiProxyBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionKuaidi077ProxyCreatePost(self, request: Request, body: CreateProxyRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        创建代取请求接口
        POST /api/kuaidi077/proxy/create
        用户发起代取请求
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.proxy_business.create_proxy_request(user.get('id'), body.package_id, body.remark)

    def ActionKuaidi077ProxyDetailGet(self, request: Request, proxy_id: int = Query(..., description="代取请求ID"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取代取请求详情接口
        GET /api/kuaidi077/proxy/detail/get
        根据ID获取代取请求详情
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.proxy_business.get_proxy_by_id(proxy_id)

    def ActionKuaidi077ProxyMyRequestGet(self, request: Request, page: int = Query(1, description="页码"),
                                          page_size: int = Query(10, description="每页数量"),
                                          status: Optional[int] = Query(None, description="状态"),
                                          authorization: Optional[str] = Header(None)):
        """
        获取我的代取请求接口
        GET /api/kuaidi077/proxy/my/request/get
        用户查看自己发起的代取请求
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.proxy_business.get_my_requests(user.get('id'), page, page_size, status)

    def ActionKuaidi077ProxyMyProxyGet(self, request: Request, page: int = Query(1, description="页码"),
                                        page_size: int = Query(10, description="每页数量"),
                                        status: Optional[int] = Query(None, description="状态"),
                                        authorization: Optional[str] = Header(None)):
        """
        获取我接的代取接口
        GET /api/kuaidi077/proxy/my/proxy/get
        用户查看自己接的代取任务
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.proxy_business.get_my_proxies(user.get('id'), page, page_size, status)

    def ActionKuaidi077ProxyPendingGet(self, request: Request, page: int = Query(1, description="页码"),
                                        page_size: int = Query(10, description="每页数量"),
                                        authorization: Optional[str] = Header(None)):
        """
        获取待接单列表接口
        GET /api/kuaidi077/proxy/pending/get
        用户查看可接单的代取请求
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.proxy_business.get_pending_proxies(page, page_size)

    def ActionKuaidi077ProxyAcceptPost(self, request: Request, proxy_id: int = Query(..., description="代取请求ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        接单接口
        POST /api/kuaidi077/proxy/accept
        用户接受代取请求
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.proxy_business.accept_proxy(proxy_id, user.get('id'))

    def ActionKuaidi077ProxyCompletePost(self, request: Request, proxy_id: int = Query(..., description="代取请求ID"),
                                          authorization: Optional[str] = Header(None)):
        """
        完成代取接口
        POST /api/kuaidi077/proxy/complete
        用户完成代取任务
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.proxy_business.complete_proxy(proxy_id, user.get('id'))

    def ActionKuaidi077ProxyCancelPost(self, request: Request, proxy_id: int = Query(..., description="代取请求ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        取消代取请求接口
        POST /api/kuaidi077/proxy/cancel
        用户取消代取请求
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.proxy_business.cancel_proxy(proxy_id, user.get('id'))

    def ActionKuaidi077ProxyListGet(self, request: Request, page: int = Query(1, description="页码"),
                                     page_size: int = Query(10, description="每页数量"),
                                     status: Optional[int] = Query(None, description="状态"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取代取请求列表接口
        GET /api/kuaidi077/proxy/list/get
        管理员获取代取请求列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.proxy_business.get_proxy_list(page, page_size, status)

    def ActionKuaidi077ProxyDeletePost(self, request: Request, proxy_id: int = Query(..., description="代取请求ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        删除代取请求接口
        POST /api/kuaidi077/proxy/delete
        管理员删除代取请求
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.proxy_business.delete_proxy(proxy_id)
