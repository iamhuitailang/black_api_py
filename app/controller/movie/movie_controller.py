from typing import Optional, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")
    nickname: Optional[str] = Field(None, description="昵称")
    email: Optional[str] = Field(None, description="邮箱")
    phone: Optional[str] = Field(None, description="手机号")


class LoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = Field(None, description="昵称")
    email: Optional[str] = Field(None, description="邮箱")
    phone: Optional[str] = Field(None, description="手机号")
    avatar: Optional[str] = Field(None, description="头像URL")


class CreateOrderRequest(BaseModel):
    showtime_id: int = Field(..., description="场次ID")
    seats: List[str] = Field(..., description="座位列表")


class CreateReviewRequest(BaseModel):
    movie_id: int = Field(..., description="影片ID")
    rating: float = Field(..., description="评分")
    content: Optional[str] = Field(None, description="评价内容")


class UpdateReviewRequest(BaseModel):
    rating: Optional[float] = Field(None, description="评分")
    content: Optional[str] = Field(None, description="评价内容")


class MovieController:
    def __init__(self):
        from app.business.movie.auth_business import MovieAuthBusiness
        from app.business.movie.movie_business import MovieBusiness
        from app.business.movie.showtime_business import ShowtimeBusiness
        from app.business.movie.order_business import OrderBusiness
        from app.business.movie.review_business import ReviewBusiness
        self.auth_business = MovieAuthBusiness()
        self.movie_business = MovieBusiness()
        self.showtime_business = ShowtimeBusiness()
        self.order_business = OrderBusiness()
        self.review_business = ReviewBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.auth_business.verify_token(token)

    def ActionMovieRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/movie/register
        """
        return self.auth_business.register(
            username=body.username,
            password=body.password,
            nickname=body.nickname or '',
            email=body.email or '',
            phone=body.phone or ''
        )

    def ActionMovieLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录接口
        POST /api/movie/login
        """
        return self.auth_business.login(
            username=body.username,
            password=body.password
        )

    def ActionMovieLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        用户登出接口
        POST /api/movie/logout
        """
        token = self._get_token_from_header(request, authorization)
        return self.auth_business.logout(token)

    def ActionMovieCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息接口
        GET /api/movie/current/get
        """
        token = self._get_token_from_header(request, authorization)
        return self.auth_business.get_current_user(token)

    def ActionMoviePasswordChangePost(self, request: Request, body: ChangePasswordRequest,
                                       authorization: Optional[str] = Header(None)):
        """
        修改密码接口
        POST /api/movie/password/change
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.auth_business.change_password(
            user_id=user.get('id'),
            old_password=body.old_password,
            new_password=body.new_password
        )

    def ActionMovieProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                      authorization: Optional[str] = Header(None)):
        """
        更新用户资料接口
        POST /api/movie/profile/update
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        data = {}
        if body.nickname is not None:
            data['nickname'] = body.nickname
        if body.email is not None:
            data['email'] = body.email
        if body.phone is not None:
            data['phone'] = body.phone
        if body.avatar is not None:
            data['avatar'] = body.avatar

        return self.auth_business.update_profile(user_id=user.get('id'), data=data)

    def ActionMovieListGet(self, request: Request,
                           page: int = Query(1, ge=1, description="页码"),
                           page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                           status: Optional[int] = Query(None, description="影片状态"),
                           keyword: Optional[str] = Query(None, description="搜索关键词"),
                           genre: Optional[str] = Query(None, description="类型筛选")):
        """
        获取影片列表接口
        GET /api/movie/list/get
        """
        return self.movie_business.get_movie_list(
            page=page, page_size=page_size,
            status=status, keyword=keyword, genre=genre
        )

    def ActionMovieDetailGet(self, request: Request, movie_id: int = Query(..., description="影片ID")):
        """
        获取影片详情接口
        GET /api/movie/detail/get
        """
        return self.movie_business.get_movie_detail(movie_id=movie_id)

    def ActionMovieShowtimeListGet(self, request: Request,
                                   movie_id: int = Query(..., description="影片ID"),
                                   show_date: Optional[str] = Query(None, description="放映日期")):
        """
        获取影片场次接口
        GET /api/movie/showtime/list/get
        """
        return self.showtime_business.get_showtimes_by_movie(
            movie_id=movie_id, show_date=show_date
        )

    def ActionMovieShowtimeDetailGet(self, request: Request,
                                      showtime_id: int = Query(..., description="场次ID")):
        """
        获取场次详情接口
        GET /api/movie/showtime/detail/get
        """
        return self.showtime_business.get_showtime_detail(showtime_id=showtime_id)

    def ActionMovieOrderCreatePost(self, request: Request, body: CreateOrderRequest,
                                    authorization: Optional[str] = Header(None)):
        """
        创建订单接口
        POST /api/movie/order/create
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.order_business.create_order(
            user_id=user.get('id'),
            showtime_id=body.showtime_id,
            seats=body.seats
        )

    def ActionMovieOrderPayPost(self, request: Request, order_id: int = Query(..., description="订单ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        支付订单接口
        POST /api/movie/order/pay
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.order_business.pay_order(order_id=order_id, user_id=user.get('id'))

    def ActionMovieOrderCancelPost(self, request: Request, order_id: int = Query(..., description="订单ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        取消订单接口
        POST /api/movie/order/cancel
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.order_business.cancel_order(order_id=order_id, user_id=user.get('id'))

    def ActionMovieOrderDetailGet(self, request: Request, order_id: int = Query(..., description="订单ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取订单详情接口
        GET /api/movie/order/detail/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.order_business.get_order_detail(order_id=order_id, user_id=user.get('id'))

    def ActionMovieOrderListGet(self, request: Request,
                                page: int = Query(1, ge=1, description="页码"),
                                page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                status: Optional[int] = Query(None, description="订单状态"),
                                authorization: Optional[str] = Header(None)):
        """
        获取我的订单列表接口
        GET /api/movie/order/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.order_business.get_my_orders(
            user_id=user.get('id'),
            page=page, page_size=page_size, status=status
        )

    def ActionMovieReviewCreatePost(self, request: Request, body: CreateReviewRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        创建评价接口
        POST /api/movie/review/create
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.review_business.create_review(
            user_id=user.get('id'),
            movie_id=body.movie_id,
            rating=body.rating,
            content=body.content or ''
        )

    def ActionMovieReviewUpdatePost(self, request: Request, body: UpdateReviewRequest,
                                     review_id: int = Query(..., description="评价ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        更新评价接口
        POST /api/movie/review/update
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        data = {}
        if body.rating is not None:
            data['rating'] = body.rating
        if body.content is not None:
            data['content'] = body.content

        return self.review_business.update_review(
            review_id=review_id, user_id=user.get('id'), data=data
        )

    def ActionMovieReviewDeletePost(self, request: Request, review_id: int = Query(..., description="评价ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        删除评价接口
        POST /api/movie/review/delete
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.review_business.delete_review(review_id=review_id, user_id=user.get('id'))

    def ActionMovieReviewListGet(self, request: Request,
                                  movie_id: int = Query(..., description="影片ID"),
                                  page: int = Query(1, ge=1, description="页码"),
                                  page_size: int = Query(10, ge=1, le=100, description="每页数量")):
        """
        获取影片评价列表接口
        GET /api/movie/review/list/get
        """
        return self.review_business.get_reviews_by_movie(
            movie_id=movie_id, page=page, page_size=page_size
        )

    def ActionMovieReviewMineGet(self, request: Request,
                                  page: int = Query(1, ge=1, description="页码"),
                                  page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                  authorization: Optional[str] = Header(None)):
        """
        获取我的评价列表接口
        GET /api/movie/review/mine/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.review_business.get_my_reviews(
            user_id=user.get('id'), page=page, page_size=page_size
        )

    def ActionMovieReviewCheckGet(self, request: Request,
                                   movie_id: int = Query(..., description="影片ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        检查是否已评价接口
        GET /api/movie/review/check/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 0, 'msg': 'success', 'data': None}

        return self.review_business.get_user_review_for_movie(
            user_id=user.get('id'), movie_id=movie_id
        )