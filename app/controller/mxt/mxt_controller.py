from typing import Optional, List, Dict, Any
from fastapi import Request, Query
from pydantic import BaseModel, Field
from app.business.mxt import (
    JobBusiness, ApplicationBusiness, EmployeeCardBusiness,
    CoinBusiness, DailyHotBusiness, WelfareBusiness
)


class JobAddRequest(BaseModel):
    name: str = Field(..., description="职位名称")
    icon: str = Field(default='', description="职位图标")
    description: str = Field(default='', description="职位描述")
    requirements: str = Field(default='', description="奇葩要求")
    sort_order: int = Field(default=0, description="排序顺序")
    is_active: int = Field(default=1, description="是否启用")
    is_hidden: int = Field(default=0, description="是否隐藏")


class JobUpdateRequest(BaseModel):
    id: int = Field(..., description="职位ID")
    name: Optional[str] = Field(default=None, description="职位名称")
    icon: Optional[str] = Field(default=None, description="职位图标")
    description: Optional[str] = Field(default=None, description="职位描述")
    requirements: Optional[str] = Field(default=None, description="奇葩要求")
    sort_order: Optional[int] = Field(default=None, description="排序顺序")
    is_active: Optional[int] = Field(default=None, description="是否启用")
    is_hidden: Optional[int] = Field(default=None, description="是否隐藏")


class ApplicationSubmitRequest(BaseModel):
    job_id: int = Field(..., description="职位ID")
    applicant_name: str = Field(..., description="申请人姓名")
    age: int = Field(default=18, ge=18, le=99, description="年龄")
    has_experience: int = Field(default=0, description="是否有马戏团经验")
    specialties: str = Field(default='', description="特长")
    reason: str = Field(default='', description="为什么想来马戏团")
    is_urgent: int = Field(default=0, description="是否加急处理")
    user_key: str = Field(default='', description="用户标识")


class WelfareAddRequest(BaseModel):
    icon: str = Field(..., description="福利图标")
    title: str = Field(..., description="福利标题")
    description: str = Field(default='', description="福利描述")
    sort_order: int = Field(default=0, description="排序顺序")


class WelfareUpdateRequest(BaseModel):
    id: int = Field(..., description="福利ID")
    icon: Optional[str] = Field(default=None, description="福利图标")
    title: Optional[str] = Field(default=None, description="福利标题")
    description: Optional[str] = Field(default=None, description="福利描述")
    sort_order: Optional[int] = Field(default=None, description="排序顺序")


