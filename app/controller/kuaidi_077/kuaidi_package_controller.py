from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreatePackageRequest(BaseModel):
    tracking_number: str = Field(..., description="快递单号")
    courier_company: str = Field('', description="快递公司")
    recipient_name: str = Field(..., description="收件人姓名")
    recipient_phone: str = Field(..., description="收件人电话")
    package_type: str = Field('', description="包裹类型")
    weight: float = Field(0, description="重量")
    cabinet_number: str = Field('', description="柜号")
    shelf_number: str = Field('', description="货架号")
    remark: str = Field('', description="备注")


class UpdatePackageRequest(BaseModel):
    tracking_number: Optional[str] = Field(None, description="快递单号")
    courier_company: Optional[str] = Field(None, description="快递公司")
    recipient_name: Optional[str] = Field(None, description="收件人姓名")
    recipient_phone: Optional[str] = Field(None, description="收件人电话")
    package_type: Optional[str] = Field(None, description="包裹类型")
    weight: Optional[float] = Field(None, description="重量")
    cabinet_number: Optional[str] = Field(None, description="柜号")
    shelf_number: Optional[str] = Field(None, description="货架号")
    remark: Optional[str] = Field(None, description="备注")


class KuaidiPackageController:
    def __init__(self):
        from app.business.kuaidi_077.user_business import KuaidiUserBusiness
        from app.business.kuaidi_077.package_business import KuaidiPackageBusiness
        self.user_business = KuaidiUserBusiness()
        self.package_business = KuaidiPackageBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionKuaidi077PackageCreatePost(self, request: Request, body: CreatePackageRequest,
                                          authorization: Optional[str] = Header(None)):
        """
        录入快递接口
        POST /api/kuaidi077/package/create
        管理员录入快递信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.package_business.create_package(
            tracking_number=body.tracking_number,
            courier_company=body.courier_company,
            recipient_name=body.recipient_name,
            recipient_phone=body.recipient_phone,
            package_type=body.package_type,
            weight=body.weight,
            cabinet_number=body.cabinet_number,
            shelf_number=body.shelf_number,
            remark=body.remark
        )

    def ActionKuaidi077PackageDetailGet(self, request: Request, package_id: int = Query(..., description="快递ID"),
                                         authorization: Optional[str] = Header(None)):
        """
        获取快递详情接口
        GET /api/kuaidi077/package/detail/get
        根据ID获取快递详情
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.package_business.get_package_by_id(package_id)

    def ActionKuaidi077PackageTrackingGet(self, request: Request, tracking_number: str = Query(..., description="快递单号"),
                                           authorization: Optional[str] = Header(None)):
        """
        根据单号查询快递接口
        GET /api/kuaidi077/package/tracking/get
        根据快递单号查询快递信息
        """
        return self.package_business.get_package_by_tracking(tracking_number)

    def ActionKuaidi077PackageMyGet(self, request: Request, page: int = Query(1, description="页码"),
                                     page_size: int = Query(10, description="每页数量"),
                                     status: Optional[int] = Query(None, description="状态"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取我的快递接口
        GET /api/kuaidi077/package/my/get
        用户查看自己的快递记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.package_business.get_user_packages(user.get('id'), page, page_size, status)

    def ActionKuaidi077PackagePhoneGet(self, request: Request, phone: str = Query(..., description="手机号"),
                                        page: int = Query(1, description="页码"),
                                        page_size: int = Query(10, description="每页数量"),
                                        status: Optional[int] = Query(None, description="状态"),
                                        authorization: Optional[str] = Header(None)):
        """
        根据手机号查询快递接口
        GET /api/kuaidi077/package/phone/get
        根据手机号查询快递
        """
        return self.package_business.get_packages_by_phone(phone, page, page_size, status)

    def ActionKuaidi077PackageListGet(self, request: Request, page: int = Query(1, description="页码"),
                                       page_size: int = Query(10, description="每页数量"),
                                       status: Optional[int] = Query(None, description="状态"),
                                       keyword: Optional[str] = Query(None, description="关键词"),
                                       start_date: Optional[str] = Query(None, description="开始日期"),
                                       end_date: Optional[str] = Query(None, description="结束日期"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取快递列表接口
        GET /api/kuaidi077/package/list/get
        管理员获取快递列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.package_business.get_package_list(page, page_size, status, keyword, start_date, end_date)

    def ActionKuaidi077PackageUpdatePost(self, request: Request, body: UpdatePackageRequest,
                                          package_id: int = Query(..., description="快递ID"),
                                          authorization: Optional[str] = Header(None)):
        """
        更新快递信息接口
        POST /api/kuaidi077/package/update
        管理员更新快递信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        data = {}
        if body.tracking_number is not None:
            data['tracking_number'] = body.tracking_number
        if body.courier_company is not None:
            data['courier_company'] = body.courier_company
        if body.recipient_name is not None:
            data['recipient_name'] = body.recipient_name
        if body.recipient_phone is not None:
            data['recipient_phone'] = body.recipient_phone
        if body.package_type is not None:
            data['package_type'] = body.package_type
        if body.weight is not None:
            data['weight'] = body.weight
        if body.cabinet_number is not None:
            data['cabinet_number'] = body.cabinet_number
        if body.shelf_number is not None:
            data['shelf_number'] = body.shelf_number
        if body.remark is not None:
            data['remark'] = body.remark

        return self.package_business.update_package(package_id, data)

    def ActionKuaidi077PackageDeletePost(self, request: Request, package_id: int = Query(..., description="快递ID"),
                                          authorization: Optional[str] = Header(None)):
        """
        删除快递接口
        POST /api/kuaidi077/package/delete
        管理员删除快递
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.package_business.delete_package(package_id)

    def ActionKuaidi077PackageOverdueListGet(self, request: Request, days: int = Query(3, description="超期天数"),
                                              page: int = Query(1, description="页码"),
                                              page_size: int = Query(10, description="每页数量"),
                                              authorization: Optional[str] = Header(None)):
        """
        获取超时快递列表接口
        GET /api/kuaidi077/package/overdue/list/get
        管理员获取超时快递列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.package_business.get_overdue_packages(days, page, page_size)

    def ActionKuaidi077PackageOverdueProcessPost(self, request: Request, package_id: int = Query(..., description="快递ID"),
                                                   authorization: Optional[str] = Header(None)):
        """
        处理超时快递接口
        POST /api/kuaidi077/package/overdue/process
        管理员标记快递为超时
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.package_business.process_overdue(package_id)

    def ActionKuaidi077PackageReturnPost(self, request: Request, package_id: int = Query(..., description="快递ID"),
                                          authorization: Optional[str] = Header(None)):
        """
        退回快递接口
        POST /api/kuaidi077/package/return
        管理员标记快递为退回
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.package_business.return_package(package_id)

    def ActionKuaidi077PackageStatisticsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取快递统计接口
        GET /api/kuaidi077/package/statistics/get
        管理员获取快递统计数据
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.package_business.get_statistics()
