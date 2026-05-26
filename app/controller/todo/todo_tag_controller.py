from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateTagRequest(BaseModel):
    name: str = Field(..., description="标签名称")
    color: Optional[str] = Field('#67C23A', description="标签颜色")


class UpdateTagRequest(BaseModel):
    name: Optional[str] = Field(None, description="标签名称")
    color: Optional[str] = Field(None, description="标签颜色")


class TodoTagController:
    def __init__(self):
        from app.business.todo.todo_tag_business import TodoTagBusiness
        from app.business.todo.todo_auth_business import TodoAuthBusiness
        self.tag_business = TodoTagBusiness()
        self.auth_business = TodoAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.auth_business.verify_token(token)

    def ActionTodoTagCreatePost(self, request: Request, body: CreateTagRequest,
                                 authorization: Optional[str] = Header(None)):
        """
        创建标签接口
        POST /api/todo/tag/create
        创建新的任务标签
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
            name=body.name,
            color=body.color or '#67C23A'
        )

    def ActionTodoTagUpdatePost(self, request: Request, body: UpdateTagRequest,
                                 tag_id: int = Query(..., description="标签ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        更新标签接口
        POST /api/todo/tag/update
        更新标签信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.color is not None:
            data['color'] = body.color

        return self.tag_business.update(tag_id, user.get('id'), data)

    def ActionTodoTagDeletePost(self, request: Request, tag_id: int = Query(..., description="标签ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        删除标签接口
        POST /api/todo/tag/delete
        删除标签
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.tag_business.delete(tag_id, user.get('id'))

    def ActionTodoTagAllGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取所有标签接口
        GET /api/todo/tag/all/get
        获取当前用户的所有标签
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.tag_business.get_all(user.get('id'))
