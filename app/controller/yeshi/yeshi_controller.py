from typing import Optional
from fastapi import APIRouter, Query, Request, Header
from pydantic import BaseModel, Field
from app.business.auth import AuthBusiness
from app.business.yeshi import (
    GameUserBusiness, GameBusiness,
    FoodBusiness, OrderBusiness, UpgradeBusiness
)


class RegisterRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class CreateOrderRequest(BaseModel):
    food_id: int = Field(..., description="食物ID")
    guest_id: Optional[int] = Field(None, description="客人ID")


class CompleteOrderRequest(BaseModel):
    order_id: int = Field(..., description="订单ID")
    success: bool = Field(True, description="是否成功")
    quality: int = Field(80, description="质量分数")
    time_spent: int = Field(0, description="耗时(秒)")


class UnlockFoodRequest(BaseModel):
    food_id: int = Field(..., description="食物ID")


class PurchaseUpgradeRequest(BaseModel):
    upgrade_id: int = Field(..., description="升级项ID")


class YeshiController:
    def __init__(self):
        self.auth_business = AuthBusiness()
        self.game_user_business = GameUserBusiness()
        self.game_business = GameBusiness()
        self.food_business = FoodBusiness()
        self.order_business = OrderBusiness()
        self.upgrade_business = UpgradeBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        
        token = request.query_params.get('token')
        if token:
            return token
        
        return ''

    def _get_game_user(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self.auth_business.verify_token(token)
        if not user:
            return None, {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        
        result = self.game_user_business.get_or_create_game_user(user.get('id'))
        if result.get('code') != 0:
            return None, result
        
        game_user = result.get('data')
        return game_user, None

    def ActionYeshiRegisterPost(self, request: Request, body: RegisterRequest):
        """
        注册接口
        POST /api/yeshi/register
        新用户注册并创建游戏角色
        """
        if not body.username or not body.username.strip():
            return {
                'code': 1,
                'message': '用户名不能为空',
                'data': None
            }
        
        if not body.password or len(body.password) < 6:
            return {
                'code': 1,
                'message': '密码长度至少6位',
                'data': None
            }
        
        from app.model.auth import UserModel
        user_model = UserModel()
        existing = user_model.get_by_username(body.username.strip())
        if existing:
            return {
                'code': 1,
                'message': '用户名已存在',
                'data': None
            }
        
        user_id = user_model.create(body.username.strip(), body.password)
        
        self.game_user_business.get_or_create_game_user(user_id)
        
        login_result = self.auth_business.login(body.username.strip(), body.password)
        
        return login_result

    def ActionYeshiUserGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取游戏用户信息
        GET /api/yeshi/user/get
        获取当前登录用户的游戏数据
        """
        game_user, error = self._get_game_user(request, authorization)
        if error:
            return error
        
        result = self.game_user_business.get_game_user_info(game_user['id'])
        return result

    def ActionYeshiGameStartPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        开始营业
        POST /api/yeshi/game/start
        开始新的营业会话
        """
        game_user, error = self._get_game_user(request, authorization)
        if error:
            return error
        
        result = self.game_business.start_session(game_user['id'])
        return result

    def ActionYeshiGameEndPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        结束营业
        POST /api/yeshi/game/end
        结束当前营业会话
        """
        game_user, error = self._get_game_user(request, authorization)
        if error:
            return error
        
        session = self.game_business.get_active_session(game_user['id'])
        if session.get('code') != 0 or not session.get('data'):
            return {
                'code': 1,
                'message': '没有进行中的营业',
                'data': None
            }
        
        session_id = session['data']['session']['id']
        result = self.game_business.end_session(game_user['id'], session_id)
        return result

    def ActionYeshiGameSessionGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前营业状态
        GET /api/yeshi/game/session/get
        获取当前营业会话状态
        """
        game_user, error = self._get_game_user(request, authorization)
        if error:
            return error
        
        result = self.game_business.get_active_session(game_user['id'])
        return result

    def ActionYeshiWeatherGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前天气
        GET /api/yeshi/weather/get
        获取当前天气状态
        """
        game_user, error = self._get_game_user(request, authorization)
        if error:
            return error
        
        result = self.game_business.get_current_weather(game_user['id'])
        return result

    def ActionYeshiGuestGeneratePost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        生成新客人
        POST /api/yeshi/guest/generate
        生成一位新客人
        """
        game_user, error = self._get_game_user(request, authorization)
        if error:
            return error
        
        reputation = game_user.get('reputation', 0)
        result = self.game_business.generate_guest(game_user['id'], reputation)
        return result

    def ActionYeshiGuestActiveGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前客人列表
        GET /api/yeshi/guest/active/get
        获取当前正在等待的客人
        """
        game_user, error = self._get_game_user(request, authorization)
        if error:
            return error
        
        result = self.game_business.get_active_guests(game_user['id'])
        return result

    def ActionYeshiFoodAllGet(self, request: Request, page: int = Query(1, description="页码"), page_size: int = Query(50, description="每页数量")):
        """
        获取所有食物列表
        GET /api/yeshi/food/all/get
        获取所有食物（包括未解锁）
        """
        result = self.food_business.get_all_foods(page, page_size)
        return result

    def ActionYeshiFoodUnlockedGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取已解锁食物
        GET /api/yeshi/food/unlocked/get
        获取用户已解锁的食物列表
        """
        game_user, error = self._get_game_user(request, authorization)
        if error:
            return error
        
        result = self.food_business.get_user_unlocked_foods(game_user['id'])
        return result

    def ActionYeshiFoodUnlockableGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取可解锁食物
        GET /api/yeshi/food/unlockable/get
        获取当前可解锁的食物列表
        """
        game_user, error = self._get_game_user(request, authorization)
        if error:
            return error
        
        result = self.food_business.get_unlockable_foods(game_user['id'])
        return result

    def ActionYeshiFoodUnlockPost(self, request: Request, body: UnlockFoodRequest, authorization: Optional[str] = Header(None)):
        """
        解锁食物
        POST /api/yeshi/food/unlock
        花费金币解锁新食物
        """
        game_user, error = self._get_game_user(request, authorization)
        if error:
            return error
        
        result = self.food_business.unlock_food(game_user['id'], body.food_id)
        return result

    def ActionYeshiFoodCategoriesGet(self, request: Request):
        """
        获取食物分类
        GET /api/yeshi/food/categories/get
        获取所有食物分类
        """
        result = self.food_business.get_categories()
        return result

    def ActionYeshiOrderCreatePost(self, request: Request, body: CreateOrderRequest, authorization: Optional[str] = Header(None)):
        """
        创建订单
        POST /api/yeshi/order/create
        创建新的食物订单
        """
        game_user, error = self._get_game_user(request, authorization)
        if error:
            return error
        
        result = self.game_business.create_order(
            game_user_id=game_user['id'],
            food_id=body.food_id,
            guest_id=body.guest_id
        )
        return result

    def ActionYeshiOrderPendingGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取待处理订单
        GET /api/yeshi/order/pending/get
        获取待处理和烹饪中的订单
        """
        game_user, error = self._get_game_user(request, authorization)
        if error:
            return error
        
        result = self.order_business.get_pending_orders(game_user['id'])
        return result

    def ActionYeshiOrderCompletePost(self, request: Request, body: CompleteOrderRequest, authorization: Optional[str] = Header(None)):
        """
        完成订单
        POST /api/yeshi/order/complete
        完成一个订单并结算
        """
        game_user, error = self._get_game_user(request, authorization)
        if error:
            return error
        
        result = self.order_business.complete_order(
            game_user_id=game_user['id'],
            order_id=body.order_id,
            success=body.success,
            quality=body.quality,
            time_spent=body.time_spent
        )
        return result

    def ActionYeshiOrderStatsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取订单统计
        GET /api/yeshi/order/stats/get
        获取用户订单统计数据
        """
        game_user, error = self._get_game_user(request, authorization)
        if error:
            return error
        
        result = self.order_business.get_order_stats(game_user['id'])
        return result

    def ActionYeshiUpgradeAllGet(self, request: Request):
        """
        获取所有升级项
        GET /api/yeshi/upgrade/all/get
        获取所有可升级项
        """
        result = self.upgrade_business.get_all_upgrades()
        return result

    def ActionYeshiUpgradeAvailableGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取可购买升级
        GET /api/yeshi/upgrade/available/get
        获取当前可购买的升级项
        """
        game_user, error = self._get_game_user(request, authorization)
        if error:
            return error
        
        result = self.upgrade_business.get_available_upgrades(game_user['id'])
        return result

    def ActionYeshiUpgradePurchasePost(self, request: Request, body: PurchaseUpgradeRequest, authorization: Optional[str] = Header(None)):
        """
        购买升级
        POST /api/yeshi/upgrade/purchase
        购买并应用升级
        """
        game_user, error = self._get_game_user(request, authorization)
        if error:
            return error
        
        result = self.upgrade_business.purchase_upgrade(game_user['id'], body.upgrade_id)
        return result

    def ActionYeshiUpgradeUserGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取用户已购买升级
        GET /api/yeshi/upgrade/user/get
        获取用户已购买的所有升级
        """
        game_user, error = self._get_game_user(request, authorization)
        if error:
            return error
        
        result = self.upgrade_business.get_user_upgrades(game_user['id'])
        return result

    def ActionYeshiUpgradeCategoriesGet(self, request: Request):
        """
        获取升级分类
        GET /api/yeshi/upgrade/categories/get
        获取所有升级分类
        """
        result = self.upgrade_business.get_upgrade_categories()
        return result

    def ActionYeshiStatsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取游戏统计
        GET /api/yeshi/stats/get
        获取用户游戏统计数据
        """
        game_user, error = self._get_game_user(request, authorization)
        if error:
            return error
        
        result = self.game_business.get_game_stats(game_user['id'])
        return result

    def ActionYeshiLeaderboardGet(self, request: Request, limit: int = Query(10, description="排行榜数量")):
        """
        获取排行榜
        GET /api/yeshi/leaderboard/get
        获取金币排行榜
        """
        result = self.game_user_business.get_leaderboard(limit)
        return result

    def ActionYeshiConfigGet(self, request: Request):
        """
        获取游戏配置
        GET /api/yeshi/config/get
        获取游戏常量配置
        """
        weather_types = self.game_business.get_all_weather_types()
        guest_types = self.game_business.get_all_guest_types()
        special_requests = self.game_business.get_all_special_requests()
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'weather_types': weather_types.get('data', {}),
                'guest_types': guest_types.get('data', []),
                'special_requests': special_requests.get('data', [])
            }
        }
