from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateAIConfigRequest(BaseModel):
    name: str = Field(..., description="难度名称")
    level: int = Field(..., ge=1, le=10, description="难度等级")
    description: Optional[str] = Field(None, description="描述")
    search_depth: Optional[int] = Field(2, ge=1, le=10, description="搜索深度")
    think_time: Optional[int] = Field(1000, ge=100, le=30000, description="思考时间(ms)")
    sort_order: Optional[int] = Field(0, description="排序")


class UpdateAIConfigRequest(BaseModel):
    name: Optional[str] = Field(None, description="难度名称")
    level: Optional[int] = Field(None, ge=1, le=10, description="难度等级")
    description: Optional[str] = Field(None, description="描述")
    search_depth: Optional[int] = Field(None, ge=1, le=10, description="搜索深度")
    think_time: Optional[int] = Field(None, ge=100, le=30000, description="思考时间(ms)")
    status: Optional[int] = Field(None, description="状态")
    sort_order: Optional[int] = Field(None, description="排序")


class XiangqiAIConfigController:
    def __init__(self):
        from app.business.xiangqi077_model.ai_config_business import XiangqiAIConfigBusiness
        self.ai_config_business = XiangqiAIConfigBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        from app.business.xiangqi077_model.admin_business import XiangqiAdminBusiness
        return XiangqiAdminBusiness().verify_token(token)

    def ActionXiangqiAiConfigEnabledListGet(self, request: Request):
        """获取启用的AI配置列表（用户端）"""
        return self.ai_config_business.get_enabled_configs()

    def ActionXiangqiAiConfigListGet(self, request: Request,
                                      page: int = Query(1, ge=1),
                                      page_size: int = Query(10, ge=1, le=100),
                                      authorization: Optional[str] = Header(None)):
        """管理员获取AI配置列表"""
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.ai_config_business.get_all_configs(page=page, page_size=page_size)

    def ActionXiangqiAiConfigDetailGet(self, request: Request, config_id: int,
                                        authorization: Optional[str] = Header(None)):
        """获取AI配置详情"""
        return self.ai_config_business.get_config(config_id=config_id)

    def ActionXiangqiAiConfigCreatePost(self, request: Request, body: CreateAIConfigRequest,
                                         authorization: Optional[str] = Header(None)):
        """创建AI配置"""
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.ai_config_business.create_config(
            name=body.name,
            level=body.level,
            description=body.description or '',
            search_depth=body.search_depth or 2,
            think_time=body.think_time or 1000,
            sort_order=body.sort_order or 0
        )

    def ActionXiangqiAiConfigUpdatePost(self, request: Request, config_id: int, body: UpdateAIConfigRequest,
                                         authorization: Optional[str] = Header(None)):
        """更新AI配置"""
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        data = {k: v for k, v in body.model_dump().items() if v is not None}
        return self.ai_config_business.update_config(config_id=config_id, data=data)

    def ActionXiangqiAiConfigDeletePost(self, request: Request, config_id: int,
                                         authorization: Optional[str] = Header(None)):
        """删除AI配置"""
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.ai_config_business.delete_config(config_id=config_id)

    def ActionXiangqiAiConfigEnablePost(self, request: Request, config_id: int,
                                         authorization: Optional[str] = Header(None)):
        """启用AI配置"""
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.ai_config_business.enable_config(config_id=config_id)

    def ActionXiangqiAiConfigDisablePost(self, request: Request, config_id: int,
                                          authorization: Optional[str] = Header(None)):
        """禁用AI配置"""
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.ai_config_business.disable_config(config_id=config_id)
