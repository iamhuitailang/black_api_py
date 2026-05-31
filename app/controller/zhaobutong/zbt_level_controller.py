from typing import Optional, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateLevelRequest(BaseModel):
    name: str = Field(..., description="关卡名称")
    theme: str = Field('nature', description="主题")
    difficulty: int = Field(1, description="难度")
    image_original: str = Field('', description="原图路径")
    image_modified: str = Field('', description="修改图路径")
    difference_count: int = Field(5, description="不同点数量")
    time_limit: int = Field(120, description="时间限制(秒)")
    hint_count: int = Field(3, description="提示次数")
    sort_order: int = Field(0, description="排序")
    differences: Optional[List[dict]] = Field(None, description="不同点列表")


class UpdateLevelRequest(BaseModel):
    level_id: int = Field(..., description="关卡ID")
    name: Optional[str] = Field(None, description="关卡名称")
    theme: Optional[str] = Field(None, description="主题")
    difficulty: Optional[int] = Field(None, description="难度")
    image_original: Optional[str] = Field(None, description="原图路径")
    image_modified: Optional[str] = Field(None, description="修改图路径")
    difference_count: Optional[int] = Field(None, description="不同点数量")
    time_limit: Optional[int] = Field(None, description="时间限制(秒)")
    hint_count: Optional[int] = Field(None, description="提示次数")
    status: Optional[int] = Field(None, description="状态")
    sort_order: Optional[int] = Field(None, description="排序")
    differences: Optional[List[dict]] = Field(None, description="不同点列表")


class AddDifferenceRequest(BaseModel):
    level_id: int = Field(..., description="关卡ID")
    x: int = Field(..., description="X坐标")
    y: int = Field(..., description="Y坐标")
    radius: int = Field(25, description="半径")
    description: str = Field('', description="描述")


class UpdateDifferenceRequest(BaseModel):
    diff_id: int = Field(..., description="不同点ID")
    x: Optional[int] = Field(None, description="X坐标")
    y: Optional[int] = Field(None, description="Y坐标")
    radius: Optional[int] = Field(None, description="半径")
    description: Optional[str] = Field(None, description="描述")


class DeleteLevelRequest(BaseModel):
    level_id: int = Field(..., description="关卡ID")


class LevelStatusRequest(BaseModel):
    level_id: int = Field(..., description="关卡ID")
    status: int = Field(..., description="状态")


class DeleteDifferenceRequest(BaseModel):
    diff_id: int = Field(..., description="不同点ID")


