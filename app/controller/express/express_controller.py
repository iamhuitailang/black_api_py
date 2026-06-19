from typing import Optional, List
from fastapi import Query, Request, Header
from pydantic import BaseModel, Field
from app.business.express import ExpressOrderBusiness, UserProfileBusiness
from app.business.auth import AuthBusiness


class CreateOrderRequest(BaseModel):
    courier_company: str = Field(..., description="快递公司")
    pickup_location: str = Field(..., description="取件地点")
    estimated_arrival: str = Field(..., description="预计到达时间")
    pickup_deadline: str = Field(..., description="取件截止时间")
    reward: float = Field(..., ge=0, description="报酬金额")
    pickup_code: Optional[str] = Field(default='', description="取件码")
    remark: Optional[str] = Field(default='', description="备注")


class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = Field(default=None, description="昵称")
    avatar: Optional[str] = Field(default=None, description="头像URL")


class ExpressController:
    def __init__(self):
        self.order_business = ExpressOrderBusiness()
        self.profile_business = UserProfileBusiness()
        self.auth_business = AuthBusiness()
    
    def _get_user_id(self, request: Request, authorization: Optional[str] = None) -> int:
        if authorization and authorization.startswith('Bearer '):
            token = authorization[7:]
        else:
            token = request.query_params.get('token', '')
        
        if not token:
            return 0
        
        user = self.auth_business.verify_token(token)
        return user.get('id') if user else 0
    
    def ActionExpressOrderListGet(self, request: Request, 
                                  status: Optional[str] = Query(None, description="订单状态: pending/accepted/picked_up/delivered/cancelled"),
                                  page: int = Query(1, ge=1, description="页码"),
                                  page_size: int = Query(20, ge=1, le=100, description="每页数量"),
                                  authorization: Optional[str] = Header(None)):
        """
        获取订单列表接口
        GET /api/express/order/list/get
        支持按状态筛选，分页查询
        """
        user_id = self._get_user_id(request, authorization)
        
        return self.order_business.get_order_list(
            status=status,
            page=page,
            page_size=page_size,
            user_id=None,
            role=None
        )
    
    def ActionExpressOrderDetailGet(self, request: Request,
                                    id: int = Query(..., ge=1, description="订单ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取订单详情接口
        GET /api/express/order/detail/get
        根据订单ID获取订单详细信息
        """
        return self.order_business.get_order_detail(id)
    
    def ActionExpressOrderCreatePost(self, request: Request, 
                                     body: CreateOrderRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        创建订单接口
        POST /api/express/order/create
        发布快递代收请求
        """
        user_id = self._get_user_id(request, authorization)
        
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        
        return self.order_business.create_order(
            publisher_id=user_id,
            courier_company=body.courier_company,
            pickup_location=body.pickup_location,
            estimated_arrival=body.estimated_arrival,
            pickup_deadline=body.pickup_deadline,
            reward=body.reward,
            pickup_code=body.pickup_code,
            remark=body.remark
        )
    
    def ActionExpressOrderAcceptPost(self, request: Request,
                                     order_id: int = Query(..., ge=1, description="订单ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        接单接口
        POST /api/express/order/accept
        接单者接受订单
        """
        user_id = self._get_user_id(request, authorization)
        
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        
        return self.order_business.accept_order(order_id, user_id)
    
    def ActionExpressOrderPickupPost(self, request: Request,
                                     order_id: int = Query(..., ge=1, description="订单ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        标记取件接口
        POST /api/express/order/pickup
        接单者标记已取到快递
        """
        user_id = self._get_user_id(request, authorization)
        
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        
        return self.order_business.pick_up_order(order_id, user_id)
    
    def ActionExpressOrderDeliverPost(self, request: Request,
                                      order_id: int = Query(..., ge=1, description="订单ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        确认送达接口
        POST /api/express/order/deliver
        发布者确认已收到快递，订单完成并结算报酬
        """
        user_id = self._get_user_id(request, authorization)
        
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        
        return self.order_business.confirm_delivery(order_id, user_id)
    
    def ActionExpressOrderCancelPost(self, request: Request,
                                     order_id: int = Query(..., ge=1, description="订单ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        取消订单接口
        POST /api/express/order/cancel
        发布者取消订单
        """
        user_id = self._get_user_id(request, authorization)
        
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        
        return self.order_business.cancel_order(order_id, user_id)
    
    def ActionExpressOrderMyGet(self, request: Request,
                                role: str = Query('publisher', description="角色: publisher=我发布的, taker=我接的"),
                                status: Optional[str] = Query(None, description="订单状态"),
                                page: int = Query(1, ge=1, description="页码"),
                                page_size: int = Query(20, ge=1, le=100, description="每页数量"),
                                authorization: Optional[str] = Header(None)):
        """
        获取我的订单接口
        GET /api/express/order/my/get
        获取当前用户发布或接收的订单列表
        """
        user_id = self._get_user_id(request, authorization)
        
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        
        return self.order_business.get_order_list(
            status=status,
            page=page,
            page_size=page_size,
            user_id=user_id,
            role=role
        )
    
    def ActionExpressOrderStatsGet(self, request: Request,
                                   role: str = Query('publisher', description="角色: publisher=我发布的, taker=我接的"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取订单统计接口
        GET /api/express/order/stats/get
        获取当前用户各状态的订单数量统计
        """
        user_id = self._get_user_id(request, authorization)
        
        if not user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        
        return self.order_business.get_user_order_stats(user_id, role)
    
    def ActionExpressProfileGet(self, request: Request,
                                user_id: Optional[int] = Query(None, description="用户ID，不填则获取当前用户"),
                                authorization: Optional[str] = Header(None)):
        """
        获取用户资料接口
        GET /api/express/profile/get
        获取用户头像、昵称、信誉评分等信息
        """
        current_user_id = self._get_user_id(request, authorization)
        
        target_user_id = user_id if user_id and user_id > 0 else current_user_id
        
        if not target_user_id:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        
        return self.profile_business.get_profile(target_user_id)
    
    def ActionExpressProfileUpdatePost(self, request: Request,
                                       body: UpdateProfileRequest,
                                       authorization: Optional[str] = Header(None)):
        """
        更新用户资料接口
        POST /api/express/profile/update
        更新当前用户的昵称、头像等信息
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
            avatar=body.avatar
        )
    
    def ActionExpressRankListGet(self, request: Request,
                                 limit: int = Query(20, ge=1, le=100, description="排行榜数量")):
        """
        获取信誉排行榜接口
        GET /api/express/rank/list/get
        按信誉评分和完成订单数排序的用户排行榜
        """
        return self.profile_business.get_rank_list(limit)
