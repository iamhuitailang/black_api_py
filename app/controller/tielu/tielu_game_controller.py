from typing import Optional, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CargoItem(BaseModel):
    goods_type: str = Field(..., description="货物类型")
    amount: int = Field(..., description="货物数量")


class StartTransportRequest(BaseModel):
    train_id: int = Field(..., description="火车ID")
    destination: str = Field(..., description="目的地城市")
    cargo: List[CargoItem] = Field(default=[], description="装载货物列表")


class CityUnlockRequest(BaseModel):
    city_name: str = Field(..., description="城市名称")


class TrainUpgradeRequest(BaseModel):
    train_id: int = Field(..., description="火车ID")


class BuyTrainRequest(BaseModel):
    train_type: str = Field(..., description="火车类型")


class TieluGameController:
    def __init__(self):
        from app.business.tielu import (
            TieluUserBusiness, TieluTrainBusiness, TieluCityBusiness,
            TieluWarehouseBusiness, TieluShopBusiness, TieluGameBusiness
        )
        self.user_business = TieluUserBusiness()
        self.train_business = TieluTrainBusiness()
        self.city_business = TieluCityBusiness()
        self.warehouse_business = TieluWarehouseBusiness()
        self.shop_business = TieluShopBusiness()
        self.game_business = TieluGameBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def _require_auth(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return None, {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        return user, None

    def ActionTieluGameDataGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取游戏数据接口
        GET /api/tielu/game/data/get
        获取用户的完整游戏数据（用户信息、城市、火车、仓库）
        """
        user, error = self._require_auth(request, authorization)
        if error:
            return error

        return self.game_business.get_game_data(user.get('id'))

    def ActionTieluGameCitiesGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取城市列表接口
        GET /api/tielu/game/cities/get
        获取用户的所有城市信息
        """
        user, error = self._require_auth(request, authorization)
        if error:
            return error

        return self.city_business.get_user_cities(user.get('id'))

    def ActionTieluGameCitiesUnlockPost(self, request: Request, body: CityUnlockRequest,
                                         authorization: Optional[str] = Header(None)):
        """
        解锁城市接口
        POST /api/tielu/game/cities/unlock
        花费金币解锁新城市
        """
        user, error = self._require_auth(request, authorization)
        if error:
            return error

        return self.city_business.unlock_city(user.get('id'), body.city_name)

    def ActionTieluGameTrainsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取火车列表接口
        GET /api/tielu/game/trains/get
        获取用户的所有火车信息
        """
        user, error = self._require_auth(request, authorization)
        if error:
            return error

        return self.train_business.get_user_trains(user.get('id'))

    def ActionTieluGameTrainsIdleGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取空闲火车接口
        GET /api/tielu/game/trains/idle/get
        获取用户状态为空闲的火车
        """
        user, error = self._require_auth(request, authorization)
        if error:
            return error

        return self.train_business.get_idle_trains(user.get('id'))

    def ActionTieluGameTrainsMovingGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取行驶中火车接口
        GET /api/tielu/game/trains/moving/get
        获取用户正在行驶的火车
        """
        user, error = self._require_auth(request, authorization)
        if error:
            return error

        return self.train_business.get_moving_trains(user.get('id'))

    def ActionTieluGameTrainsUpgradePost(self, request: Request, body: TrainUpgradeRequest,
                                           authorization: Optional[str] = Header(None)):
        """
        升级火车接口
        POST /api/tielu/game/trains/upgrade
        花费金币升级火车等级
        """
        user, error = self._require_auth(request, authorization)
        if error:
            return error

        return self.train_business.upgrade_train(body.train_id, user.get('id'))

    def ActionTieluGameTransportStartPost(self, request: Request, body: StartTransportRequest,
                                           authorization: Optional[str] = Header(None)):
        """
        开始运输接口
        POST /api/tielu/game/transport/start
        发送火车开始运输任务
        """
        user, error = self._require_auth(request, authorization)
        if error:
            return error

        cargo_list = [{'goods_type': item.goods_type, 'amount': item.amount} for item in body.cargo]

        return self.game_business.start_transport(
            user_id=user.get('id'),
            train_id=body.train_id,
            destination=body.destination,
            cargo=cargo_list
        )

    def ActionTieluGameTransportCheckGet(self, request: Request, authorization: Optional[str] = Header(None),
                                          train_id: Optional[int] = Query(None, description="火车ID（可选）")):
        """
        检查运输状态接口
        GET /api/tielu/game/transport/check
        检查火车是否到达目的地，如果到达则完成运输
        如果不传 train_id，则检查所有行驶中的火车
        """
        user, error = self._require_auth(request, authorization)
        if error:
            return error

        if train_id:
            return self.game_business.check_arrival(user.get('id'), train_id)
        else:
            return self.train_business.get_moving_trains(user.get('id'))

    def ActionTieluGameTransportCollectPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        收集所有已到达的运输接口
        POST /api/tielu/game/transport/collect
        收集所有已到达目的地的火车运输奖励
        """
        user, error = self._require_auth(request, authorization)
        if error:
            return error

        return self.game_business.collect_all_arrived(user.get('id'))

    def ActionTieluGameWarehouseGet(self, request: Request, authorization: Optional[str] = Header(None),
                                      city_name: Optional[str] = Query(None, description="城市名称（可选）")):
        """
        获取仓库信息接口
        GET /api/tielu/game/warehouse/get
        获取用户仓库信息，可选指定城市
        """
        user, error = self._require_auth(request, authorization)
        if error:
            return error

        if city_name:
            return self.warehouse_business.get_warehouse_by_city(user.get('id'), city_name)

        return self.warehouse_business.get_user_warehouse(user.get('id'))

    def ActionTieluGameWarehouseAddPost(self, request: Request, authorization: Optional[str] = Header(None),
                                         city_name: str = Query(..., description="城市名称"),
                                         goods_type: str = Query(..., description="货物类型"),
                                         amount: int = Query(..., description="数量")):
        """
        添加货物到仓库接口
        POST /api/tielu/game/warehouse/add
        向指定城市仓库添加货物（调试用）
        """
        user, error = self._require_auth(request, authorization)
        if error:
            return error

        return self.warehouse_business.add_goods(user.get('id'), city_name, goods_type, amount)

    def ActionTieluGameShopGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取商店商品接口
        GET /api/tielu/game/shop/get
        获取商店中可购买的火车和轨道
        """
        user, error = self._require_auth(request, authorization)
        if error:
            return error

        return self.shop_business.get_shop_items(user.get('level', 1))

    def ActionTieluGameShopBuyTrainPost(self, request: Request, body: BuyTrainRequest,
                                          authorization: Optional[str] = Header(None)):
        """
        购买火车接口
        POST /api/tielu/game/shop/buy/train
        在商店购买新火车
        """
        user, error = self._require_auth(request, authorization)
        if error:
            return error

        return self.shop_business.buy_train(user.get('id'), body.train_type)

    def ActionTieluGameGoodsConfigGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取货物配置接口
        GET /api/tielu/game/goods/config/get
        获取所有货物的配置信息
        """
        user, error = self._require_auth(request, authorization)
        if error:
            return error

        return self.city_business.get_goods_config()

    def ActionTieluGameTrainConfigGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取火车配置接口
        GET /api/tielu/game/train/config/get
        获取所有火车类型的配置信息
        """
        user, error = self._require_auth(request, authorization)
        if error:
            return error

        return self.train_business.get_train_config()

    def ActionTieluGameStationUpgradePost(self, request: Request, authorization: Optional[str] = Header(None),
                                            city_name: str = Query(..., description="城市名称")):
        """
        升级车站接口
        POST /api/tielu/game/station/upgrade
        升级指定城市的车站等级
        """
        user, error = self._require_auth(request, authorization)
        if error:
            return error

        return self.city_business.upgrade_city_station(user.get('id'), city_name)
