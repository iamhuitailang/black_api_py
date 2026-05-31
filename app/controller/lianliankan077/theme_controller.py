from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateThemeRequest(BaseModel):
    name: str = Field(..., description="主题名称")
    icon: str = Field(..., description="主题图标")
    description: Optional[str] = Field(None, description="主题描述")
    items_json: str = Field(..., description="主题元素JSON")
    rows: Optional[int] = Field(4, description="行数")
    cols: Optional[int] = Field(6, description="列数")
    difficulty: Optional[int] = Field(1, description="难度")
    sort_order: Optional[int] = Field(0, description="排序")


class UpdateThemeRequest(BaseModel):
    name: Optional[str] = Field(None, description="主题名称")
    icon: Optional[str] = Field(None, description="主题图标")
    description: Optional[str] = Field(None, description="主题描述")
    items_json: Optional[str] = Field(None, description="主题元素JSON")
    rows: Optional[int] = Field(None, description="行数")
    cols: Optional[int] = Field(None, description="列数")
    difficulty: Optional[int] = Field(None, description="难度")
    sort_order: Optional[int] = Field(None, description="排序")


class LlkThemeController:
    def __init__(self):
        from app.business.lianliankan077.theme_business import LlkThemeBusiness
        self.theme_business = LlkThemeBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        from app.business.lianliankan077.admin_business import LlkAdminBusiness
        return LlkAdminBusiness().verify_token(token)

    def ActionLlkThemeListGet(self, request: Request):
        """
        获取活跃主题列表
        GET /api/lianliankan/theme/list/get
        """
        return self.theme_business.get_active_themes()

    def ActionLlkThemeDetailGet(self, request: Request, theme_id: int = Query(..., description="主题ID")):
        """
        获取主题详情
        GET /api/lianliankan/theme/detail/get
        """
        return self.theme_business.get_theme_by_id(theme_id)

    def ActionLlkThemeAllGet(self, request: Request,
                              page: int = Query(1, ge=1, description="页码"),
                              page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                              status: Optional[int] = Query(None, description="状态"),
                              authorization: Optional[str] = Header(None)):
        """
        获取所有主题（管理员）
        GET /api/lianliankan/theme/all/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.theme_business.get_theme_list(page, page_size, status)

    def ActionLlkThemeCreatePost(self, request: Request, body: CreateThemeRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        创建主题
        POST /api/lianliankan/theme/create
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.theme_business.create_theme(
            name=body.name, icon=body.icon,
            items_json=body.items_json,
            description=body.description or '',
            rows=body.rows or 4, cols=body.cols or 6,
            difficulty=body.difficulty or 1,
            sort_order=body.sort_order or 0
        )

    def ActionLlkThemeUpdatePost(self, request: Request, body: UpdateThemeRequest,
                                  theme_id: int = Query(..., description="主题ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        更新主题
        POST /api/lianliankan/theme/update
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        data = {k: v for k, v in body.model_dump().items() if v is not None}
        return self.theme_business.update_theme(theme_id, data)

    def ActionLlkThemeStatusUpdatePost(self, request: Request,
                                        theme_id: int = Query(..., description="主题ID"),
                                        status: int = Query(..., description="状态"),
                                        authorization: Optional[str] = Header(None)):
        """
        更新主题状态
        POST /api/lianliankan/theme/status/update
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.theme_business.update_theme_status(theme_id, status)

    def ActionLlkThemeDeletePost(self, request: Request, theme_id: int = Query(..., description="主题ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        删除主题
        POST /api/lianliankan/theme/delete
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.theme_business.delete_theme(theme_id)
