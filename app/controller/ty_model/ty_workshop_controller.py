from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class PublishWorkRequest(BaseModel):
    weapon_id: int = Field(..., description="武器ID")
    title: str = Field(..., description="作品标题")
    description: Optional[str] = Field('', description="作品描述")
    tags: Optional[str] = Field('', description="标签，用逗号分隔")


class UpdateWorkRequest(BaseModel):
    title: Optional[str] = Field(None, description="作品标题")
    description: Optional[str] = Field(None, description="作品描述")
    tags: Optional[str] = Field(None, description="标签，用逗号分隔")


class TyWorkshopController:
    def __init__(self):
        from app.business.ty_model.workshop_business import TyWorkshopBusiness
        self.workshop_business = TyWorkshopBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.ty_model.auth_business import TyAuthBusiness
        auth_business = TyAuthBusiness()
        return auth_business.verify_token(token)

    def ActionTyWorkshopPublishPost(self, request: Request, body: PublishWorkRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        发布作品到创意工坊接口
        POST /api/ty/workshop/publish
        将武器发布到创意工坊供其他玩家查看和复制
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.workshop_business.publish_work(
            user_id=user.get('id'),
            weapon_id=body.weapon_id,
            title=body.title,
            description=body.description,
            tags=body.tags
        )

    def ActionTyWorkshopListGet(self, request: Request, page: int = Query(1, description="页码"),
                                 page_size: int = Query(10, description="每页数量"),
                                 user_id: Optional[int] = Query(None, description="作者用户ID"),
                                 keyword: Optional[str] = Query(None, description="搜索关键词"),
                                 tag: Optional[str] = Query(None, description="标签"),
                                 sort_by: Optional[str] = Query('like_count', description="排序方式")):
        """
        获取创意工坊作品列表接口
        GET /api/ty/workshop/list
        分页获取创意工坊作品列表
        """
        return self.workshop_business.get_work_list(
            page=page,
            page_size=page_size,
            user_id=user_id,
            keyword=keyword,
            tag=tag,
            sort_by=sort_by
        )

    def ActionTyWorkshopDetailGet(self, request: Request, workshop_id: int = Query(..., description="作品ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取作品详情接口
        GET /api/ty/workshop/detail
        根据作品ID获取作品详情
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        current_user_id = user.get('id') if user else None

        return self.workshop_business.get_work_detail(workshop_id, current_user_id)

    def ActionTyWorkshopLikePost(self, request: Request, workshop_id: int = Query(..., description="作品ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        点赞作品接口
        POST /api/ty/workshop/like
        为创意工坊作品点赞
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.workshop_business.like_work(workshop_id, user.get('id'))

    def ActionTyWorkshopCopyPost(self, request: Request, workshop_id: int = Query(..., description="作品ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        复制武器接口
        POST /api/ty/workshop/copy
        消耗颜料和画布复制创意工坊中的武器
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.workshop_business.copy_weapon(workshop_id, user.get('id'))

    def ActionTyWorkshopUpdatePost(self, request: Request, workshop_id: int = Query(..., description="作品ID"),
                                    body: UpdateWorkRequest = None,
                                    authorization: Optional[str] = Header(None)):
        """
        更新作品信息接口
        POST /api/ty/workshop/update
        更新作品的标题、描述、标签等信息
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
        if body.title is not None:
            data['title'] = body.title
        if body.description is not None:
            data['description'] = body.description
        if body.tags is not None:
            data['tags'] = body.tags

        return self.workshop_business.update_work(workshop_id, user.get('id'), data)

    def ActionTyWorkshopDeletePost(self, request: Request, workshop_id: int = Query(..., description="作品ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        删除作品接口
        POST /api/ty/workshop/delete
        删除已发布的作品
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.workshop_business.delete_work(workshop_id, user.get('id'))

    def ActionTyWorkshopMyListGet(self, request: Request, page: int = Query(1, description="页码"),
                                   page_size: int = Query(10, description="每页数量"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取我的作品列表接口
        GET /api/ty/workshop/my/list
        分页获取当前用户发布的作品列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.workshop_business.get_user_works(user.get('id'), page, page_size)
