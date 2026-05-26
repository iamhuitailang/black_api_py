from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field

from app.business.blog import BlogShareBusiness, BlogAuthBusiness


class GenerateShareRequest(BaseModel):
    type: str = Field(..., description="分享类型: post/category/tag/profile")
    id: Optional[int] = Field(None, description="目标 ID")


class BlogShareController:
    def __init__(self):
        self.share_business = BlogShareBusiness()
        self.auth_business = BlogAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def ActionBlogShareGeneratePost(self, request: Request, body: GenerateShareRequest, authorization: Optional[str] = Header(None)):
        """
        生成分享链接
        POST /api/blog/share/generate
        """
        token = self._get_token_from_header(request, authorization)
        user = self.auth_business.verify_token(token)
        created_by = user.get('id') if user else None
        return self.share_business.generate_share(
            share_type=body.type,
            target_id=body.id,
            created_by=created_by
        )

    def ActionBlogShareInfoGet(self, request: Request, code: str = Query(..., description="分享码")):
        """
        获取分享信息
        GET /api/blog/share/info/get
        """
        return self.share_business.get_share_info(share_code=code)
