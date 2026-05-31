from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class CreateAdminRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")
    real_name: Optional[str] = Field(None, description="真实姓名")
    role: Optional[int] = Field(1, description="角色：0超级管理员，1普通管理员")


class CreateAchievementRequest(BaseModel):
    name: str = Field(..., description="成就名称")
    description: Optional[str] = Field('', description="成就描述")
    type: Optional[int] = Field(0, description="成就类型")
    condition_value: Optional[int] = Field(0, description="条件值")
    reward_coins: Optional[int] = Field(0, description="奖励金币")
    reward_exp: Optional[int] = Field(0, description="奖励经验")
    icon: Optional[str] = Field('', description="图标")


class UpdateAchievementRequest(BaseModel):
    id: int = Field(..., description="成就ID")
    name: Optional[str] = Field(None, description="成就名称")
    description: Optional[str] = Field(None, description="成就描述")
    type: Optional[int] = Field(None, description="成就类型")
    condition_value: Optional[int] = Field(None, description="条件值")
    reward_coins: Optional[int] = Field(None, description="奖励金币")
    reward_exp: Optional[int] = Field(None, description="奖励经验")
    icon: Optional[str] = Field(None, description="图标")
    status: Optional[int] = Field(None, description="状态")


class CreateAiConfigRequest(BaseModel):
    name: str = Field(..., description="配置名称")
    difficulty: int = Field(..., description="难度：0简单，1普通，2困难")
    description: Optional[str] = Field('', description="描述")
    think_time: Optional[int] = Field(1000, description="思考时间(ms)")
    bomb_probability: Optional[float] = Field(0.3, description="炸弹概率")
    single_probability: Optional[float] = Field(0.5, description="单牌概率")
    is_default: Optional[int] = Field(0, description="是否默认")


class UpdateAiConfigRequest(BaseModel):
    id: int = Field(..., description="配置ID")
    name: Optional[str] = Field(None, description="配置名称")
    difficulty: Optional[int] = Field(None, description="难度")
    description: Optional[str] = Field(None, description="描述")
    think_time: Optional[int] = Field(None, description="思考时间(ms)")
    bomb_probability: Optional[float] = Field(None, description="炸弹概率")
    single_probability: Optional[float] = Field(None, description="单牌概率")
    is_default: Optional[int] = Field(None, description="是否默认")
    status: Optional[int] = Field(None, description="状态")


