from typing import Optional, Dict, Any
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateSettingRequest(BaseModel):
    setting_key: str = Field(..., description="配置键")
    setting_value: Optional[str] = Field(None, description="配置值")
    setting_name: Optional[str] = Field(None, description="配置名称")
    description: Optional[str] = Field(None, description="描述")
    group_name: Optional[str] = Field('default', description="分组")
    sort_order: Optional[int] = Field(0, description="排序")


class UpdateSettingRequest(BaseModel):
    setting_value: Optional[str] = Field(None, description="配置值")
    setting_name: Optional[str] = Field(None, description="配置名称")
    description: Optional[str] = Field(None, description="描述")
    group_name: Optional[str] = Field(None, description="分组")
    sort_order: Optional[int] = Field(None, description="排序")


class BatchUpdateSettingsRequest(BaseModel):
    settings: Dict[str, str] = Field(..., description="配置键值对")


class JianliSettingsController:
    def __init__(self):
        from app.business.jianli.system_settings_business import SystemSettingsBusiness
        from app.business.jianli.admin_business import AdminBusiness
        self.settings_business = SystemSettingsBusiness()
        self.admin_business = AdminBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_business.verify_token(token)

    def ActionJianliSettingsListGet(self, request: Request,
                                    page: int = Query(1, description="页码"),
                                    page_size: int = Query(100, description="每页数量"),
                                    group_name: Optional[str] = Query(None, description="分组"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取系统配置列表接口（管理员）
        GET /api/jianli/settings/list/get
        分页获取系统配置列表
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.settings_business.get_list(page, page_size, group_name)

    def ActionJianliSettingsAllGet(self, request: Request):
        """
        获取所有系统配置接口
        GET /api/jianli/settings/all/get
        获取所有系统配置键值对
        """
        return self.settings_business.get_all_dict()

    def ActionJianliSettingsDetailGet(self, request: Request,
                                       record_id: int = Query(..., description="配置ID"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取配置详情接口（管理员）
        GET /api/jianli/settings/detail/get
        根据ID获取配置详情
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.settings_business.get_by_id(record_id)

    def ActionJianliSettingsByKeyGet(self, request: Request,
                                      setting_key: str = Query(..., description="配置键"),
                                      authorization: Optional[str] = Header(None)):
        """
        根据键获取配置接口（管理员）
        GET /api/jianli/settings/by/key/get
        根据配置键获取配置详情
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.settings_business.get_by_key(setting_key)

    def ActionJianliSettingsValueGet(self, request: Request,
                                     setting_key: str = Query(..., description="配置键"),
                                     default_value: Optional[str] = Query('', description="默认值")):
        """
        获取配置值接口
        GET /api/jianli/settings/value/get
        获取配置值，不需要登录
        """
        return self.settings_business.get_value(setting_key, default_value)

    def ActionJianliSettingsCreatePost(self, request: Request, body: CreateSettingRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        创建配置接口（管理员）
        POST /api/jianli/settings/create
        创建新的系统配置
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.settings_business.create(
            setting_key=body.setting_key,
            setting_value=body.setting_value or '',
            setting_name=body.setting_name or '',
            description=body.description or '',
            group_name=body.group_name or 'default',
            sort_order=body.sort_order or 0
        )

    def ActionJianliSettingsUpdatePost(self, request: Request, body: UpdateSettingRequest,
                                        record_id: int = Query(..., description="配置ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        更新配置接口（管理员）
        POST /api/jianli/settings/update
        更新系统配置
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
        if body.setting_value is not None:
            data['setting_value'] = body.setting_value
        if body.setting_name is not None:
            data['setting_name'] = body.setting_name
        if body.description is not None:
            data['description'] = body.description
        if body.group_name is not None:
            data['group_name'] = body.group_name
        if body.sort_order is not None:
            data['sort_order'] = body.sort_order

        return self.settings_business.update(record_id, data)

    def ActionJianliSettingsValueUpdatePost(self, request: Request,
                                             setting_key: str = Query(..., description="配置键"),
                                             setting_value: str = Query(..., description="配置值"),
                                             authorization: Optional[str] = Header(None)):
        """
        更新配置值接口（管理员）
        POST /api/jianli/settings/value/update
        根据配置键直接更新配置值
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.settings_business.update_value(setting_key, setting_value)

    def ActionJianliSettingsBatchUpdatePost(self, request: Request, body: BatchUpdateSettingsRequest,
                                             authorization: Optional[str] = Header(None)):
        """
        批量更新配置接口（管理员）
        POST /api/jianli/settings/batch/update
        批量更新系统配置
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.settings_business.batch_update(body.settings)

    def ActionJianliSettingsDeletePost(self, request: Request,
                                        record_id: int = Query(..., description="配置ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        删除配置接口（管理员）
        POST /api/jianli/settings/delete
        删除指定系统配置
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.settings_business.delete(record_id)
