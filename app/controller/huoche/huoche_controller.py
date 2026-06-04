from typing import Optional
from fastapi import APIRouter, Query, Request, Header
from pydantic import BaseModel, Field
from app.business.huoche import HuocheBusiness
from app.business.auth import AuthBusiness


class RegisterRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class StartGameRequest(BaseModel):
    train_id: int = Field(..., description="火车ID")
    route_id: int = Field(..., description="线路ID")


class CompleteGameRequest(BaseModel):
    game_record_id: int = Field(..., description="游戏记录ID")
    actual_duration: int = Field(..., description="实际用时(秒)")
    distance: float = Field(..., description="行驶距离")
    avg_speed: float = Field(..., description="平均速度")
    max_speed: float = Field(..., description="最高速度")
    passengers_transported: int = Field(..., description="运送乘客数")
    cargo_transported: float = Field(..., description="运送货物重量")
    signal_violations: int = Field(..., description="信号灯违规次数")
    station_stops: int = Field(..., description="停靠站次数")
    perfect_stops: int = Field(..., description="完美停靠次数")
    weather_condition: str = Field(..., description="天气状况")
    breakdowns: int = Field(..., description="故障次数")
    passenger_satisfaction: float = Field(..., description="乘客满意度")
    cargo_condition: float = Field(..., description="货物完好度")
    coins_earned: int = Field(..., description="获得金币")
    exp_earned: int = Field(..., description="获得经验")
    is_perfect: bool = Field(False, description="是否完美完成")


class BuyTrainRequest(BaseModel):
    train_type_id: int = Field(..., description="火车类型ID")
    train_name: Optional[str] = Field(None, description="火车名称")


class UpgradeTrainRequest(BaseModel):
    train_id: int = Field(..., description="火车ID")
    attribute: str = Field(..., description="升级属性: speed_level/capacity_level/efficiency_level/reliability_level")


class RepairTrainRequest(BaseModel):
    train_id: int = Field(..., description="火车ID")


class HuocheController:
    def __init__(self):
        self.huoche_business = HuocheBusiness()
        self.auth_business = AuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        
        token = request.query_params.get('token')
        if token:
            return token
        
        return ''

    def _verify_auth(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        return self.auth_business.verify_token(token)

    def ActionHuocheRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/huoche/register
        注册新用户并赠送初始火车和金币
        """
        return self.huoche_business.register_user(
            username=body.username,
            password=body.password
        )

    def ActionHuocheUserInfoGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取用户游戏信息接口
        GET /api/huoche/user/info/get
        获取用户游戏数据和火车列表
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.huoche_business.get_user_game_info(user.get('id'))

    def ActionHuocheTrainTypesGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取所有火车类型接口
        GET /api/huoche/train/types/get
        获取所有可购买的火车类型列表
        """
        return self.huoche_business.get_all_train_types()

    def ActionHuocheRoutesGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取可用线路接口
        GET /api/huoche/routes/get
        获取用户当前等级可使用的线路列表
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.huoche_business.get_available_routes(user.get('id'))

    def ActionHuocheRouteStationsGet(self, request: Request, route_id: int, authorization: Optional[str] = Header(None)):
        """
        获取线路站点接口
        GET /api/huoche/route/stations/get
        获取指定线路的所有站点
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.huoche_business.get_route_stations(route_id)

    def ActionHuocheTrainBuyPost(self, request: Request, body: BuyTrainRequest, authorization: Optional[str] = Header(None)):
        """
        购买火车接口
        POST /api/huoche/train/buy
        购买新火车
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.huoche_business.buy_train(
            user_id=user.get('id'),
            train_type_id=body.train_type_id,
            train_name=body.train_name
        )

    def ActionHuocheTrainUpgradePost(self, request: Request, body: UpgradeTrainRequest, authorization: Optional[str] = Header(None)):
        """
        升级火车属性接口
        POST /api/huoche/train/upgrade
        升级火车的速度/容量/效率/可靠性
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.huoche_business.upgrade_train_attribute(
            user_id=user.get('id'),
            train_id=body.train_id,
            attribute=body.attribute
        )

    def ActionHuocheTrainRepairPost(self, request: Request, body: RepairTrainRequest, authorization: Optional[str] = Header(None)):
        """
        维修火车接口
        POST /api/huoche/train/repair
        修复火车磨损
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.huoche_business.repair_train(
            user_id=user.get('id'),
            train_id=body.train_id
        )

    def ActionHuocheGameStartPost(self, request: Request, body: StartGameRequest, authorization: Optional[str] = Header(None)):
        """
        开始游戏接口
        POST /api/huoche/game/start
        开始一次火车驾驶任务
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.huoche_business.start_game(
            user_id=user.get('id'),
            train_id=body.train_id,
            route_id=body.route_id
        )

    def ActionHuocheGameCompletePost(self, request: Request, body: CompleteGameRequest, authorization: Optional[str] = Header(None)):
        """
        完成游戏接口
        POST /api/huoche/game/complete
        提交游戏结果并获得奖励
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        
        game_data = {
            'actual_duration': body.actual_duration,
            'distance': body.distance,
            'avg_speed': body.avg_speed,
            'max_speed': body.max_speed,
            'passengers_transported': body.passengers_transported,
            'cargo_transported': body.cargo_transported,
            'signal_violations': body.signal_violations,
            'station_stops': body.station_stops,
            'perfect_stops': body.perfect_stops,
            'weather_condition': body.weather_condition,
            'breakdowns': body.breakdowns,
            'passenger_satisfaction': body.passenger_satisfaction,
            'cargo_condition': body.cargo_condition,
            'coins_earned': body.coins_earned,
            'exp_earned': body.exp_earned,
            'is_perfect': 1 if body.is_perfect else 0
        }
        
        return self.huoche_business.complete_game(
            user_id=user.get('id'),
            game_record_id=body.game_record_id,
            game_data=game_data
        )

    def ActionHuocheGameHistoryGet(self, request: Request, limit: int = 20, authorization: Optional[str] = Header(None)):
        """
        获取游戏历史接口
        GET /api/huoche/game/history/get
        获取用户的游戏历史记录
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.huoche_business.get_game_history(user.get('id'), limit)

    def ActionHuocheBestScoresGet(self, request: Request, limit: int = 10, authorization: Optional[str] = Header(None)):
        """
        获取最佳成绩接口
        GET /api/huoche/best/scores/get
        获取用户的最佳游戏成绩排行榜
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.huoche_business.get_best_scores(user.get('id'), limit)
