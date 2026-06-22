from typing import Optional, List
from fastapi import Request, Header, Query, UploadFile, File, Form
from pydantic import BaseModel, Field
from app.business.opinion import OpinionBusiness
from app.business.auth import AuthBusiness
import os
import uuid
from datetime import datetime


class CreateOpinionRequest(BaseModel):
    title: str = Field(..., description="意见标题")
    category: str = Field(..., description="意见类别：environment/security/facility/other")
    description: str = Field(..., description="意见描述")
    photos: Optional[List[str]] = Field(default=None, description="照片URL列表")


class ProcessOpinionRequest(BaseModel):
    opinion_id: int = Field(..., description="意见ID")
    content: str = Field(..., description="处理内容")
    photos: Optional[List[str]] = Field(default=None, description="照片URL列表")
    is_resolved: bool = Field(default=False, description="是否处理完成")


class RateOpinionRequest(BaseModel):
    opinion_id: int = Field(..., description="意见ID")
    rating: int = Field(..., description="评分1-5")
    comment: Optional[str] = Field(default=None, description="评价内容")


class AssignOpinionRequest(BaseModel):
    opinion_id: int = Field(..., description="意见ID")
    handler_id: int = Field(..., description="处理人ID")


class OpinionController:
    def __init__(self):
        self.opinion_business = OpinionBusiness()
        self.auth_business = AuthBusiness()

    def _get_current_user(self, request: Request, authorization: Optional[str] = None):
        if authorization and authorization.startswith('Bearer '):
            token = authorization[7:]
        else:
            token = request.query_params.get('token', '')
        return self.auth_business.verify_token(token)

    def ActionOpinionCategoriesGet(self, request: Request):
        """
        获取意见类别列表
        GET /api/opinion/categories/get
        """
        return self.opinion_business.get_categories()

    def ActionOpinionStaffGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取工作人员列表
        GET /api/opinion/staff/get
        """
        user = self._get_current_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}
        if user.get('role') not in ['admin']:
            return {'code': 1, 'message': '无权限', 'data': None}
        return self.opinion_business.get_staff_list()

    def ActionOpinionCreatePost(self, request: Request, body: CreateOpinionRequest, authorization: Optional[str] = Header(None)):
        """
        提交意见
        POST /api/opinion/create
        """
        user = self._get_current_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}
        
        return self.opinion_business.create_opinion(
            title=body.title,
            category=body.category,
            description=body.description,
            photos=body.photos,
            submitter_id=user.get('id'),
            submitter_name=user.get('real_name') or user.get('username'),
            community=user.get('community')
        )

    def ActionOpinionListGet(self, request: Request, 
                             category: Optional[str] = Query(None),
                             status: Optional[str] = Query(None),
                             keyword: Optional[str] = Query(None),
                             page: int = Query(1, ge=1),
                             page_size: int = Query(20, ge=1, le=100),
                             authorization: Optional[str] = Header(None)):
        """
        获取意见列表
        GET /api/opinion/list/get
        """
        user = self._get_current_user(request, authorization)
        user_id = user.get('id') if user else None
        user_role = user.get('role') if user else None
        
        return self.opinion_business.get_opinion_list(
            user_id=user_id,
            user_role=user_role,
            category=category,
            status=status,
            keyword=keyword,
            page=page,
            page_size=page_size
        )

    def ActionOpinionPendingGet(self, request: Request,
                                page: int = Query(1, ge=1),
                                page_size: int = Query(20, ge=1, le=100),
                                authorization: Optional[str] = Header(None)):
        """
        获取待认领意见列表
        GET /api/opinion/pending/get
        """
        user = self._get_current_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}
        if user.get('role') not in ['staff', 'admin']:
            return {'code': 1, 'message': '无权限', 'data': None}
        return self.opinion_business.get_pending_list(page, page_size)

    def ActionOpinionDetailGet(self, request: Request,
                               opinion_id: int = Query(..., ge=1),
                               authorization: Optional[str] = Header(None)):
        """
        获取意见详情
        GET /api/opinion/detail/get
        """
        user = self._get_current_user(request, authorization)
        user_id = user.get('id') if user else None
        user_role = user.get('role') if user else None
        return self.opinion_business.get_opinion_detail(opinion_id, user_id, user_role)

    def ActionOpinionClaimPost(self, request: Request,
                               opinion_id: int = Form(..., ge=1),
                               authorization: Optional[str] = Header(None)):
        """
        认领意见
        POST /api/opinion/claim
        """
        user = self._get_current_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}
        if user.get('role') not in ['staff', 'admin']:
            return {'code': 1, 'message': '无权限', 'data': None}
        return self.opinion_business.claim_opinion(
            opinion_id=opinion_id,
            handler_id=user.get('id'),
            handler_name=user.get('real_name') or user.get('username')
        )

    def ActionOpinionProcessPost(self, request: Request, body: ProcessOpinionRequest, authorization: Optional[str] = Header(None)):
        """
        处理意见（更新进度或完成处理）
        POST /api/opinion/process
        """
        user = self._get_current_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}
        if user.get('role') not in ['staff', 'admin']:
            return {'code': 1, 'message': '无权限', 'data': None}
        return self.opinion_business.process_opinion(
            opinion_id=body.opinion_id,
            handler_id=user.get('id'),
            handler_name=user.get('real_name') or user.get('username'),
            content=body.content,
            photos=body.photos,
            is_resolved=body.is_resolved
        )

    def ActionOpinionRatePost(self, request: Request, body: RateOpinionRequest, authorization: Optional[str] = Header(None)):
        """
        满意度评分
        POST /api/opinion/rate
        """
        user = self._get_current_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.opinion_business.rate_opinion(
            opinion_id=body.opinion_id,
            rater_id=user.get('id'),
            rater_name=user.get('real_name') or user.get('username'),
            rating=body.rating,
            comment=body.comment
        )

    def ActionOpinionEscalatePost(self, request: Request,
                                  opinion_id: int = Form(..., ge=1),
                                  authorization: Optional[str] = Header(None)):
        """
        升级督办
        POST /api/opinion/escalate
        """
        user = self._get_current_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}
        if user.get('role') != 'admin':
            return {'code': 1, 'message': '无权限', 'data': None}
        return self.opinion_business.escalate_opinion(
            opinion_id=opinion_id,
            operator_id=user.get('id'),
            operator_name=user.get('real_name') or user.get('username')
        )

    def ActionOpinionAssignPost(self, request: Request, body: AssignOpinionRequest, authorization: Optional[str] = Header(None)):
        """
        分配意见给工作人员
        POST /api/opinion/assign
        """
        user = self._get_current_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}
        if user.get('role') != 'admin':
            return {'code': 1, 'message': '无权限', 'data': None}
        return self.opinion_business.assign_opinion(
            opinion_id=body.opinion_id,
            handler_id=body.handler_id,
            operator_id=user.get('id'),
            operator_name=user.get('real_name') or user.get('username')
        )

    def ActionOpinionPublicGet(self, request: Request,
                               category: Optional[str] = Query(None),
                               page: int = Query(1, ge=1),
                               page_size: int = Query(20, ge=1, le=100)):
        """
        获取公示栏列表（公开的4星以上已解决意见）
        GET /api/opinion/public/get
        """
        return self.opinion_business.get_public_list(page, page_size, category)

    def ActionOpinionStatisticsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取统计数据
        GET /api/opinion/statistics/get
        """
        user = self._get_current_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}
        if user.get('role') != 'admin':
            return {'code': 1, 'message': '无权限', 'data': None}
        return self.opinion_business.get_statistics()

    def ActionOpinionReportGet(self, request: Request,
                               year: int = Query(..., ge=2000),
                               month: int = Query(..., ge=1, le=12),
                               authorization: Optional[str] = Header(None)):
        """
        生成月度报告
        GET /api/opinion/report/get
        """
        user = self._get_current_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}
        if user.get('role') != 'admin':
            return {'code': 1, 'message': '无权限', 'data': None}
        return self.opinion_business.generate_monthly_report(year, month)

    async def ActionOpinionUploadPost(self, request: Request, 
                                      files: List[UploadFile] = File(...),
                                      authorization: Optional[str] = Header(None)):
        """
        上传照片
        POST /api/opinion/upload
        """
        user = self._get_current_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}
        
        if len(files) > 5:
            return {'code': 1, 'message': '最多上传5张照片', 'data': None}
        
        upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'static', 'uploads')
        os.makedirs(upload_dir, exist_ok=True)
        
        urls = []
        for file in files:
            if not file.content_type or not file.content_type.startswith('image/'):
                continue
            ext = os.path.splitext(file.filename)[1] if file.filename else '.jpg'
            filename = f"{datetime.now().strftime('%Y%m%d')}_{uuid.uuid4().hex}{ext}"
            filepath = os.path.join(upload_dir, filename)
            content = await file.read()
            with open(filepath, 'wb') as f:
                f.write(content)
            urls.append(f"/static/uploads/{filename}")
        
        return {'code': 0, 'message': '上传成功', 'data': {'urls': urls}}

    def ActionOpinionCheckOverduePost(self, request: Request):
        """
        检查并自动升级逾期未认领的意见（可定时调用）
        POST /api/opinion/check/overdue
        """
        return self.opinion_business.check_and_escalate_overdue()
