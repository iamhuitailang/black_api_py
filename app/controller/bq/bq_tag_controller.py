from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateTagRequest(BaseModel):
    name: str = Field(..., description="标签名称")


class BqTagController:
    def __init__(self):
        from app.business.bq.tag_business import BqTagBusiness
        self.tag_business = BqTagBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.bq.user_business import BqUserBusiness
        user_business = BqUserBusiness()
        return user_business.verify_token(token)

    def ActionBqTagListGet(self, request: Request,
                           limit: int = Query(50, description="返回数量限制"),
                           authorization: Optional[str] = Header(None)):
        """
        获取标签列表接口
        GET /api/bq/tag/list
        获取用户标签列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.tag_business.get_list(user.get('id'), limit)

    def ActionBqTagSearchGet(self, request: Request,
                             keyword: str = Query(..., description="搜索关键词"),
                             limit: int = Query(20, description="返回数量限制"),
                             authorization: Optional[str] = Header(None)):
        """
        搜索标签接口
        GET /api/bq/tag/search
        按关键词搜索标签
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.tag_business.search(user.get('id'), keyword, limit)

    def ActionBqTagCreatePost(self, request: Request, body: CreateTagRequest,
                               authorization: Optional[str] = Header(None)):
        """
        创建标签接口
        POST /api/bq/tag/create
        创建新标签
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.tag_business.create(
            user_id=user.get('id'),
            name=body.name
        )

    def ActionBqTagDeletePost(self, request: Request, tag_id: int = Query(..., description="标签ID"),
                               authorization: Optional[str] = Header(None)):
        """
        删除标签接口
        POST /api/bq/tag/delete
        删除未使用的标签
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.tag_business.delete(user.get('id'), tag_id)
