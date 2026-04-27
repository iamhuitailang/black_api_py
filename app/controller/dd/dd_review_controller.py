from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class SubmitReviewRequest(BaseModel):
    task_id: int = Field(..., description="任务ID")
    rating: int = Field(..., ge=1, le=5, description="评分：1-5星")
    content: Optional[str] = Field('', description="评价内容")


class DdReviewController:
    def __init__(self):
        from app.business.dd.review_business import DdReviewBusiness
        from app.business.dd.user_business import DdUserBusiness
        self.review_business = DdReviewBusiness()
        self.user_business = DdUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        
        token = request.query_params.get('token')
        if token:
            return token
        
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionDdReviewMarkCompletePost(self, request: Request, task_id: int = Query(..., description="任务ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        标记任务完成接口
        POST /api/dd/review/mark/complete
        接单者标记任务完成
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.review_business.mark_complete(user.get('id'), task_id)

    def ActionDdReviewConfirmCompletePost(self, request: Request, task_id: int = Query(..., description="任务ID"),
                                           authorization: Optional[str] = Header(None)):
        """
        确认任务完成接口
        POST /api/dd/review/confirm/complete
        发布者确认任务完成
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.review_business.confirm_complete(user.get('id'), task_id)

    def ActionDdReviewSubmitPost(self, request: Request, body: SubmitReviewRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        提交评价接口
        POST /api/dd/review/submit
        对已完成的任务进行评价
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.review_business.submit_review(
            user_id=user.get('id'),
            task_id=body.task_id,
            rating=body.rating,
            content=body.content
        )

    def ActionDdReviewTaskListGet(self, request: Request, task_id: int = Query(..., description="任务ID")):
        """
        获取任务评价列表接口
        GET /api/dd/review/task/list/get
        获取某个任务的所有评价
        """
        return self.review_business.get_task_reviews(task_id)

    def ActionDdReviewUserListGet(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                   page: int = Query(1, ge=1, description="页码"),
                                   page_size: int = Query(10, ge=1, le=100, description="每页数量")):
        """
        获取用户评价列表接口
        GET /api/dd/review/user/list/get
        获取某个用户收到的所有评价
        """
        return self.review_business.get_user_reviews(user_id, page, page_size)

    def ActionDdReviewStatusGet(self, request: Request, task_id: int = Query(..., description="任务ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        检查评价状态接口
        GET /api/dd/review/status/get
        检查当前用户对某个任务的评价状态
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.review_business.check_review_status(user.get('id'), task_id)
