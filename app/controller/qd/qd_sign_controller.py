from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class SupplementSignRequest(BaseModel):
    target_date: str = Field(..., description="补签日期（YYYY-MM-DD）")


class QdSignController:
    def __init__(self):
        from app.business.qd.sign_business import SignBusiness
        from app.business.qd.sign_user_business import SignUserBusiness
        self.sign_business = SignBusiness()
        self.user_business = SignUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionQdSignStatusGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取签到状态接口
        GET /api/qd/sign/status/get
        获取当前用户的签到状态、连续天数、统计数据等
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.sign_business.get_sign_status(user.get('id'))

    def ActionQdSignPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        签到接口
        POST /api/qd/sign
        完成今日签到，获得积分奖励
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.sign_business.sign(user.get('id'))

    def ActionQdSignSupplementPost(self, request: Request, body: SupplementSignRequest,
                                    authorization: Optional[str] = Header(None)):
        """
        补签接口
        POST /api/qd/sign/supplement
        消耗积分补签过去的日期
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.sign_business.supplement_sign(
            user_id=user.get('id'),
            target_date=body.target_date
        )

    def ActionQdSignCalendarGet(self, request: Request,
                                  year: Optional[int] = Query(None, description="年份"),
                                  month: Optional[int] = Query(None, description="月份"),
                                  authorization: Optional[str] = Header(None)):
        """
        获取签到日历接口
        GET /api/qd/sign/calendar/get
        获取指定月份的签到日历，显示每天的签到状态
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.sign_business.get_month_calendar(
            user_id=user.get('id'),
            year=year,
            month=month
        )

    def ActionQdSignHistoryGet(self, request: Request,
                                page: int = Query(1, description="页码"),
                                page_size: int = Query(10, description="每页数量"),
                                authorization: Optional[str] = Header(None)):
        """
        获取签到历史接口
        GET /api/qd/sign/history/get
        分页获取用户的签到历史记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.sign_business.get_sign_history(
            user_id=user.get('id'),
            page=page,
            page_size=page_size
        )

    def ActionQdSignConfigGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取签到配置接口
        GET /api/qd/sign/config/get
        获取签到系统的配置信息（每日积分、连续奖励规则等）
        """
        return self.sign_business.get_config()
