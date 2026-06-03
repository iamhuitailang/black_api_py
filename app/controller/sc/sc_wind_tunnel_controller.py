from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class RunTestRequest(BaseModel):
    car_id: int = Field(..., description="车辆ID")
    test_type: str = Field(..., description="测试类型")


class ScWindTunnelController:
    def __init__(self):
        from app.business.sc.sc_wind_tunnel_business import ScWindTunnelBusiness
        self.wind_tunnel_business = ScWindTunnelBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.sc.sc_user_business import ScUserBusiness
        user_business = ScUserBusiness()
        return user_business.verify_token(token)

    def ActionScWindTunnelRunPost(self, request: Request, body: RunTestRequest,
                                   authorization: Optional[str] = Header(None)):
        """
        运行风洞测试接口
        POST /api/sc/wind/tunnel/run
        对指定车辆运行风洞测试
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.wind_tunnel_business.run_test(
            user_id=user.get('id'),
            car_id=body.car_id,
            test_type=body.test_type
        )

    def ActionScWindTunnelUserListGet(self, request: Request, page: int = Query(1, description="页码"),
                                       page_size: int = Query(10, description="每页数量"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取用户风洞测试列表接口
        GET /api/sc/wind/tunnel/user/list/get
        分页获取当前用户的所有风洞测试记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': {
                    'items': [],
                    'total': 0,
                    'page': page,
                    'page_size': page_size,
                    'total_pages': 0
                }
            }

        return self.wind_tunnel_business.get_user_tests(
            user_id=user.get('id'),
            page=page,
            page_size=page_size
        )

    def ActionScWindTunnelCarListGet(self, request: Request, car_id: int = Query(..., description="车辆ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取车辆风洞测试列表接口
        GET /api/sc/wind/tunnel/car/list/get
        获取指定车辆的所有风洞测试记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': []
            }

        return self.wind_tunnel_business.get_car_tests(
            user_id=user.get('id'),
            car_id=car_id
        )

    def ActionScWindTunnelLatestGet(self, request: Request, car_id: int = Query(..., description="车辆ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取车辆最新风洞测试接口
        GET /api/sc/wind/tunnel/latest/get
        获取指定车辆的最新风洞测试记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.wind_tunnel_business.get_latest_test(
            user_id=user.get('id'),
            car_id=car_id
        )

    def ActionScWindTunnelDetailGet(self, request: Request, test_id: int = Query(..., description="测试记录ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取风洞测试详情接口
        GET /api/sc/wind/tunnel/detail/get
        获取指定风洞测试记录的详细信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.wind_tunnel_business.get_test_detail(
            test_id=test_id,
            user_id=user.get('id')
        )
