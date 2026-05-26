from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateTemplateRequest(BaseModel):
    name: str = Field(..., description="模板名称")
    category_id: int = Field(..., description="分类ID")
    category_code: Optional[str] = Field(None, description="分类编码")
    description: Optional[str] = Field(None, description="描述")
    thumbnail: Optional[str] = Field(None, description="缩略图")
    preview_url: Optional[str] = Field(None, description="预览URL")
    style_config: Optional[str] = Field(None, description="样式配置")
    sort_order: Optional[int] = Field(0, description="排序")


class UpdateTemplateRequest(BaseModel):
    name: Optional[str] = Field(None, description="模板名称")
    category_id: Optional[int] = Field(None, description="分类ID")
    description: Optional[str] = Field(None, description="描述")
    thumbnail: Optional[str] = Field(None, description="缩略图")
    preview_url: Optional[str] = Field(None, description="预览URL")
    style_config: Optional[str] = Field(None, description="样式配置")
    sort_order: Optional[int] = Field(None, description="排序")


class CreateCategoryRequest(BaseModel):
    name: str = Field(..., description="分类名称")
    code: str = Field(..., description="分类编码")
    description: Optional[str] = Field(None, description="描述")
    sort_order: Optional[int] = Field(0, description="排序")


class UpdateCategoryRequest(BaseModel):
    name: Optional[str] = Field(None, description="分类名称")
    code: Optional[str] = Field(None, description="分类编码")
    description: Optional[str] = Field(None, description="描述")
    sort_order: Optional[int] = Field(None, description="排序")
    status: Optional[int] = Field(None, description="状态")


class JianliTemplateController:
    def __init__(self):
        from app.business.jianli.template_business import TemplateBusiness
        from app.business.jianli.template_category_business import TemplateCategoryBusiness
        from app.business.jianli.admin_business import AdminBusiness
        from app.business.jianli.user_business import UserBusiness
        self.template_business = TemplateBusiness()
        self.category_business = TemplateCategoryBusiness()
        self.admin_business = AdminBusiness()
        self.user_business = UserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_business.verify_token(token)

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionJianliTemplateCategoryListGet(self, request: Request,
                                             page: int = Query(1, description="页码"),
                                             page_size: int = Query(100, description="每页数量"),
                                             status: Optional[int] = Query(None, description="状态"),
                                             keyword: Optional[str] = Query(None, description="关键词"),
                                             authorization: Optional[str] = Header(None)):
        """
        获取模板分类列表接口
        GET /api/jianli/template/category/list/get
        分页获取模板分类列表
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return self.category_business.get_all_active()

        return self.category_business.get_list(page, page_size, status, keyword)

    def ActionJianliTemplateCategoryAllGet(self, request: Request):
        """
        获取所有启用的模板分类接口
        GET /api/jianli/template/category/all/get
        获取所有启用的模板分类
        """
        return self.category_business.get_all_active()

    def ActionJianliTemplateCategoryCreatePost(self, request: Request, body: CreateCategoryRequest,
                                                 authorization: Optional[str] = Header(None)):
        """
        创建模板分类接口（管理员）
        POST /api/jianli/template/category/create
        创建新的模板分类
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.category_business.create(
            name=body.name,
            code=body.code,
            description=body.description or '',
            sort_order=body.sort_order or 0
        )

    def ActionJianliTemplateCategoryUpdatePost(self, request: Request, body: UpdateCategoryRequest,
                                                 category_id: int = Query(..., description="分类ID"),
                                                 authorization: Optional[str] = Header(None)):
        """
        更新模板分类接口（管理员）
        POST /api/jianli/template/category/update
        更新模板分类信息
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.code is not None:
            data['code'] = body.code
        if body.description is not None:
            data['description'] = body.description
        if body.sort_order is not None:
            data['sort_order'] = body.sort_order
        if body.status is not None:
            data['status'] = body.status

        return self.category_business.update(category_id, data)

    def ActionJianliTemplateCategoryDeletePost(self, request: Request,
                                                 category_id: int = Query(..., description="分类ID"),
                                                 authorization: Optional[str] = Header(None)):
        """
        删除模板分类接口（管理员）
        POST /api/jianli/template/category/delete
        删除指定模板分类
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.category_business.delete(category_id)

    def ActionJianliTemplateListGet(self, request: Request,
                                     page: int = Query(1, description="页码"),
                                     page_size: int = Query(100, description="每页数量"),
                                     status: Optional[int] = Query(None, description="状态"),
                                     category_id: Optional[int] = Query(None, description="分类ID"),
                                     category_code: Optional[str] = Query(None, description="分类编码"),
                                     keyword: Optional[str] = Query(None, description="关键词"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取模板列表接口
        GET /api/jianli/template/list/get
        分页获取模板列表，管理员可看全部，用户只看已上架
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if admin:
            return self.template_business.get_list(page, page_size, status, category_id, keyword)
        else:
            if category_id:
                return self.template_business.get_published(page, page_size, category_id=category_id)
            elif category_code:
                return self.template_business.get_published(page, page_size, category_code=category_code)
            else:
                return self.template_business.get_published(page, page_size)

    def ActionJianliTemplateDetailGet(self, request: Request,
                                       template_id: int = Query(..., description="模板ID"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取模板详情接口
        GET /api/jianli/template/detail/get
        根据ID获取模板详情
        """
        return self.template_business.get_by_id(template_id)

    def ActionJianliTemplateCreatePost(self, request: Request, body: CreateTemplateRequest,
                                         authorization: Optional[str] = Header(None)):
        """
        创建模板接口（管理员）
        POST /api/jianli/template/create
        创建新模板
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.template_business.create(
            name=body.name,
            category_id=body.category_id,
            category_code=body.category_code or '',
            description=body.description or '',
            thumbnail=body.thumbnail or '',
            preview_url=body.preview_url or '',
            style_config=body.style_config or '',
            sort_order=body.sort_order or 0
        )

    def ActionJianliTemplateUpdatePost(self, request: Request, body: UpdateTemplateRequest,
                                         template_id: int = Query(..., description="模板ID"),
                                         authorization: Optional[str] = Header(None)):
        """
        更新模板接口（管理员）
        POST /api/jianli/template/update
        更新模板信息
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.category_id is not None:
            data['category_id'] = body.category_id
        if body.description is not None:
            data['description'] = body.description
        if body.thumbnail is not None:
            data['thumbnail'] = body.thumbnail
        if body.preview_url is not None:
            data['preview_url'] = body.preview_url
        if body.style_config is not None:
            data['style_config'] = body.style_config
        if body.sort_order is not None:
            data['sort_order'] = body.sort_order

        return self.template_business.update(template_id, data)

    def ActionJianliTemplatePublishPost(self, request: Request,
                                          template_id: int = Query(..., description="模板ID"),
                                          authorization: Optional[str] = Header(None)):
        """
        模板上架接口（管理员）
        POST /api/jianli/template/publish
        将模板上架，用户可使用
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.template_business.publish(template_id)

    def ActionJianliTemplateUnpublishPost(self, request: Request,
                                            template_id: int = Query(..., description="模板ID"),
                                            authorization: Optional[str] = Header(None)):
        """
        模板下架接口（管理员）
        POST /api/jianli/template/unpublish
        将模板下架，用户无法使用
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.template_business.unpublish(template_id)

    def ActionJianliTemplateDeletePost(self, request: Request,
                                        template_id: int = Query(..., description="模板ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        删除模板接口（管理员）
        POST /api/jianli/template/delete
        删除指定模板
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.template_business.delete(template_id)
