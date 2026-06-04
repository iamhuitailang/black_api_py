from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, Request, Header
from pydantic import BaseModel, Field
from app.business.auth import AuthBusiness
from app.business.maomi import (
    UserProfileBusiness, CatBusiness, CafeBusiness, DrinkBusiness,
    OrderBusiness, ItemBusiness, ActivityBusiness, VisitorBusiness, GameBusiness
)


class MaomiRegisterRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")
    nickname: str = Field(default='猫咪店长', description="昵称")


class MaomiCatAddRequest(BaseModel):
    name: str = Field(..., description="猫咪名字")
    breed: str = Field(..., description="品种")
    color: str = Field(..., description="颜色")
    personality: str = Field(..., description="性格")
    favorite_food: str = Field(default='', description="喜欢的食物")
    favorite_toy: str = Field(default='', description="喜欢的玩具")
    cuteness: int = Field(default=50, description="可爱度")


class MaomiCatUpdateRequest(BaseModel):
    cat_id: int = Field(..., description="猫咪ID")
    name: str = Field(default=None, description="猫咪名字")
    favorite_food: str = Field(default=None, description="喜欢的食物")
    favorite_toy: str = Field(default=None, description="喜欢的玩具")


class MaomiDrinkAddRequest(BaseModel):
    name: str = Field(..., description="名称")
    type: str = Field(..., description="类型: drink/dessert")
    price: int = Field(..., description="价格")
    cost: int = Field(default=0, description="成本")
    description: str = Field(default='', description="描述")
    preparation_time: int = Field(default=5, description="制作时间")


class MaomiDrinkUpdateRequest(BaseModel):
    drink_id: int = Field(..., description="饮品ID")
    name: str = Field(default=None, description="名称")
    type: str = Field(default=None, description="类型")
    price: int = Field(default=None, description="价格")
    cost: int = Field(default=None, description="成本")
    description: str = Field(default=None, description="描述")
    stock: int = Field(default=None, description="库存")
    preparation_time: int = Field(default=None, description="制作时间")


class MaomiOrderGenerateRequest(BaseModel):
    customer_name: str = Field(..., description="顾客名字")
    drink_ids: List[int] = Field(..., description="饮品ID列表")
    cat_id: int = Field(default=0, description="陪伴猫咪ID")
    is_special: int = Field(default=0, description="是否特殊订单")
    activity_id: int = Field(default=0, description="活动ID")


class MaomiActivityAddRequest(BaseModel):
    name: str = Field(..., description="活动名称")
    type: str = Field(..., description="活动类型")
    description: str = Field(default='', description="活动描述")
    reward_coins: int = Field(default=0, description="金币奖励")
    reward_experience: int = Field(default=0, description="经验奖励")
    duration_minutes: int = Field(default=60, description="持续时间")
    max_participants: int = Field(default=10, description="最大参与人数")


class MaomiItemBuyRequest(BaseModel):
    item_id: int = Field(..., description="物品ID")
    quantity: int = Field(default=1, description="数量")


class MaomiItemUseRequest(BaseModel):
    item_id: int = Field(..., description="物品ID")
    cat_id: int = Field(default=None, description="猫咪ID")


class MaomiCafeUpdateRequest(BaseModel):
    name: str = Field(default=None, description="咖啡馆名称")
    open_time: str = Field(default=None, description="开门时间")
    close_time: str = Field(default=None, description="关门时间")
    background_image: str = Field(default=None, description="背景图片")


class MaomiProfileUpdateRequest(BaseModel):
    nickname: str = Field(default=None, description="昵称")
    avatar: str = Field(default=None, description="头像")
    cafe_name: str = Field(default=None, description="咖啡馆名称")


