from typing import Optional, List, Dict, Any
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class UserLoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class UserRegisterRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")
    nickname: Optional[str] = Field(None)
    email: Optional[str] = Field(None)


class UserChangePasswordRequest(BaseModel):
    old_password: str = Field(...)
    new_password: str = Field(...)


class UserUpdateProfileRequest(BaseModel):
    nickname: Optional[str] = Field(None)
    email: Optional[str] = Field(None)
    avatar: Optional[str] = Field(None)


class UserUpdateSettingsRequest(BaseModel):
    notification_enabled: Optional[int] = Field(None)
    theme: Optional[str] = Field(None)


class CheckinCreateRequest(BaseModel):
    checkin_date: str = Field(..., description="打卡日期")
    projects: List[str] = Field(default_factory=list)
    details: List[Dict[str, Any]] = Field(default_factory=list)
    duration: int = 0
    calories: int = 0
    remark: Optional[str] = Field('')
    mood: Optional[str] = Field('')


class PlanCreateRequest(BaseModel):
    name: str = Field(...)
    description: Optional[str] = Field('')
    schedule: List[Dict[str, Any]] = Field(default_factory=list)
    difficulty: Optional[str] = Field('beginner')
    cover: Optional[str] = Field('')


class PlanUpdateRequest(BaseModel):
    name: Optional[str] = Field(None)
    description: Optional[str] = Field(None)
    schedule: Optional[List[Dict[str, Any]]] = Field(None)
    difficulty: Optional[str] = Field(None)
    cover: Optional[str] = Field(None)


