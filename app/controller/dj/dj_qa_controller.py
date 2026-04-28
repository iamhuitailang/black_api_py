from typing import Optional
from fastapi import APIRouter, Query, Request, Header
from pydantic import BaseModel, Field
from app.business.dj import DjQABusiness, DjAuthBusiness


class CreateQuestionRequest(BaseModel):
    market_id: Optional[int] = Field(None, description="集市ID")
    question: str = Field(..., description="问题内容")


class AnswerQuestionRequest(BaseModel):
    qa_id: int = Field(..., description="问题ID")
    answer: str = Field(..., description="回答内容")


class UpdateQAStatusRequest(BaseModel):
    qa_id: int = Field(..., description="问题ID")
    status: int = Field(..., description="状态")


class DjQAController:
    def __init__(self):
        self.qa_business = DjQABusiness()
        self.auth_business = DjAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _verify_auth(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self.auth_business.verify_token(token)
        if not user:
            return None
        return user

    def ActionDjQaCreatePost(self, request: Request, body: CreateQuestionRequest, authorization: Optional[str] = Header(None)):
        """
        提问接口
        POST /api/dj/qa/create
        用户发布问题
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {
            'market_id': body.market_id,
            'question': body.question
        }

        return self.qa_business.create_question(user.get('id'), data)

    def ActionDjQaDetailGet(self, request: Request, qa_id: int = Query(..., description="问题ID")):
        """
        获取问题详情接口
        GET /api/dj/qa/detail
        获取问题详情
        """
        return self.qa_business.get_qa_detail(qa_id)

    def ActionDjQaMarketGet(self, request: Request, market_id: int = Query(..., description="集市ID"), page: int = Query(1, description="页码"), page_size: int = Query(10, description="每页数量")):
        """
        获取集市问答列表接口
        GET /api/dj/qa/market
        获取集市的问答列表
        """
        return self.qa_business.get_market_questions(market_id, page, page_size)

    def ActionDjQaMyGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取我的提问接口
        GET /api/dj/qa/my
        获取当前用户的提问列表
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.qa_business.get_user_questions(user.get('id'))

    def ActionDjQaPendingGet(self, request: Request, limit: int = Query(20, description="数量"), authorization: Optional[str] = Header(None)):
        """
        获取待回答问题接口
        GET /api/dj/qa/pending
        获取待回答的问题列表
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.qa_business.get_pending_questions(limit)

    def ActionDjQaRecentGet(self, request: Request, limit: int = Query(20, description="数量")):
        """
        获取最近问题接口
        GET /api/dj/qa/recent
        获取最近的问题列表
        """
        return self.qa_business.get_recent_questions(limit)

    def ActionDjQaAnswerPost(self, request: Request, body: AnswerQuestionRequest, authorization: Optional[str] = Header(None)):
        """
        回答问题接口
        POST /api/dj/qa/answer
        回答用户问题
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.qa_business.answer_question(body.qa_id, body.answer, user.get('id'))

    def ActionDjQaSearchGet(self, request: Request, keyword: str = Query(..., description="搜索关键词"), limit: int = Query(20, description="数量")):
        """
        搜索问题接口
        GET /api/dj/qa/search
        搜索问题
        """
        return self.qa_business.search_questions(keyword, limit)

    def ActionDjQaStatusUpdatePost(self, request: Request, body: UpdateQAStatusRequest, authorization: Optional[str] = Header(None)):
        """
        更新问题状态接口
        POST /api/dj/qa/status/update
        更新问题状态
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.qa_business.update_status(body.qa_id, body.status)

    def ActionDjQaDeletePost(self, request: Request, qa_id: int = Query(..., description="问题ID"), authorization: Optional[str] = Header(None)):
        """
        删除问题接口
        POST /api/dj/qa/delete
        删除问题
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.qa_business.delete_question(qa_id, user.get('id'))

    def ActionDjQaListGet(self, request: Request, page: int = Query(1, description="页码"), page_size: int = Query(10, description="每页数量"), status: Optional[int] = Query(None, description="状态"), is_answered: Optional[int] = Query(None, description="是否已回答"), authorization: Optional[str] = Header(None)):
        """
        获取所有问题列表接口
        GET /api/dj/qa/list
        分页获取所有问题列表（管理端使用）
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.qa_business.get_all_questions(page, page_size, status, is_answered)

    def ActionDjQaStatisticsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取问答统计接口
        GET /api/dj/qa/statistics
        获取问答统计数据
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.qa_business.get_statistics()