class MaomiController:
    def __init__(self):
        self.auth_business = AuthBusiness()
        self.profile_business = UserProfileBusiness()
        self.cat_business = CatBusiness()
        self.cafe_business = CafeBusiness()
        self.drink_business = DrinkBusiness()
        self.order_business = OrderBusiness()
        self.item_business = ItemBusiness()
        self.activity_business = ActivityBusiness()
        self.visitor_business = VisitorBusiness()
        self.game_business = GameBusiness()

    def _get_user_id(self, request: Request, authorization: Optional[str]) -> Optional[int]:
        if authorization and authorization.startswith('Bearer '):
            token = authorization[7:]
        else:
            token = request.query_params.get('token', '')
        
        if not token:
            return None
        
        user = self.auth_business.verify_token(token)
        if user:
            return user.get('id')
        return None

    def ActionMaomiRegisterPost(self, request: Request, body: MaomiRegisterRequest):
        """
        注册接口
        POST /api/maomi/register
        创建新用户并初始化游戏数据
        """
        return self.game_business.register(
            username=body.username,
            password=body.password,
            nickname=body.nickname
        )

    def ActionMaomiGameStateGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取游戏状态接口
        GET /api/maomi/game/state/get
        获取用户的完整游戏状态数据
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.game_business.get_game_state(user_id)

    def ActionMaomiGameInitGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        初始化游戏接口
        GET /api/maomi/game/init
        初始化用户游戏数据
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.game_business.init_game(user_id)

    def ActionMaomiGameRecordsGet(self, request: Request, authorization: Optional[str] = Header(None),
                                   limit: int = Query(default=50, ge=1, le=200, description="记录数量")):
        """
        获取游戏记录接口
        GET /api/maomi/game/records/get
        获取用户的游戏操作记录
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.game_business.get_game_records(user_id, limit)

    def ActionMaomiShareGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取分享数据接口
        GET /api/maomi/share/get
        获取用户的分享数据
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.game_business.get_share_data(user_id)

    def ActionMaomiDailyCheckinGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        每日签到接口
        GET /api/maomi/daily/checkin
        每日签到领取奖励
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.game_business.daily_checkin(user_id)

    def ActionMaomiProfileGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取用户档案接口
        GET /api/maomi/profile/get
        获取用户档案信息
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.profile_business.get_profile(user_id)

    def ActionMaomiProfileUpdatePost(self, request: Request, body: MaomiProfileUpdateRequest,
                                      authorization: Optional[str] = Header(None)):
        """
        更新用户档案接口
        POST /api/maomi/profile/update
        更新用户档案信息
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.profile_business.update_profile(
            user_id=user_id,
            nickname=body.nickname,
            avatar=body.avatar,
            cafe_name=body.cafe_name
        )

    def ActionMaomiLeaderboardGet(self, request: Request):
        """
        获取排行榜接口
        GET /api/maomi/leaderboard/get
        获取玩家排行榜
        """
        return self.profile_business.get_leaderboard()

    def ActionMaomiCatListGet(self, request: Request, authorization: Optional[str] = Header(None),
                               include_visitors: bool = Query(default=False, description="是否包含访客猫咪")):
        """
        获取猫咪列表接口
        GET /api/maomi/cat/list/get
        获取用户所有猫咪
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.cat_business.get_all_cats(user_id, include_visitors)

    def ActionMaomiCatGet(self, request: Request, authorization: Optional[str] = Header(None),
                           id: int = Query(..., ge=1, description="猫咪ID")):
        """
        获取单个猫咪接口
        GET /api/maomi/cat/get
        获取单个猫咪详情
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.cat_business.get_cat(id)

    def ActionMaomiCatAddPost(self, request: Request, body: MaomiCatAddRequest,
                               authorization: Optional[str] = Header(None)):
        """
        添加猫咪接口
        POST /api/maomi/cat/add
        添加新猫咪
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.cat_business.add_cat(
            user_id=user_id,
            name=body.name,
            breed=body.breed,
            color=body.color,
            personality=body.personality,
            favorite_food=body.favorite_food,
            favorite_toy=body.favorite_toy,
            cuteness=body.cuteness
        )

    def ActionMaomiCatUpdatePost(self, request: Request, body: MaomiCatUpdateRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        更新猫咪接口
        POST /api/maomi/cat/update
        更新猫咪信息
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.cat_business.update_cat(
            user_id=user_id,
            cat_id=body.cat_id,
            name=body.name,
            favorite_food=body.favorite_food,
            favorite_toy=body.favorite_toy
        )

    def ActionMaomiCatFeedGet(self, request: Request, authorization: Optional[str] = Header(None),
                               id: int = Query(..., ge=1, description="猫咪ID")):
        """
        喂食猫咪接口
        GET /api/maomi/cat/feed
        给猫咪喂食
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.cat_business.feed_cat(user_id, id)

    def ActionMaomiCatPlayGet(self, request: Request, authorization: Optional[str] = Header(None),
                               id: int = Query(..., ge=1, description="猫咪ID")):
        """
        陪猫咪玩耍接口
        GET /api/maomi/cat/play
        陪猫咪玩耍
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.cat_business.play_with_cat(user_id, id)

    def ActionMaomiCatCleanGet(self, request: Request, authorization: Optional[str] = Header(None),
                                id: int = Query(..., ge=1, description="猫咪ID")):
        """
        清洁猫咪接口
        GET /api/maomi/cat/clean
        给猫咪清洁
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.cat_business.clean_cat(user_id, id)

    def ActionMaomiCatDelete(self, request: Request, authorization: Optional[str] = Header(None),
                              id: int = Query(..., ge=1, description="猫咪ID")):
        """
        删除猫咪接口
        DELETE /api/maomi/cat/delete
        删除猫咪
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.cat_business.delete_cat(user_id, id)

    def ActionMaomiCafeGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取咖啡馆信息接口
        GET /api/maomi/cafe/get
        获取咖啡馆信息
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.cafe_business.get_cafe(user_id)

    def ActionMaomiCafeUpdatePost(self, request: Request, body: MaomiCafeUpdateRequest,
                                   authorization: Optional[str] = Header(None)):
        """
        更新咖啡馆信息接口
        POST /api/maomi/cafe/update
        更新咖啡馆信息
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.cafe_business.update_cafe(
            user_id=user_id,
            name=body.name,
            open_time=body.open_time,
            close_time=body.close_time,
            background_image=body.background_image
        )

    def ActionMaomiCafeToggleOpenGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        切换咖啡馆营业状态接口
        GET /api/maomi/cafe/toggle/open
        开关咖啡馆
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.cafe_business.toggle_open(user_id)

    def ActionMaomiCafeUpdateWeatherGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        更新天气接口
        GET /api/maomi/cafe/update/weather
        随机更新天气
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.cafe_business.update_weather(user_id)

    def ActionMaomiCafeUpgradeGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        升级咖啡馆接口
        GET /api/maomi/cafe/upgrade
        升级咖啡馆等级
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.cafe_business.upgrade_cafe(user_id)

    def ActionMaomiCafeCleanGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        清洁咖啡馆接口
        GET /api/maomi/cafe/clean
        清洁咖啡馆
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.cafe_business.clean_cafe(user_id)

    def ActionMaomiDrinkListGet(self, request: Request, authorization: Optional[str] = Header(None),
                                 type: str = Query(default=None, description="类型: drink/dessert")):
        """
        获取饮品列表接口
        GET /api/maomi/drink/list/get
        获取所有饮品
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        if type:
            return self.drink_business.get_drinks_by_type(user_id, type)
        return self.drink_business.get_all_drinks(user_id)

    def ActionMaomiDrinkAvailableGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取可用饮品接口
        GET /api/maomi/drink/available/get
        获取所有上架饮品
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.drink_business.get_available_drinks(user_id)

    def ActionMaomiDrinkGet(self, request: Request, authorization: Optional[str] = Header(None),
                             id: int = Query(..., ge=1, description="饮品ID")):
        """
        获取单个饮品接口
        GET /api/maomi/drink/get
        获取单个饮品详情
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.drink_business.get_drink(id)

    def ActionMaomiDrinkAddPost(self, request: Request, body: MaomiDrinkAddRequest,
                                 authorization: Optional[str] = Header(None)):
        """
        添加饮品接口
        POST /api/maomi/drink/add
        添加新饮品
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.drink_business.add_drink(
            user_id=user_id,
            name=body.name,
            type=body.type,
            price=body.price,
            cost=body.cost,
            description=body.description,
            preparation_time=body.preparation_time
        )

    def ActionMaomiDrinkUpdatePost(self, request: Request, body: MaomiDrinkUpdateRequest,
                                    authorization: Optional[str] = Header(None)):
        """
        更新饮品接口
        POST /api/maomi/drink/update
        更新饮品信息
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.drink_business.update_drink(
            user_id=user_id,
            drink_id=body.drink_id,
            name=body.name,
            type=body.type,
            price=body.price,
            cost=body.cost,
            description=body.description,
            stock=body.stock,
            preparation_time=body.preparation_time
        )

    def ActionMaomiDrinkToggleAvailableGet(self, request: Request, authorization: Optional[str] = Header(None),
                                            id: int = Query(..., ge=1, description="饮品ID")):
        """
        切换饮品上架状态接口
        GET /api/maomi/drink/toggle/available
        切换饮品上架/下架
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.drink_business.toggle_available(user_id, id)

    def ActionMaomiDrinkDelete(self, request: Request, authorization: Optional[str] = Header(None),
                                id: int = Query(..., ge=1, description="饮品ID")):
        """
        删除饮品接口
        DELETE /api/maomi/drink/delete
        删除饮品
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.drink_business.delete_drink(user_id, id)

    def ActionMaomiOrderListGet(self, request: Request, authorization: Optional[str] = Header(None),
                                 limit: int = Query(default=20, ge=1, le=100, description="数量")):
        """
        获取订单列表接口
        GET /api/maomi/order/list/get
        获取所有订单
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.order_business.get_all_orders(user_id, limit)

    def ActionMaomiOrderPendingGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取待处理订单接口
        GET /api/maomi/order/pending/get
        获取待处理订单
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.order_business.get_pending_orders(user_id)

    def ActionMaomiOrderCompletedGet(self, request: Request, authorization: Optional[str] = Header(None),
                                      limit: int = Query(default=50, ge=1, le=200, description="数量")):
        """
        获取已完成订单接口
        GET /api/maomi/order/completed/get
        获取已完成订单
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.order_business.get_completed_orders(user_id, limit)

    def ActionMaomiOrderGet(self, request: Request, authorization: Optional[str] = Header(None),
                             id: int = Query(..., ge=1, description="订单ID")):
        """
        获取单个订单接口
        GET /api/maomi/order/get
        获取单个订单详情
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.order_business.get_order(id)

    def ActionMaomiOrderGeneratePost(self, request: Request, body: MaomiOrderGenerateRequest,
                                      authorization: Optional[str] = Header(None)):
        """
        生成订单接口
        POST /api/maomi/order/generate
        生成新订单
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.order_business.generate_order(
            user_id=user_id,
            customer_name=body.customer_name,
            drink_ids=body.drink_ids,
            cat_id=body.cat_id,
            is_special=body.is_special,
            activity_id=body.activity_id
        )

    def ActionMaomiOrderRandomGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        随机生成订单接口
        GET /api/maomi/order/random
        随机生成新订单
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.order_business.generate_random_order(user_id)

    def ActionMaomiOrderCompleteGet(self, request: Request, authorization: Optional[str] = Header(None),
                                     id: int = Query(..., ge=1, description="订单ID")):
        """
        完成订单接口
        GET /api/maomi/order/complete
        完成订单
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.order_business.complete_order(user_id, id)

    def ActionMaomiOrderCancelGet(self, request: Request, authorization: Optional[str] = Header(None),
                                   id: int = Query(..., ge=1, description="订单ID")):
        """
        取消订单接口
        GET /api/maomi/order/cancel
        取消订单
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.order_business.cancel_order(user_id, id)

    def ActionMaomiOrderStatisticsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取订单统计接口
        GET /api/maomi/order/statistics/get
        获取订单统计数据
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.order_business.get_statistics(user_id)

    def ActionMaomiItemShopGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取商店物品接口
        GET /api/maomi/item/shop/get
        获取商店所有物品
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        profile_result = self.profile_business.get_profile(user_id)
        level = 1
        if profile_result.get('code') == 0 and profile_result.get('data'):
            level = profile_result['data'].get('level', 1)
        return self.item_business.get_all_items(level)

    def ActionMaomiItemUserGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取用户物品接口
        GET /api/maomi/item/user/get
        获取用户已购买物品
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.item_business.get_user_items(user_id)

    def ActionMaomiItemGet(self, request: Request, authorization: Optional[str] = Header(None),
                            id: int = Query(..., ge=1, description="物品ID")):
        """
        获取单个物品接口
        GET /api/maomi/item/get
        获取单个物品详情
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.item_business.get_item(id)

    def ActionMaomiItemBuyPost(self, request: Request, body: MaomiItemBuyRequest,
                                authorization: Optional[str] = Header(None)):
        """
        购买物品接口
        POST /api/maomi/item/buy
        购买物品
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.item_business.buy_item(user_id, body.item_id, body.quantity)

    def ActionMaomiItemUsePost(self, request: Request, body: MaomiItemUseRequest,
                                authorization: Optional[str] = Header(None)):
        """
        使用物品接口
        POST /api/maomi/item/use
        使用物品
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.item_business.use_item(user_id, body.item_id, body.cat_id)

    def ActionMaomiActivityListGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取活动列表接口
        GET /api/maomi/activity/list/get
        获取所有活动
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.activity_business.get_all_activities(user_id)

    def ActionMaomiActivityActiveGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取进行中活动接口
        GET /api/maomi/activity/active/get
        获取进行中的活动
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.activity_business.get_active_activities(user_id)

    def ActionMaomiActivityUpcomingGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取即将开始活动接口
        GET /api/maomi/activity/upcoming/get
        获取即将开始的活动
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.activity_business.get_upcoming_activities(user_id)

    def ActionMaomiActivityGet(self, request: Request, authorization: Optional[str] = Header(None),
                                id: int = Query(..., ge=1, description="活动ID")):
        """
        获取单个活动接口
        GET /api/maomi/activity/get
        获取单个活动详情
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.activity_business.get_activity(id)

    def ActionMaomiActivityAddPost(self, request: Request, body: MaomiActivityAddRequest,
                                    authorization: Optional[str] = Header(None)):
        """
        添加活动接口
        POST /api/maomi/activity/add
        添加新活动
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.activity_business.add_activity(
            user_id=user_id,
            name=body.name,
            type=body.type,
            description=body.description,
            reward_coins=body.reward_coins,
            reward_experience=body.reward_experience,
            duration_minutes=body.duration_minutes,
            max_participants=body.max_participants
        )

    def ActionMaomiActivityStartGet(self, request: Request, authorization: Optional[str] = Header(None),
                                     id: int = Query(..., ge=1, description="活动ID")):
        """
        开始活动接口
        GET /api/maomi/activity/start
        开始活动
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.activity_business.start_activity(user_id, id)

    def ActionMaomiActivityEndGet(self, request: Request, authorization: Optional[str] = Header(None),
                                   id: int = Query(..., ge=1, description="活动ID")):
        """
        结束活动接口
        GET /api/maomi/activity/end
        结束活动
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.activity_business.end_activity(user_id, id)

    def ActionMaomiActivityDelete(self, request: Request, authorization: Optional[str] = Header(None),
                                   id: int = Query(..., ge=1, description="活动ID")):
        """
        删除活动接口
        DELETE /api/maomi/activity/delete
        删除活动
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.activity_business.delete_activity(user_id, id)

    def ActionMaomiVisitorListGet(self, request: Request, authorization: Optional[str] = Header(None),
                                   limit: int = Query(default=50, ge=1, le=200, description="数量")):
        """
        获取访客列表接口
        GET /api/maomi/visitor/list/get
        获取所有访客记录
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.visitor_business.get_all_visitors(user_id, limit)

    def ActionMaomiVisitorActiveGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前访客接口
        GET /api/maomi/visitor/active/get
        获取当前在店访客
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.visitor_business.get_active_visitors(user_id)

    def ActionMaomiVisitorGenerateGet(self, request: Request, authorization: Optional[str] = Header(None),
                                       bring_cat: bool = Query(default=False, description="是否带猫咪")):
        """
        生成访客接口
        GET /api/maomi/visitor/generate
        随机生成新访客
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.visitor_business.generate_visitor(user_id, bring_cat)

    def ActionMaomiVisitorLeaveGet(self, request: Request, authorization: Optional[str] = Header(None),
                                    id: int = Query(..., ge=1, description="访客ID")):
        """
        访客离开接口
        GET /api/maomi/visitor/leave
        访客离开咖啡馆
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.visitor_business.visitor_leave(user_id, id)

    def ActionMaomiVisitorClearGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        清除所有访客接口
        GET /api/maomi/visitor/clear
        清除所有在店访客
        """
        user_id = self._get_user_id(request, authorization)
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        return self.visitor_business.clear_all_visitors(user_id)