class DoudizhuAdminController:
    def __init__(self):
        from app.business.doudizhu_model.admin_business import DoudizhuAdminBusiness
        from app.business.doudizhu_model.user_business import DoudizhuUserBusiness
        from app.business.doudizhu_model.achievement_business import DoudizhuAchievementBusiness
        from app.business.doudizhu_model.ai_config_business import DoudizhuAiConfigBusiness
        from app.business.doudizhu_model.stats_business import DoudizhuStatsBusiness
        self.admin_business = DoudizhuAdminBusiness()
        self.user_business = DoudizhuUserBusiness()
        self.achievement_business = DoudizhuAchievementBusiness()
        self.ai_config_business = DoudizhuAiConfigBusiness()
        self.stats_business = DoudizhuStatsBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_business.verify_token(token)

    def ActionDoudizhuModelAdminLoginPost(self, request: Request, body: AdminLoginRequest):
        """
        管理员登录接口
        POST /api/doudizhu_model/admin/login
        管理员登录，返回管理员信息和token
        """
        return self.admin_business.login(
            username=body.username,
            password=body.password
        )

    def ActionDoudizhuModelAdminLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        管理员登出接口
        POST /api/doudizhu_model/admin/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.admin_business.logout(token)

    def ActionDoudizhuModelAdminCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前管理员信息接口
        GET /api/doudizhu_model/admin/current/get
        根据token获取当前登录管理员信息
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': admin
        }

    def ActionDoudizhuModelAdminCreatePost(self, request: Request, body: CreateAdminRequest,
                                            authorization: Optional[str] = Header(None)):
        """
        创建管理员接口
        POST /api/doudizhu_model/admin/create
        创建新的管理员账号
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin or admin.get('role') != 0:
            return {
                'code': 1,
                'msg': '没有权限',
                'data': None
            }

        return self.admin_business.create_admin(
            username=body.username,
            password=body.password,
            real_name=body.real_name or '',
            role=body.role or 1
        )

    def ActionDoudizhuModelAdminListGet(self, request: Request, page: int = Query(1, description="页码"),
                                         page_size: int = Query(10, description="每页数量"),
                                         authorization: Optional[str] = Header(None)):
        """
        获取管理员列表接口
        GET /api/doudizhu_model/admin/list/get
        获取管理员列表
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin or admin.get('role') != 0:
            return {
                'code': 1,
                'msg': '没有权限',
                'data': None
            }

        return self.admin_business.get_admin_list(page, page_size)

    def ActionDoudizhuModelAdminStatusUpdatePost(self, request: Request, admin_id: int = Query(..., description="管理员ID"),
                                                  status: int = Query(..., description="状态"),
                                                  authorization: Optional[str] = Header(None)):
        """
        更新管理员状态接口
        POST /api/doudizhu_model/admin/status/update
        启用或禁用管理员
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin or admin.get('role') != 0:
            return {
                'code': 1,
                'msg': '没有权限',
                'data': None
            }

        return self.admin_business.update_admin_status(admin_id, status)

    def ActionDoudizhuModelAdminDeletePost(self, request: Request, admin_id: int = Query(..., description="管理员ID"),
                                            authorization: Optional[str] = Header(None)):
        """
        删除管理员接口
        POST /api/doudizhu_model/admin/delete
        删除管理员账号
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin or admin.get('role') != 0:
            return {
                'code': 1,
                'msg': '没有权限',
                'data': None
            }

        return self.admin_business.delete_admin(admin_id)

    def ActionDoudizhuModelAdminUserListGet(self, request: Request, page: int = Query(1, description="页码"),
                                             page_size: int = Query(10, description="每页数量"),
                                             status: Optional[int] = Query(None, description="状态"),
                                             keyword: Optional[str] = Query(None, description="搜索关键词"),
                                             authorization: Optional[str] = Header(None)):
        """
        获取用户列表接口
        GET /api/doudizhu_model/admin/user/list/get
        管理员获取用户列表
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.get_user_list(page, page_size, status, keyword)

    def ActionDoudizhuModelAdminUserStatusUpdatePost(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                                      status: int = Query(..., description="状态"),
                                                      authorization: Optional[str] = Header(None)):
        """
        更新用户状态接口
        POST /api/doudizhu_model/admin/user/status/update
        管理员更新用户状态（正常/禁言/封号）
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.update_user_status(user_id, status)

    def ActionDoudizhuModelAdminUserDeletePost(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                                authorization: Optional[str] = Header(None)):
        """
        删除用户接口
        POST /api/doudizhu_model/admin/user/delete
        管理员删除用户账号
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.delete_user(user_id)

    def ActionDoudizhuModelAdminAchievementCreatePost(self, request: Request, body: CreateAchievementRequest,
                                                       authorization: Optional[str] = Header(None)):
        """
        创建成就接口
        POST /api/doudizhu_model/admin/achievement/create
        管理员创建新成就
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.achievement_business.create_achievement(
            name=body.name,
            description=body.description or '',
            type=body.type or 0,
            condition_value=body.condition_value or 0,
            reward_coins=body.reward_coins or 0,
            reward_exp=body.reward_exp or 0,
            icon=body.icon or ''
        )

    def ActionDoudizhuModelAdminAchievementUpdatePost(self, request: Request, body: UpdateAchievementRequest,
                                                       authorization: Optional[str] = Header(None)):
        """
        更新成就接口
        POST /api/doudizhu_model/admin/achievement/update
        管理员更新成就信息
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.description is not None:
            data['description'] = body.description
        if body.type is not None:
            data['type'] = body.type
        if body.condition_value is not None:
            data['condition_value'] = body.condition_value
        if body.reward_coins is not None:
            data['reward_coins'] = body.reward_coins
        if body.reward_exp is not None:
            data['reward_exp'] = body.reward_exp
        if body.icon is not None:
            data['icon'] = body.icon
        if body.status is not None:
            data['status'] = body.status

        return self.achievement_business.update_achievement(body.id, data)

    def ActionDoudizhuModelAdminAchievementDeletePost(self, request: Request, achievement_id: int = Query(..., description="成就ID"),
                                                       authorization: Optional[str] = Header(None)):
        """
        删除成就接口
        POST /api/doudizhu_model/admin/achievement/delete
        管理员删除成就
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.achievement_business.delete_achievement(achievement_id)

    def ActionDoudizhuModelAdminAiConfigCreatePost(self, request: Request, body: CreateAiConfigRequest,
                                                    authorization: Optional[str] = Header(None)):
        """
        创建AI配置接口
        POST /api/doudizhu_model/admin/ai/config/create
        管理员创建AI配置
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.ai_config_business.create_ai_config(
            name=body.name,
            difficulty=body.difficulty,
            description=body.description or '',
            think_time=body.think_time or 1000,
            bomb_probability=body.bomb_probability or 0.3,
            single_probability=body.single_probability or 0.5,
            is_default=body.is_default or 0
        )

    def ActionDoudizhuModelAdminAiConfigUpdatePost(self, request: Request, body: UpdateAiConfigRequest,
                                                    authorization: Optional[str] = Header(None)):
        """
        更新AI配置接口
        POST /api/doudizhu_model/admin/ai/config/update
        管理员更新AI配置
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.difficulty is not None:
            data['difficulty'] = body.difficulty
        if body.description is not None:
            data['description'] = body.description
        if body.think_time is not None:
            data['think_time'] = body.think_time
        if body.bomb_probability is not None:
            data['bomb_probability'] = body.bomb_probability
        if body.single_probability is not None:
            data['single_probability'] = body.single_probability
        if body.is_default is not None:
            data['is_default'] = body.is_default
        if body.status is not None:
            data['status'] = body.status

        return self.ai_config_business.update_ai_config(body.id, data)

    def ActionDoudizhuModelAdminAiConfigDeletePost(self, request: Request, config_id: int = Query(..., description="配置ID"),
                                                    authorization: Optional[str] = Header(None)):
        """
        删除AI配置接口
        POST /api/doudizhu_model/admin/ai/config/delete
        管理员删除AI配置
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.ai_config_business.delete_ai_config(config_id)

    def ActionDoudizhuModelAdminStatsOverallGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取总体统计接口
        GET /api/doudizhu_model/admin/stats/overall/get
        获取游戏总体统计数据
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.stats_business.get_overall_stats()

    def ActionDoudizhuModelAdminStatsDailyGet(self, request: Request,
                                               start_date: Optional[str] = Query(None, description="开始日期"),
                                               end_date: Optional[str] = Query(None, description="结束日期"),
                                               authorization: Optional[str] = Header(None)):
        """
        获取每日统计接口
        GET /api/doudizhu_model/admin/stats/daily/get
        获取每日游戏统计数据
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.stats_business.get_daily_stats(start_date, end_date)

    def ActionDoudizhuModelAdminStatsDifficultyGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取难度统计接口
        GET /api/doudizhu_model/admin/stats/difficulty/get
        获取不同难度的游戏统计数据
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.stats_business.get_difficulty_stats()

    def ActionDoudizhuModelAdminStatsRoleGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取角色统计接口
        GET /api/doudizhu_model/admin/stats/role/get
        获取地主/农民角色的游戏统计数据
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.stats_business.get_role_stats()

    def ActionDoudizhuModelAdminGameRecordsGet(self, request: Request, page: int = Query(1, description="页码"),
                                                page_size: int = Query(20, description="每页数量"),
                                                user_id: Optional[int] = Query(None, description="用户ID"),
                                                result: Optional[int] = Query(None, description="结果：1胜，0负"),
                                                start_date: Optional[str] = Query(None, description="开始日期"),
                                                end_date: Optional[str] = Query(None, description="结束日期"),
                                                authorization: Optional[str] = Header(None)):
        """
        获取游戏记录接口
        GET /api/doudizhu_model/admin/game/records/get
        管理员获取所有游戏记录
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.stats_business.get_all_game_records(page, page_size, user_id, result, start_date, end_date)
