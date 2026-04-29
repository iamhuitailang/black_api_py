from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class JnMatchController:
    def __init__(self):
        from app.business.jn.match_business import JnMatchBusiness
        from app.business.jn.user_business import JnUserBusiness
        self.match_business = JnMatchBusiness()
        self.user_business = JnUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionJnMatchRecommendGet(self, request: Request,
                                    page: int = Query(1, description="页码"),
                                    page_size: int = Query(10, description="每页数量"),
                                    keyword: Optional[str] = Query(None, description="搜索关键词"),
                                    category: Optional[str] = Query(None, description="分类编码"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取匹配推荐接口
        GET /api/jn/match/recommend/get
        系统推荐技能互补的用户，支持关键词搜索和分类筛选
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.match_business.find_matches(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            keyword=keyword,
            category=category
        )

    def ActionJnMatchDetailGet(self, request: Request,
                                 user_id: int = Query(..., description="目标用户ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        获取匹配详情接口
        GET /api/jn/match/detail/get
        查看与指定用户的匹配详情
        """
        token = self._get_token_from_header(request, authorization)
        current_user = self._get_current_user(token)

        if not current_user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.match_business.get_match_detail(
            user_id=current_user.get('id'),
            other_user_id=user_id
        )
