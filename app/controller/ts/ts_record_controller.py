from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field
from datetime import datetime


class CreateRecordRequest(BaseModel):
    count: int = Field(0, description="跳绳数量")
    duration: int = Field(0, description="跳绳时长(秒)")
    note: Optional[str] = Field(None, description="备注")
    record_date: Optional[str] = Field(None, description="记录日期(YYYY-MM-DD)")
    record_time: Optional[str] = Field(None, description="记录时间(HH:MM:SS)")


class UpdateRecordRequest(BaseModel):
    count: Optional[int] = Field(None, description="跳绳数量")
    duration: Optional[int] = Field(None, description="跳绳时长(秒)")
    note: Optional[str] = Field(None, description="备注")
    record_date: Optional[str] = Field(None, description="记录日期")
    record_time: Optional[str] = Field(None, description="记录时间")


class TsRecordController:
    def __init__(self):
        from app.business.ts.record_business import TsRecordBusiness
        self.record_business = TsRecordBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.ts.user_business import TsUserBusiness
        user_business = TsUserBusiness()
        return user_business.verify_token(token)

    def ActionTsRecordCreatePost(self, request: Request, body: CreateRecordRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        创建跳绳记录接口
        POST /api/ts/record/create
        记录一次跳绳数据
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.record_business.create_record(
            user_id=user.get('id'),
            count=body.count,
            duration=body.duration,
            note=body.note,
            record_date=body.record_date,
            record_time=body.record_time
        )

    def ActionTsRecordDetailGet(self, request: Request, record_id: int = Query(..., description="记录ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        获取记录详情接口
        GET /api/ts/record/detail/get
        根据记录ID获取记录详情
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.record_business.get_record_by_id(record_id, user.get('id'))

    def ActionTsRecordListGet(self, request: Request,
                               page: int = Query(1, description="页码"),
                               page_size: int = Query(10, description="每页数量"),
                               start_date: Optional[str] = Query(None, description="开始日期"),
                               end_date: Optional[str] = Query(None, description="结束日期"),
                               authorization: Optional[str] = Header(None)):
        """
        获取记录列表接口
        GET /api/ts/record/list/get
        分页获取用户的跳绳记录列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.record_business.get_user_records(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            start_date=start_date,
            end_date=end_date
        )

    def ActionTsRecordDailyGet(self, request: Request,
                                date: Optional[str] = Query(None, description="日期(YYYY-MM-DD)"),
                                authorization: Optional[str] = Header(None)):
        """
        获取每日统计接口
        GET /api/ts/record/daily/get
        获取指定日期的跳绳统计数据
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.record_business.get_daily_stats(
            user_id=user.get('id'),
            date=date
        )

    def ActionTsRecordWeeklyGet(self, request: Request,
                                 authorization: Optional[str] = Header(None)):
        """
        获取本周统计接口
        GET /api/ts/record/weekly/get
        获取本周的跳绳统计数据
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.record_business.get_weekly_stats(user_id=user.get('id'))

    def ActionTsRecordMonthlyGet(self, request: Request,
                                  authorization: Optional[str] = Header(None)):
        """
        获取本月统计接口
        GET /api/ts/record/monthly/get
        获取本月的跳绳统计数据
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.record_business.get_monthly_stats(user_id=user.get('id'))

    def ActionTsRecordTrendGet(self, request: Request,
                                start_date: str = Query(..., description="开始日期"),
                                end_date: str = Query(..., description="结束日期"),
                                authorization: Optional[str] = Header(None)):
        """
        获取趋势数据接口
        GET /api/ts/record/trend/get
        获取指定日期范围的趋势数据
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.record_business.get_trend_data(
            user_id=user.get('id'),
            start_date=start_date,
            end_date=end_date
        )

    def ActionTsRecordBestGet(self, request: Request,
                               authorization: Optional[str] = Header(None)):
        """
        获取最佳记录接口
        GET /api/ts/record/best/get
        获取用户的历史最佳记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.record_business.get_best_records(user_id=user.get('id'))

    def ActionTsRecordUpdatePost(self, request: Request, body: UpdateRecordRequest,
                                  record_id: int = Query(..., description="记录ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        更新记录接口
        POST /api/ts/record/update
        更新跳绳记录
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
        if body.count is not None:
            data['count'] = body.count
        if body.duration is not None:
            data['duration'] = body.duration
        if body.note is not None:
            data['note'] = body.note
        if body.record_date is not None:
            data['record_date'] = body.record_date
        if body.record_time is not None:
            data['record_time'] = body.record_time

        return self.record_business.update_record(
            record_id=record_id,
            user_id=user.get('id'),
            data=data
        )

    def ActionTsRecordDeletePost(self, request: Request,
                                  record_id: int = Query(..., description="记录ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        删除记录接口
        POST /api/ts/record/delete
        删除跳绳记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.record_business.delete_record(
            record_id=record_id,
            user_id=user.get('id')
        )

    def ActionTsRecordCaloriesGet(self, request: Request,
                                   count: int = Query(..., description="跳绳数量"),
                                   weight: float = Query(60.0, description="体重(kg)")):
        """
        计算卡路里接口
        GET /api/ts/record/calories/get
        根据跳绳数量和体重计算消耗的卡路里
        """
        return self.record_business.calculate_calories(count, weight)