class JianshenUserController:
    def __init__(self):
        from app.business.jianshen.user_business import JianshenUserBusiness
        from app.business.jianshen.checkin_business import JianshenCheckinBusiness
        from app.business.jianshen.plan_business import JianshenPlanBusiness
        from app.business.jianshen.achievement_business import JianshenAchievementBusiness
        from app.business.jianshen.dashboard_business import JianshenDashboardBusiness
        from app.business.jianshen.statistics_business import JianshenStatisticsBusiness
        from app.business.jianshen.ranking_business import JianshenRankingBusiness
        from app.business.jianshen.daily_quote_business import JianshenDailyQuoteBusiness
        self.user_business = JianshenUserBusiness()
        self.checkin_business = JianshenCheckinBusiness()
        self.plan_business = JianshenPlanBusiness()
        self.achievement_business = JianshenAchievementBusiness()
        self.dashboard_business = JianshenDashboardBusiness()
        self.statistics_business = JianshenStatisticsBusiness()
        self.ranking_business = JianshenRankingBusiness()
        self.quote_business = JianshenDailyQuoteBusiness()

    def _get_token(self, request: Request, authorization: Optional[str]) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token or ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionJianshenUserLoginPost(self, request: Request, body: UserLoginRequest):
        return self.user_business.login(username=body.username, password=body.password)

    def ActionJianshenUserRegisterPost(self, request: Request, body: UserRegisterRequest):
        return self.user_business.register(
            username=body.username,
            password=body.password,
            nickname=body.nickname or '',
            email=body.email or ''
        )

    def ActionJianshenUserLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        return self.user_business.logout(self._get_token(request, authorization))

    def ActionJianshenUserCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.user_business.get_current_user(token)

    def ActionJianshenUserProfileGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.user_business.get_profile(user_id=user.get('id'))

    def ActionJianshenUserProfileUpdatePost(self, request: Request, body: UserUpdateProfileRequest,
                                            authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        data = {}
        if body.nickname is not None:
            data['nickname'] = body.nickname
        if body.email is not None:
            data['email'] = body.email
        if body.avatar is not None:
            data['avatar'] = body.avatar
        return self.user_business.update_profile(user_id=user.get('id'), data=data)

    def ActionJianshenUserPasswordChangePost(self, request: Request, body: UserChangePasswordRequest,
                                             authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.user_business.change_password(
            user_id=user.get('id'),
            old_password=body.old_password,
            new_password=body.new_password
        )

    def ActionJianshenUserSettingsUpdatePost(self, request: Request, body: UserUpdateSettingsRequest,
                                             authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.user_business.update_settings(
            user_id=user.get('id'),
            notification_enabled=body.notification_enabled,
            theme=body.theme
        )

    def ActionJianshenDashboardGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.dashboard_business.get_dashboard(user_id=user.get('id'))

    def ActionJianshenCheckinCreatePost(self, request: Request, body: CheckinCreateRequest,
                                        authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.checkin_business.create_checkin(
            user_id=user.get('id'),
            checkin_date=body.checkin_date,
            projects=body.projects,
            details=body.details,
            duration=body.duration,
            calories=body.calories,
            remark=body.remark or '',
            mood=body.mood or ''
        )

    def ActionJianshenCheckinListGet(self, request: Request,
                                     page: int = Query(1, ge=1),
                                     page_size: int = Query(10, ge=1, le=100),
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.checkin_business.get_checkin_list(user_id=user.get('id'), page=page, page_size=page_size)

    def ActionJianshenCheckinDateGet(self, request: Request, checkin_date: str = Query(...),
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.checkin_business.get_checkin_by_date(user_id=user.get('id'), checkin_date=checkin_date)

    def ActionJianshenCheckinDeletePost(self, request: Request, checkin_id: int = Query(...),
                                        authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.checkin_business.delete_checkin(user_id=user.get('id'), checkin_id=checkin_id)

    def ActionJianshenCheckinRecentGet(self, request: Request, limit: int = Query(5, ge=1, le=30),
                                       authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.checkin_business.get_recent(user_id=user.get('id'), limit=limit)

    def ActionJianshenCheckinCalendarGet(self, request: Request,
                                         year: int = Query(...),
                                         month: int = Query(...),
                                         authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.checkin_business.get_calendar(user_id=user.get('id'), year=year, month=month)

    def ActionJianshenStatisticsSummaryGet(self, request: Request,
                                           authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.statistics_business.get_summary(user_id=user.get('id'))

    def ActionJianshenStatisticsTrendGet(self, request: Request,
                                         range_type: str = Query('week'),
                                         authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.statistics_business.get_trend(user_id=user.get('id'), range_type=range_type)

    def ActionJianshenStatisticsProjectGet(self, request: Request,
                                           authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.statistics_business.get_project_distribution(user_id=user.get('id'))

    def ActionJianshenStatisticsCalendarGet(self, request: Request,
                                            year: int = Query(...),
                                            month: int = Query(...),
                                            authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.statistics_business.get_calendar(user_id=user.get('id'), year=year, month=month)

    def ActionJianshenPlanListGet(self, request: Request,
                                  page: int = Query(1, ge=1),
                                  page_size: int = Query(20, ge=1, le=100),
                                  plan_type: Optional[int] = Query(None),
                                  keyword: Optional[str] = Query(None),
                                  authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.plan_business.get_plan_list(page=page, page_size=page_size,
                                               plan_type=plan_type, keyword=keyword)

    def ActionJianshenPlanDetailGet(self, request: Request, plan_id: int = Query(...),
                                    authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.plan_business.get_plan(plan_id=plan_id)

    def ActionJianshenPlanOfficialGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.plan_business.get_official_plans()

    def ActionJianshenPlanMyGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.plan_business.get_user_plans(user_id=user.get('id'))

    def ActionJianshenPlanCreatePost(self, request: Request, body: PlanCreateRequest,
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.plan_business.create_plan(
            user_id=user.get('id'),
            name=body.name,
            description=body.description or '',
            schedule=body.schedule,
            difficulty=body.difficulty or 'beginner',
            cover=body.cover or ''
        )

    def ActionJianshenPlanUpdatePost(self, request: Request, body: PlanUpdateRequest,
                                     plan_id: int = Query(...),
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.description is not None:
            data['description'] = body.description
        if body.schedule is not None:
            data['schedule'] = body.schedule
        if body.difficulty is not None:
            data['difficulty'] = body.difficulty
        if body.cover is not None:
            data['cover'] = body.cover
        return self.plan_business.update_plan(plan_id=plan_id, data=data)

    def ActionJianshenPlanDeletePost(self, request: Request, plan_id: int = Query(...),
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.plan_business.delete_plan(plan_id=plan_id)

    def ActionJianshenPlanActivatePost(self, request: Request, plan_id: int = Query(...),
                                       start_date: Optional[str] = Query(None),
                                       authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.plan_business.activate_plan(user_id=user.get('id'), plan_id=plan_id,
                                                start_date=start_date or '')

    def ActionJianshenPlanDeactivatePost(self, request: Request,
                                         authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.plan_business.deactivate_plan(user_id=user.get('id'))

    def ActionJianshenPlanActiveGet(self, request: Request,
                                    authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.plan_business.get_active_plan(user_id=user.get('id'))

    def ActionJianshenPlanTodayGet(self, request: Request,
                                   authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.plan_business.get_today_tasks(user_id=user.get('id'))

    def ActionJianshenAchievementListGet(self, request: Request,
                                         authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.achievement_business.get_user_achievements(user_id=user.get('id'))

    def ActionJianshenAchievementAllGet(self, request: Request,
                                        authorization: Optional[str] = Header(None)):
        return self.achievement_business.get_all_achievements()

    def ActionJianshenAchievementLevelGet(self, request: Request,
                                          authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.achievement_business.get_level_info(user_id=user.get('id'))

    def ActionJianshenAchievementUpcomingGet(self, request: Request,
                                             authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.achievement_business.get_upcoming(user_id=user.get('id'))

    def ActionJianshenRankingListGet(self, request: Request,
                                     rank_type: str = Query('total'),
                                     limit: int = Query(50, ge=1, le=100),
                                     authorization: Optional[str] = Header(None)):
        return self.ranking_business.get_ranking(rank_type=rank_type, limit=limit)

    def ActionJianshenRankingMyGet(self, request: Request,
                                   rank_type: str = Query('total'),
                                   authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.ranking_business.get_my_rank(user_id=user.get('id'), rank_type=rank_type)

    def ActionJianshenQuoteTodayGet(self, request: Request):
        return self.quote_business.get_today()