class MxtController:
    def __init__(self):
        self.job_business = JobBusiness()
        self.application_business = ApplicationBusiness()
        self.employee_card_business = EmployeeCardBusiness()
        self.coin_business = CoinBusiness()
        self.daily_hot_business = DailyHotBusiness()
        self.welfare_business = WelfareBusiness()

    def ActionMxtHomeGet(self, request: Request):
        """
        获取马戏团招聘首页接口
        GET /api/mxt/home/get
        返回首页数据，包括职位列表、今日热招、福利等
        """
        jobs_result = self.job_business.get_active_jobs()
        hot_result = self.daily_hot_business.get_today_hot()
        welfare_result = self.welfare_business.get_welfares()
        coin_config_result = self.coin_business.get_coin_config()

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'jobs': jobs_result.get('data', []),
                'hot_jobs': hot_result.get('data', {}),
                'welfares': welfare_result.get('data', []),
                'coin_config': coin_config_result.get('data', {})
            }
        }

    def ActionMxtJobListGet(self, request: Request, include_hidden: bool = Query(default=False, description="是否包含隐藏职位")):
        """
        获取职位列表接口
        GET /api/mxt/job/list/get
        返回所有职位列表
        """
        return self.job_business.get_jobs(include_hidden=include_hidden)

    def ActionMxtJobGet(self, request: Request, id: int = Query(..., ge=1, description="职位ID")):
        """
        获取单个职位接口
        GET /api/mxt/job/get
        参数: id - 职位ID
        """
        return self.job_business.get_job_by_id(id)

    def ActionMxtJobAddPost(self, request: Request, body: JobAddRequest):
        """
        添加职位接口
        POST /api/mxt/job/add
        添加新的奇葩职位
        """
        return self.job_business.add_job(
            name=body.name,
            icon=body.icon,
            description=body.description,
            requirements=body.requirements,
            sort_order=body.sort_order,
            is_active=body.is_active,
            is_hidden=body.is_hidden
        )

    def ActionMxtJobUpdatePost(self, request: Request, body: JobUpdateRequest):
        """
        更新职位接口
        POST /api/mxt/job/update
        更新职位信息
        """
        return self.job_business.update_job(
            record_id=body.id,
            name=body.name,
            icon=body.icon,
            description=body.description,
            requirements=body.requirements,
            sort_order=body.sort_order,
            is_active=body.is_active,
            is_hidden=body.is_hidden
        )

    def ActionMxtJobDelete(self, request: Request, id: int = Query(..., ge=1, description="职位ID")):
        """
        删除职位接口
        DELETE /api/mxt/job/delete
        参数: id - 职位ID
        """
        return self.job_business.delete_job(id)

    def ActionMxtApplicationSubmitPost(self, request: Request, body: ApplicationSubmitRequest):
        """
        投递简历接口
        POST /api/mxt/application/submit
        用户投递简历，系统会自动生成HR奇葩回复
        """
        result = self.application_business.submit_application(
            job_id=body.job_id,
            applicant_name=body.applicant_name,
            age=body.age,
            has_experience=body.has_experience,
            specialties=body.specialties,
            reason=body.reason,
            is_urgent=body.is_urgent
        )

        if result.get('code') == 0 and body.user_key:
            self.coin_business.reward_submit(body.user_key)
            if body.is_urgent:
                self.coin_business.spend_urgent_apply(body.user_key)
            if result.get('data', {}).get('status') == 'hired':
                self.coin_business.reward_hired(body.user_key)

        return result

    def ActionMxtApplicationGet(self, request: Request, id: int = Query(..., ge=1, description="投递记录ID")):
        """
        获取投递记录接口
        GET /api/mxt/application/get
        参数: id - 投递记录ID
        """
        return self.application_business.get_application_by_id(id)

    def ActionMxtApplicationListGet(self, request: Request, job_id: Optional[int] = Query(default=None, description="职位ID")):
        """
        获取投递记录列表接口
        GET /api/mxt/application/list/get
        参数: job_id - 可选，按职位筛选
        """
        if job_id:
            return self.application_business.get_applications_by_job(job_id)
        return self.application_business.get_all_applications()

    def ActionMxtApplicationStatusGet(self, request: Request, status: str = Query(..., description="状态: hired/rejected/backup")):
        """
        按状态获取投递记录接口
        GET /api/mxt/application/status/get
        参数: status - 状态
        """
        return self.application_business.get_applications_by_status(status)

    def ActionMxtApplicationDelete(self, request: Request, id: int = Query(..., ge=1, description="投递记录ID")):
        """
        删除投递记录接口
        DELETE /api/mxt/application/delete
        参数: id - 投递记录ID
        """
        return self.application_business.delete_application(id)

    def ActionMxtEmployeeCardGeneratePost(self, request: Request, application_id: int = Query(..., ge=1, description="投递记录ID")):
        """
        生成员工证接口
        POST /api/mxt/employee/card/generate
        根据录用的投递记录生成员工证
        """
        return self.employee_card_business.generate_card(application_id)

    def ActionMxtEmployeeCardGet(self, request: Request, id: Optional[int] = Query(default=None, description="员工证ID"),
                                 application_id: Optional[int] = Query(default=None, description="投递记录ID"),
                                 employee_no: Optional[str] = Query(default=None, description="员工编号")):
        """
        获取员工证接口
        GET /api/mxt/employee/card/get
        通过ID、投递记录ID或员工编号获取员工证
        """
        if id:
            return self.employee_card_business.get_card_by_id(id)
        elif application_id:
            return self.employee_card_business.get_card_by_application(application_id)
        elif employee_no:
            return self.employee_card_business.get_card_by_employee_no(employee_no)
        else:
            return {
                'code': 1,
                'message': '请提供id、application_id或employee_no',
                'data': None
            }

    def ActionMxtEmployeeCardSharePost(self, request: Request, id: int = Query(..., ge=1, description="员工证ID"),
                                         user_key: str = Query(default='', description="用户标识")):
        """
        分享员工证接口
        POST /api/mxt/employee/card/share
        分享员工证并获得金币奖励
        """
        result = self.employee_card_business.share_card(id)
        
        if result.get('code') == 0 and user_key:
            card_data = result.get('data', {})
            if card_data and card_data.get('was_newly_shared'):
                self.coin_business.reward_share(user_key)
        
        return result

    def ActionMxtEmployeeCardListGet(self, request: Request):
        """
        获取员工证列表接口
        GET /api/mxt/employee/card/list/get
        返回所有员工证列表
        """
        return self.employee_card_business.get_all_cards()

    def ActionMxtEmployeeCardDelete(self, request: Request, id: int = Query(..., ge=1, description="员工证ID")):
        """
        删除员工证接口
        DELETE /api/mxt/employee/card/delete
        参数: id - 员工证ID
        """
        return self.employee_card_business.delete_card(id)

    def ActionMxtCoinGet(self, request: Request, user_key: str = Query(..., description="用户标识")):
        """
        获取用户金币接口
        GET /api/mxt/coin/get
        参数: user_key - 用户标识
        """
        return self.coin_business.get_user_coins(user_key)

    def ActionMxtCoinDailyLoginPost(self, request: Request, user_key: str = Query(..., description="用户标识")):
        """
        每日登录领取金币接口
        POST /api/mxt/coin/daily/login
        每日登录可领取金币奖励
        """
        return self.coin_business.reward_daily_login(user_key)

    def ActionMxtCoinRefreshHotPost(self, request: Request, user_key: str = Query(..., description="用户标识")):
        """
        消耗金币刷新今日推荐接口
        POST /api/mxt/coin/refresh/hot
        消耗金币刷新今日热招职位
        """
        coin_result = self.coin_business.spend_refresh_hot(user_key)
        if coin_result.get('code') != 0:
            return coin_result
        
        hot_result = self.daily_hot_business.refresh_hot()
        return hot_result

    def ActionMxtCoinLogsGet(self, request: Request, user_key: str = Query(..., description="用户标识")):
        """
        获取金币日志接口
        GET /api/mxt/coin/logs/get
        参数: user_key - 用户标识
        """
        return self.coin_business.get_coin_logs(user_key)

    def ActionMxtCoinConfigGet(self, request: Request):
        """
        获取金币配置接口
        GET /api/mxt/coin/config/get
        返回金币获取和消耗配置
        """
        return self.coin_business.get_coin_config()

    def ActionMxtHotGet(self, request: Request):
        """
        获取今日热招接口
        GET /api/mxt/hot/get
        返回今日推荐的急招职位
        """
        return self.daily_hot_business.get_today_hot()

    def ActionMxtHotRefreshPost(self, request: Request):
        """
        刷新今日热招接口
        POST /api/mxt/hot/refresh
        重新随机选择今日热招职位
        """
        return self.daily_hot_business.refresh_hot()

    def ActionMxtWelfareListGet(self, request: Request):
        """
        获取福利列表接口
        GET /api/mxt/welfare/list/get
        返回所有马戏团福利
        """
        return self.welfare_business.get_welfares()

    def ActionMxtWelfareGet(self, request: Request, id: int = Query(..., ge=1, description="福利ID")):
        """
        获取单个福利接口
        GET /api/mxt/welfare/get
        参数: id - 福利ID
        """
        return self.welfare_business.get_welfare_by_id(id)

    def ActionMxtWelfareAddPost(self, request: Request, body: WelfareAddRequest):
        """
        添加福利接口
        POST /api/mxt/welfare/add
        添加新的马戏团福利
        """
        return self.welfare_business.add_welfare(
            icon=body.icon,
            title=body.title,
            description=body.description,
            sort_order=body.sort_order
        )

    def ActionMxtWelfareUpdatePost(self, request: Request, body: WelfareUpdateRequest):
        """
        更新福利接口
        POST /api/mxt/welfare/update
        更新福利信息
        """
        return self.welfare_business.update_welfare(
            record_id=body.id,
            icon=body.icon,
            title=body.title,
            description=body.description,
            sort_order=body.sort_order
        )

    def ActionMxtWelfareDelete(self, request: Request, id: int = Query(..., ge=1, description="福利ID")):
        """
        删除福利接口
        DELETE /api/mxt/welfare/delete
        参数: id - 福利ID
        """
        return self.welfare_business.delete_welfare(id)
