from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class StartResearchRequest(BaseModel):
    part_type: str = Field(..., description="研究部件类型")


class AddProgressRequest(BaseModel):
    research_id: int = Field(..., description="研究项目ID")
    exp_amount: float = Field(..., description="添加的经验值")


class CancelResearchRequest(BaseModel):
    research_id: int = Field(..., description="研究项目ID")


class ScResearchController:
    def __init__(self):
        from app.business.sc.sc_research_business import ScResearchBusiness
        self.research_business = ScResearchBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.sc.sc_user_business import ScUserBusiness
        user_business = ScUserBusiness()
        return user_business.verify_token(token)

    def ActionScResearchStartPost(self, request: Request, body: StartResearchRequest,
                                   authorization: Optional[str] = Header(None)):
        """
        开始研究接口
        POST /api/sc/research/start
        开始新的部件研究项目
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.research_business.start_research(
            user_id=user.get('id'),
            part_type=body.part_type
        )

    def ActionScResearchUserListGet(self, request: Request,
                                     authorization: Optional[str] = Header(None)):
        """
        获取用户研究列表接口
        GET /api/sc/research/user/list/get
        获取当前用户的所有研究项目列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': []
            }

        return self.research_business.get_user_research(
            user_id=user.get('id')
        )

    def ActionScResearchProgressAddPost(self, request: Request, body: AddProgressRequest,
                                         authorization: Optional[str] = Header(None)):
        """
        添加研究进度接口
        POST /api/sc/research/progress/add
        为研究项目添加经验值进度
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.research_business.add_progress(
            user_id=user.get('id'),
            research_id=body.research_id,
            exp_amount=body.exp_amount
        )

    def ActionScResearchDetailGet(self, request: Request, research_id: int = Query(..., description="研究项目ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取研究详情接口
        GET /api/sc/research/detail/get
        获取指定研究项目的详细信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.research_business.get_research_detail(
            research_id=research_id,
            user_id=user.get('id')
        )

    def ActionScResearchCancelPost(self, request: Request, body: CancelResearchRequest,
                                    authorization: Optional[str] = Header(None)):
        """
        取消研究接口
        POST /api/sc/research/cancel
        取消进行中的研究项目，返还50%金币
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.research_business.cancel_research(
            user_id=user.get('id'),
            research_id=body.research_id
        )
