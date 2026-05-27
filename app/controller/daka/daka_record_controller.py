from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CheckinRequest(BaseModel):
    task_id: int = Field(..., description="任务ID")
    current_value: Optional[int] = Field(None, description="当前完成值，不传则默认完成目标值")
    note: Optional[str] = Field('', description="打卡备注")


class DakaRecordController:
    def __init__(self):
        from app.business.daka.record_business import DakaRecordBusiness
        from app.business.daka.user_business import DakaUserBusiness
        self.record_business = DakaRecordBusiness()
        self.user_business = DakaUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionDakaRecordTodayGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取今日打卡状态
        GET /api/daka/record/today/get
        获取今日所有任务的打卡状态和进度
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.record_business.get_today_checkin_status(user.get('id'))

    def ActionDakaRecordCheckinPost(self, request: Request, body: CheckinRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        打卡接口
        POST /api/daka/record/checkin
        对指定任务进行打卡
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.record_business.checkin(
            user_id=user.get('id'),
            task_id=body.task_id,
            current_value=body.current_value,
            note=body.note
        )

    def ActionDakaRecordHistoryGet(self, request: Request, page: int = Query(1, description="页码"),
                                    page_size: int = Query(20, description="每页数量"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取打卡历史
        GET /api/daka/record/history/get
        分页获取用户打卡历史记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.record_business.get_checkin_history(user.get('id'), page, page_size)

    def ActionDakaRecordHeatmapGet(self, request: Request, months: int = Query(6, description="获取最近几个月的数据"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取打卡热力图数据
        GET /api/daka/record/heatmap/get
        获取用于展示热力图的打卡数据
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.record_business.get_heatmap_data(user.get('id'), months)

    def ActionDakaRecordCalendarGet(self, request: Request, year: int = Query(..., description="年份"),
                                     month: int = Query(..., description="月份"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取月度打卡日历
        GET /api/daka/record/calendar/get
        获取指定年月的打卡日历数据
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.record_business.get_monthly_calendar(user.get('id'), year, month)

    def ActionDakaRecordStatisticsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取打卡统计数据
        GET /api/daka/record/statistics/get
        获取用户的打卡统计信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.record_business.get_statistics(user.get('id'))

    def ActionDakaRecordDeletePost(self, request: Request, record_id: int = Query(..., description="记录ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        删除打卡记录
        POST /api/daka/record/delete
        删除指定的打卡记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.record_business.delete_record(record_id, user.get('id'))