class ZbtLevelController:
    def __init__(self):
        from app.business.zhaobutong.level_business import ZbtLevelBusiness
        from app.business.zhaobutong.user_business import ZbtUserBusiness
        self.level_business = ZbtLevelBusiness()
        self.user_business = ZbtUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def _is_admin(self, token: str) -> bool:
        user = self._get_current_user(token)
        return user is not None and user.get('role') == 1

    def ActionZbtLevelActiveListGet(self, request: Request,
                                     theme: Optional[str] = Query(None, description="主题"),
                                     difficulty: Optional[int] = Query(None, description="难度")):
        """
        获取可用关卡列表接口
        GET /api/zbt/level/active/list/get
        获取所有启用的关卡
        """
        return self.level_business.get_active_levels(theme, difficulty)

    def ActionZbtLevelDetailGet(self, request: Request, level_id: int = Query(..., description="关卡ID")):
        """
        获取关卡详情接口
        GET /api/zbt/level/detail/get
        根据关卡ID获取详情
        """
        return self.level_business.get_level_detail(level_id)

    def ActionZbtLevelThemesGet(self, request: Request):
        """
        获取主题列表接口
        GET /api/zbt/level/themes/get
        获取所有可选主题
        """
        return self.level_business.get_themes()

    def ActionZbtLevelDifferencesGet(self, request: Request, level_id: int = Query(..., description="关卡ID")):
        """
        获取关卡不同点列表接口
        GET /api/zbt/level/differences/get
        根据关卡ID获取不同点坐标列表
        """
        return self.level_business.get_level_differences(level_id)

    def ActionZbtLevelListGet(self, request: Request,
                               page: int = Query(1, ge=1, description="页码"),
                               page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                               theme: Optional[str] = Query(None, description="主题"),
                               difficulty: Optional[int] = Query(None, description="难度"),
                               status: Optional[int] = Query(None, description="状态"),
                               keyword: Optional[str] = Query(None, description="搜索关键词"),
                               authorization: Optional[str] = Header(None)):
        """
        管理员获取关卡列表接口
        GET /api/zbt/level/list/get
        管理员获取所有关卡（含禁用）
        """
        token = self._get_token_from_header(request, authorization)
        if not self._is_admin(token):
            return {'code': 1, 'msg': '需要管理员权限', 'data': None}
        return self.level_business.get_level_list(theme, difficulty, status, keyword, page, page_size)

    def ActionZbtLevelCreatePost(self, request: Request, body: CreateLevelRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        创建关卡接口
        POST /api/zbt/level/create
        管理员创建新关卡
        """
        token = self._get_token_from_header(request, authorization)
        if not self._is_admin(token):
            return {'code': 1, 'msg': '需要管理员权限', 'data': None}
        data = body.model_dump()
        return self.level_business.create_level(data)

    def ActionZbtLevelUpdatePost(self, request: Request, body: UpdateLevelRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        更新关卡接口
        POST /api/zbt/level/update
        管理员更新关卡信息
        """
        token = self._get_token_from_header(request, authorization)
        if not self._is_admin(token):
            return {'code': 1, 'msg': '需要管理员权限', 'data': None}
        level_id = body.level_id
        data = {k: v for k, v in body.model_dump().items() if v is not None and k != 'level_id'}
        return self.level_business.update_level(level_id, data)

    def ActionZbtLevelDeletePost(self, request: Request, body: DeleteLevelRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        删除关卡接口
        POST /api/zbt/level/delete
        管理员删除关卡
        """
        token = self._get_token_from_header(request, authorization)
        if not self._is_admin(token):
            return {'code': 1, 'msg': '需要管理员权限', 'data': None}
        return self.level_business.delete_level(body.level_id)

    def ActionZbtLevelStatusUpdatePost(self, request: Request, body: LevelStatusRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        更新关卡状态接口
        POST /api/zbt/level/status/update
        管理员启用/禁用关卡
        """
        token = self._get_token_from_header(request, authorization)
        if not self._is_admin(token):
            return {'code': 1, 'msg': '需要管理员权限', 'data': None}
        return self.level_business.update_level_status(body.level_id, body.status)

    def ActionZbtLevelDifferenceAddPost(self, request: Request, body: AddDifferenceRequest,
                                         authorization: Optional[str] = Header(None)):
        """
        添加不同点接口
        POST /api/zbt/level/difference/add
        管理员为关卡添加不同点
        """
        token = self._get_token_from_header(request, authorization)
        if not self._is_admin(token):
            return {'code': 1, 'msg': '需要管理员权限', 'data': None}
        return self.level_business.add_difference(
            body.level_id, body.x, body.y, body.radius, body.description
        )

    def ActionZbtLevelDifferenceDeletePost(self, request: Request, body: DeleteDifferenceRequest,
                                             authorization: Optional[str] = Header(None)):
        """
        删除不同点接口
        POST /api/zbt/level/difference/delete
        管理员删除不同点
        """
        token = self._get_token_from_header(request, authorization)
        if not self._is_admin(token):
            return {'code': 1, 'msg': '需要管理员权限', 'data': None}
        return self.level_business.delete_difference(body.diff_id)

    def ActionZbtLevelDifferenceUpdatePost(self, request: Request, body: UpdateDifferenceRequest,
                                            authorization: Optional[str] = Header(None)):
        """
        更新不同点接口
        POST /api/zbt/level/difference/update
        管理员更新不同点坐标信息
        """
        token = self._get_token_from_header(request, authorization)
        if not self._is_admin(token):
            return {'code': 1, 'msg': '需要管理员权限', 'data': None}
        diff_id = body.diff_id
        data = {k: v for k, v in body.model_dump().items() if v is not None and k != 'diff_id'}
        return self.level_business.update_difference(diff_id, data)
